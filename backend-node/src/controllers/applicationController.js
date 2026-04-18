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
            jdText: job.requirements
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

// ✅ FIX 2: Thay thế Find N+1 bằng Aggregation Pipeline với $lookup để tối ưu tốc độ
exports.getApplicationsByJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { page, limit, sort, keyword, scoreFilter } = req.query;

        if (!mongoose.Types.ObjectId.isValid(jobId)) throw new AppError('Job ID không hợp lệ', 400);

        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Không tìm thấy Job', 404);

        if (job.recruiter.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền xem', 403);
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, parseInt(limit) || 20);
        const skip = (pageNum - 1) * limitNum;

        let pipeline = [
            { $match: { job: new mongoose.Types.ObjectId(jobId) } }
        ];

        // 1. Lọc theo điểm AI trước
        if (scoreFilter === 'high') pipeline.push({ $match: { aiScore: { $gte: 80 } } });
        else if (scoreFilter === 'medium') pipeline.push({ $match: { aiScore: { $gte: 50, $lt: 80 } } });
        else if (scoreFilter === 'low') pipeline.push({ $match: { aiScore: { $lt: 50 } } });

        // 2. Lookup (Join) với bảng Users để lấy thông tin ứng viên
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'candidate',
                foreignField: '_id',
                as: 'candidate'
            }
        });
        pipeline.push({ $unwind: '$candidate' }); // Biến mảng thành object

        // 3. Lọc theo Keyword (Tên/Email) TRÊN kết quả đã Join
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

        // 4. Giấu password và các trường dư thừa của User
        pipeline.push({
            $project: {
                'candidate.password': 0,
                'candidate.__v': 0
            }
        });

        // 5. Sắp xếp
        const sortMap = {
            aiScore: { aiScore: -1 },
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            featured: { isFeatured: -1, aiScore: -1 },
        };
        pipeline.push({ $sort: sortMap[sort] || { createdAt: -1 } });

        // 6. Phân trang bằng $facet (Trả về Data và Total count cùng lúc)
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
        const validStatuses = ['applied', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected'];

        if (!validStatuses.includes(status)) throw new AppError('Trạng thái không hợp lệ', 400);

        const application = await Application.findById(req.params.id).populate('job');
        if (!application) throw new AppError('Không tìm thấy đơn', 404);
        if (!application.job) throw new AppError('Job không còn tồn tại', 404);

        if (application.job.recruiter.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền', 403);
        }

        application.status = status;
        if (recruiterNote !== undefined) application.recruiterNote = recruiterNote;
        await application.save();

        const statusMap = {
            'reviewing': 'Đang xem xét',
            'shortlisted': 'Vào danh sách rút gọn',
            'interviewed': 'Mời phỏng vấn',
            'offered': 'Trúng tuyển 🎉',
            'rejected': 'Không phù hợp'
        };

        await Notification.create({
            recipient: application.candidate,
            title: 'Cập nhật trạng thái hồ sơ',
            message: `Hồ sơ ứng tuyển vị trí "${application.job.title}" của bạn chuyển sang: ${statusMap[status]}.`,
            link: '/applications'
        });

        res.json({ success: true, message: `Cập nhật thành ${status}`, data: application });
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
            jdText: app.job.requirements
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