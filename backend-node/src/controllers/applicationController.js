const Application = require('../models/Application');
const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const { uploadToCloudinary } = require('../middlewares/upload');
const aiService = require('../services/aiService');

// [POST] /api/applications/:jobId/apply - Ứng viên nộp CV
exports.applyForJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const candidateId = req.user.id;

        //  Validate input (file) trước khi query Database
        if (!req.file) throw new AppError('Vui lòng đính kèm file CV (PDF)', 400);

        //  Check Job tồn tại và active
        const job = await Job.findOne({ _id: jobId, isActive: true });
        if (!job) throw new AppError('Công việc không tồn tại hoặc đã đóng', 404);

        //  Kiểm tra deadline của Job
        if (job.deadline && new Date() > job.deadline) {
            throw new AppError('Tin tuyển dụng đã hết hạn nộp hồ sơ', 400);
        }

        //  Check trùng đơn (1 ứng viên - 1 job)
        const existingApp = await Application.findOne({ job: jobId, candidate: candidateId });
        if (existingApp) throw new AppError('Bạn đã nộp đơn cho vị trí này rồi', 400);

        // Đẩy file lên Cloudinary với originalname
        const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);

        // Tạo Application
        const application = await Application.create({
            job: jobId,
            candidate: candidateId,
            cvUrl: uploadResult.secure_url,
            coverLetter: req.body.coverLetter || ''
        });

        // Atomic update để tăng số lượng ứng viên
        await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

        // Kích hoạt AI chấm điểm ngầm (Fire-and-forget)
        aiService.triggerAIScoring(application._id).catch(err => console.error(err));

        res.status(201).json({
            success: true,
            message: 'Nộp CV thành công! AI đang tiến hành phân tích.',
            data: application
        });
    } catch (err) { next(err); }
};

// [GET] /api/applications/job/:jobId - HR xem danh sách ứng viên
exports.getApplicationsByJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { page, limit } = req.query;

        const job = await Job.findOne({ _id: jobId, isActive: true });
        if (!job) throw new AppError('Không tìm thấy Job', 404);

        if (job.recruiter.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền xem danh sách này', 403);
        }

        // Logic Pagination tối ưu RAM
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, parseInt(limit) || 20);
        const skip = (pageNum - 1) * limitNum;

        const [applications, total] = await Promise.all([
            Application.find({ job: jobId })
                .populate('candidate', 'name email phone avatar')
                .sort({ aiScore: -1 })
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

        // Cho phép update thêm ghi chú của HR
        if (recruiterNote !== undefined) {
            application.recruiterNote = recruiterNote;
        }

        await application.save();

        res.json({ success: true, message: `Đã cập nhật trạng thái thành ${status}`, data: application });
    } catch (err) { next(err); }
};