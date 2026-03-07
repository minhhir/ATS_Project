const Job = require('../models/Job');
const AppError = require('../utils/AppError');

// [GET] /api/jobs - Lấy danh sách Job (Có search, filter, pagination)
exports.getJobs = async (req, res, next) => {
    try {
        const { keyword, location, level, salaryMin, salaryMax, type, sort, page, limit } = req.query;

        // Ép kiểu và giới hạn limit
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, parseInt(limit) || 10);
        const skip = (pageNum - 1) * limitNum;

        const filter = { isActive: true };

        if (keyword) filter.$text = { $search: keyword };
        if (location) filter.location = new RegExp(location, 'i');
        if (level) filter.level = level;
        if (type) filter.type = type;

        // Logic lọc lương đúng
        if (salaryMin) filter.salaryMax = { $gte: Number(salaryMin) };
        if (salaryMax) filter.salaryMin = { $lte: Number(salaryMax) };

        const sortMap = {
            newest: { createdAt: -1 },
            popular: { applicantCount: -1 },
            salary: { salaryMax: -1 },
        };
        const sortBy = sortMap[sort] || { createdAt: -1 };

        const [jobs, total] = await Promise.all([
            Job.find(filter)
                .sort(sortBy)
                .skip(skip)
                .limit(limitNum)
                .populate('recruiter', 'name companyName companyLogo')
                .lean(),
            Job.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: jobs,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
        });
    } catch (err) { next(err); }
};

// [GET] /api/jobs/featured - Lấy danh sách Job nổi bật
exports.getFeaturedJobs = async (req, res, next) => {
    try {
        const jobs = await Job.find({ isActive: true, isFeatured: true })
            .sort({ createdAt: -1 })
            .limit(6)
            .populate('recruiter', 'name companyName companyLogo')
            .lean();

        res.json({ success: true, data: jobs });
    } catch (err) { next(err); }
};

// [GET] /api/jobs/:id - Lấy chi tiết 1 Job
exports.getJobById = async (req, res, next) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, isActive: true })
            .populate('recruiter', 'name companyName companyLogo companyWebsite companyDesc')
            .lean();

        if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

        res.json({ success: true, data: job });
    } catch (err) { next(err); }
};

// [POST] /api/jobs - Đăng tin tuyển dụng mới (Chỉ HR)
exports.createJob = async (req, res, next) => {
    try {
        // ✅ Fix Bug 1: Whitelist dữ liệu đầu vào (Chống Mass Assignment)
        const { title, description, requirements, location,
            salaryMin, salaryMax, level, type, skills, deadline } = req.body;

        const job = await Job.create({
            title, description, requirements, location,
            salaryMin, salaryMax, level, type, skills, deadline,
            recruiter: req.user.id // Luôn lấy từ token, an toàn tuyệt đối
        });

        res.status(201).json({ success: true, data: job });
    } catch (err) { next(err); }
};

// [PUT] /api/jobs/:id - Cập nhật tin
exports.updateJob = async (req, res, next) => {
    try {
        // ✅ Fix Bug 2: Chỉ thao tác trên Job đang active
        const job = await Job.findOne({ _id: req.params.id, isActive: true });
        if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

        // Kiểm tra quyền sở hữu
        if (job.recruiter.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền sửa tin này', 403);
        }

        // Whitelist các field được phép update
        const { title, description, requirements, location,
            salaryMin, salaryMax, level, type, skills, deadline } = req.body;

        const allowedUpdates = {
            title, description, requirements, location,
            salaryMin, salaryMax, level, type, skills, deadline
        };

        Object.keys(allowedUpdates).forEach(
            k => allowedUpdates[k] === undefined && delete allowedUpdates[k]
        );

        const updated = await Job.findByIdAndUpdate(
            req.params.id, allowedUpdates, { new: true, runValidators: true }
        );

        res.json({ success: true, data: updated });
    } catch (err) { next(err); }
};

// [DELETE] /api/jobs/:id - Xóa tin (Soft delete)
exports.deleteJob = async (req, res, next) => {
    try {
        // ✅ Fix Bug 2: Chỉ thao tác trên Job đang active
        const job = await Job.findOne({ _id: req.params.id, isActive: true });
        if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

        if (job.recruiter.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền xóa tin này', 403);
        }

        job.isActive = false;
        await job.save();

        res.json({ success: true, message: 'Đã xóa/ẩn tin tuyển dụng' });
    } catch (err) { next(err); }
};

// [PATCH] /api/jobs/:id/feature - Đánh dấu nổi bật (Dành cho HR/Admin)
exports.toggleFeatured = async (req, res, next) => {
    try {
        // ✅ Fix Bug 2: Chỉ thao tác trên Job đang active
        const job = await Job.findOne({ _id: req.params.id, isActive: true });
        if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

        if (job.recruiter.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền thao tác', 403);
        }

        job.isFeatured = !job.isFeatured;
        await job.save();

        res.json({ success: true, isFeatured: job.isFeatured });
    } catch (err) { next(err); }
};