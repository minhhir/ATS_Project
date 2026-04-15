const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const { uploadToCloudinary } = require('../middlewares/upload');
const aiService = require('../services/aiService');
const Notification = require('../models/Notification');

// [POST] /api/applications/:jobId/apply - Ứng viên nộp CV
exports.applyForJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const candidateId = req.user.id;

        // FIX: Validate jobId trước để tránh Mongoose CastError
        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            throw new AppError('jobId không hợp lệ', 400);
        }

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
            link: `/recruiter/jobs/${jobId}/applicants` // Link thẳng vào danh sách ứng viên của job đó
        });
        // Fire-and-forget: AI chấm điểm ngầm, không làm trễ response
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
            data: {
                id: application._id,
                jobId: application.job,
                cvUrl: application.cvUrl,
                status: application.status,
                aiStatus: application.aiStatus,
                createdAt: application.createdAt,
            }
        });
    } catch (err) { next(err); }
};

// [GET] /api/applications/job/:jobId - HR xem danh sách ứng viên
exports.getApplicationsByJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { page, limit, sort } = req.query;

        if (!mongoose.Types.ObjectId.isValid(jobId))
            throw new AppError('Job ID không hợp lệ', 400);

        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Không tìm thấy Job', 404);

        if (job.recruiter.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền xem danh sách này', 403);
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, parseInt(limit) || 20);
        const skip = (pageNum - 1) * limitNum;

        // Cho phép sort từ query: aiScore (mặc định), newest, featured
        const sortMap = {
            aiScore: { aiScore: -1 },
            newest: { createdAt: -1 },
            featured: { isFeatured: -1, aiScore: -1 },
        };
        const sortBy = sortMap[sort] || { aiScore: -1 };

        const [applications, total] = await Promise.all([
            Application.find({ job: jobId })
                .populate('candidate', 'name email phone avatar')
                .sort(sortBy)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Application.countDocuments({ job: jobId })
        ]);

        res.json({
            success: true,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: applications
        });
    } catch (err) { next(err); }
};

// [PATCH] /api/applications/:id/status - HR duyệt/từ chối CV
// [PATCH] /api/applications/:id/status - HR duyệt/từ chối CV
exports.updateApplicationStatus = async (req, res, next) => {
    try {
        const { status, recruiterNote } = req.body;
        const validStatuses = ['applied', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected'];

        if (!validStatuses.includes(status)) {
            throw new AppError('Trạng thái không hợp lệ', 400);
        }

        const application = await Application.findById(req.params.id).populate('job');
        if (!application) throw new AppError('Không tìm thấy đơn ứng tuyển', 404);
        if (!application.job) throw new AppError('Job liên kết không còn tồn tại', 404);

        if (application.job.recruiter.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền thao tác', 403);
        }

        application.status = status;
        if (recruiterNote !== undefined) application.recruiterNote = recruiterNote;
        await application.save();

        // ✅ TẠO THÔNG BÁO BẮN VỀ CHO ỨNG VIÊN (CANDIDATE)
        const statusMap = {
            'reviewing': 'Đang xem xét',
            'shortlisted': 'Vào danh sách rút gọn',
            'interviewed': 'Mời phỏng vấn',
            'offered': 'Trúng tuyển 🎉',
            'rejected': 'Không phù hợp'
        };

        await Notification.create({
            recipient: application.candidate, // Người nhận là Ứng viên
            title: 'Cập nhật trạng thái hồ sơ',
            message: `Hồ sơ ứng tuyển vị trí "${application.job.title}" của bạn đã được chuyển sang trạng thái: ${statusMap[status]}.`,
            link: '/applications' // Link trỏ về trang Quản lý CV của Ứng viên
        });

        res.json({
            success: true,
            message: `Đã cập nhật trạng thái thành ${status}`,
            data: application
        });
    } catch (err) { next(err); }
};
// [PATCH] /api/applications/:id/feature - HR đánh dấu ứng viên nổi bật
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

// [POST] /api/applications/:id/score - Trigger AI chấm lại thủ công (HR)
exports.retriggerScore = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new AppError('ID không hợp lệ', 400);
        const app = await Application.findById(req.params.id).populate('job');
        if (!app) throw new AppError('Không tìm thấy đơn', 404);
        if (app.job.recruiter?.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền xem danh sách này', 403);
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
                select: 'title location type level recruiter',
                populate: { path: 'recruiter', select: 'companyName companyLogo' }
            })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, data: applications });
    } catch (err) { next(err); }
};