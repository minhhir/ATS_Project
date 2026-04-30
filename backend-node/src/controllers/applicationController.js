const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const { uploadToCloudinary } = require('../middlewares/upload');
const aiService = require('../services/aiService');
const Notification = require('../models/Notification');

exports.applyForJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const candidateId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(jobId)) throw new AppError('jobId không hợp lệ', 400);
        if (!req.file) throw new AppError('Vui lòng đính kèm file CV (PDF)', 400);

        const job = await Job.findOne({ _id: jobId, isActive: true });
        if (!job) throw new AppError('Công việc không tồn tại hoặc đã đóng', 404);
        const endOfDeadlineDay = new Date(job.deadline);
        endOfDeadlineDay.setHours(23, 59, 59, 999);
        if (job.deadline && new Date() > job.deadline) {
            throw new AppError('Tin tuyển dụng đã hết hạn nộp hồ sơ', 400);
        }

        const existingApp = await Application.findOne({ job: jobId, candidate: candidateId });
        if (existingApp) throw new AppError('Bạn đã nộp đơn cho vị trí này rồi', 400);

        const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);

        const application = await Application.create({
            job: jobId,
            candidate: candidateId,
            cvUrl: uploadResult.secure_url,
            coverLetter: req.body.coverLetter || ''
        });

        await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

        await Notification.create({
            recipient: job.recruiter,
            title: 'Có ứng viên mới!',
            message: `Ứng viên vừa nộp CV vào vị trí "${job.title}".`,
            link: `/recruiter/jobs/${jobId}/applicants`
        });

        aiService.triggerAIScoring(application._id, {
            cvUrl: uploadResult.secure_url,
            jdText: job.requirements,
            jdSkills: job.skills || []
        }).catch(async (err) => {
            console.error('[AI Processing Error]:', err);
            await Application.findByIdAndUpdate(application._id, { aiStatus: 'error' });
        });

        res.status(201).json({
            success: true,
            message: 'Nộp đơn thành công',
            data: application
        });
    } catch (err) { next(err); }
};

exports.getApplicationsByJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { page, limit, sort, keyword, scoreFilter } = req.query;

        let matchStage = {}; // Điều kiện tìm kiếm ban đầu

        // 1. NẾU TÌM "TẤT CẢ" (Trang Quản lý Ứng viên chung)
        if (!jobId || jobId === 'all' || jobId === 'undefined') {
            const jobs = await Job.find({ recruiter: req.user.id }).select('_id');
            const jobIds = jobs.map(j => j._id);
            matchStage = { job: { $in: jobIds } };
        }
        // 2. NẾU TÌM 1 JOB CỤ THỂ
        else {
            if (!mongoose.Types.ObjectId.isValid(jobId)) throw new AppError('Job ID không hợp lệ', 400);
            const job = await Job.findById(jobId);
            if (!job) throw new AppError('Không tìm thấy Job', 404);

            // Chỉ kiểm tra quyền nếu tìm 1 Job cụ thể
            if (job.recruiter.toString() !== req.user.id && req.user.role !== 'admin') {
                throw new AppError('Bạn không có quyền xem', 403);
            }

            matchStage = { job: new mongoose.Types.ObjectId(jobId) };
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, parseInt(limit) || 20);
        const skip = (pageNum - 1) * limitNum;

        let pipeline = [
            { $match: matchStage } // Gắn điều kiện tìm kiếm đã xử lý ở trên
        ];

        // Lọc theo điểm AI
        if (scoreFilter === 'high') pipeline.push({ $match: { aiScore: { $gte: 80 } } });
        else if (scoreFilter === 'medium') pipeline.push({ $match: { aiScore: { $gte: 50, $lt: 80 } } });
        else if (scoreFilter === 'low') pipeline.push({ $match: { aiScore: { $lt: 50 } } });

        // Lookup (Join) với bảng Users để lấy thông tin ứng viên
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'candidate',
                foreignField: '_id',
                as: 'candidate'
            }
        });
        pipeline.push({ $unwind: '$candidate' });

        // Lookup (Join) thêm bảng Jobs để lấy Tên Công việc (Hiển thị ở trang 'all')
        pipeline.push({
            $lookup: {
                from: 'jobs',
                localField: 'job',
                foreignField: '_id',
                as: 'job'
            }
        });
        pipeline.push({ $unwind: '$job' });

        // Lọc theo Keyword (Tên/Email) TRÊN kết quả đã Join
        if (keyword) {
            pipeline.push({
                $match: {
                    $or: [
                        { 'candidate.name': { $regex: keyword, $options: 'i' } },
                        { 'candidate.email': { $regex: keyword, $options: 'i' } }
                    ]
                }
            });
        }

        // Giấu password và các trường dư thừa của User
        pipeline.push({
            $project: {
                'candidate.password': 0,
                'candidate.__v': 0
            }
        });

        // Sắp xếp
        const sortMap = {
            score: { aiScore: -1 },
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 }
        };
        pipeline.push({ $sort: sortMap[sort] || { aiScore: -1, createdAt: -1 } });

        // Phân trang bằng $facet
        pipeline.push({
            $facet: {
                metadata: [{ $count: "total" }],
                data: [{ $skip: skip }, { $limit: limitNum }]
            }
        });

        const result = await Application.aggregate(pipeline);
        const total = result[0].metadata.length > 0 ? result[0].metadata[0].total : 0;
        const applications = result[0].data;

        res.json({
            success: true,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: applications
        });
    } catch (err) { next(err); }
};

exports.updateApplicationStatus = async (req, res, next) => {
    try {
        const { status, recruiterNote } = req.body;
        const { id } = req.params; // Lấy ID từ URL

        // 1. Kiểm tra ID chuẩn MongoDB để tránh lỗi 400 sảng
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('ID đơn ứng tuyển không hợp lệ', 400);
        }

        const validStatuses = ['applied', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected'];
        if (!validStatuses.includes(status)) throw new AppError('Trạng thái không hợp lệ', 400);

        // 2. Dùng findByIdAndUpdate để tránh chạy lại Validation rườm rà
        const application = await Application.findByIdAndUpdate(
            id,
            { status, recruiterNote },
            { new: true, runValidators: true }
        ).populate('job');

        if (!application) throw new AppError('Không tìm thấy đơn', 404);
        if (!application.job) throw new AppError('Công việc liên quan không còn tồn tại', 404);

        // 3. Kiểm tra quyền an toàn hơn
        const recruiterId = application.job.recruiter?.toString();
        if (recruiterId !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền cập nhật đơn này', 403);
        }

        // 4. Logic gửi thông báo (Giữ nguyên của bạn)
        const statusMap = {
            'reviewing': 'Đang xem xét',
            'shortlisted': 'Vào danh sách rút gọn',
            'interviewed': 'Mời phỏng vấn',
            'offered': 'Trúng tuyển - Đã nhận offer',
            'rejected': 'Không phù hợp'
        };

        if (statusMap[status]) {
            await Notification.create({
                recipient: application.candidate,
                title: 'Cập nhật trạng thái hồ sơ',
                message: `Hồ sơ vị trí "${application.job.title}" của bạn: ${statusMap[status]}.`,
                link: '/candidate/applications'
            });
        }

        res.json({ success: true, message: `Đã chuyển sang ${status}`, data: application });
    } catch (err) { next(err); }
};

exports.toggleFeatured = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new AppError('ID không hợp lệ', 400);
        const app = await Application.findById(req.params.id).populate('job');
        if (!app) throw new AppError('Không tìm thấy đơn', 404);
        if (app.job.recruiter.toString() !== req.user.id && req.user.role !== 'admin')
            throw new AppError('Không có quyền', 403);

        app.isFeatured = !app.isFeatured;
        await app.save();
        res.json({ success: true, isFeatured: app.isFeatured });
    } catch (err) { next(err); }
};

exports.retriggerScore = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new AppError('ID không hợp lệ', 400);
        const app = await Application.findById(req.params.id).populate('job');
        if (!app) throw new AppError('Không tìm thấy đơn', 404);
        if (app.job.recruiter?.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Không có quyền', 403);
        }
        aiService.triggerAIScoring(app._id, {
            cvUrl: app.cvUrl,
            jdText: app.job.requirements,
            jdSkills: app.job.skills || []
        }).catch(async (err) => {
            console.error('[AI Retrigger Error]:', err);
            await Application.findByIdAndUpdate(app._id, { aiStatus: 'error' });
        });

        res.json({ success: true, message: 'Đã gửi yêu cầu chấm lại AI' });
    } catch (err) { next(err); }
};

exports.getMyApplications = async (req, res, next) => {
    try {
        const applications = await Application.find({ candidate: req.user.id })
            .populate({
                path: 'job',
                select: 'title location type level isActive recruiter',
                populate: { path: 'recruiter', select: 'companyName companyLogo' }
            })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, data: applications });
    } catch (err) { next(err); }
};
exports.reportApplication = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const app = await Application.findById(id).populate('job');
        if (app.job.recruiter.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền báo cáo đơn này' });
        }

        app.report = { isReported: true, reason, reportedAt: new Date() };
        await app.save();

        res.json({ success: true, message: 'Đã gửi báo cáo cho Admin xử lý' });
    } catch (error) { next(error); }
};