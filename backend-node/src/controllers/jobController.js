const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');
const Application = require('../models/Application');
const filter = { isActive: true, isApproved: 'approved' };

// [GET] /api/jobs - Lấy danh sách Job (Có search, filter, pagination)
exports.getJobs = async (req, res, next) => {
    try {
        const { keyword, location, level, salaryMin, salaryMax, type, experience, sort, page, limit } = req.query;

        // Ép kiểu và giới hạn limit
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, parseInt(limit) || 10);
        const skip = (pageNum - 1) * limitNum;

        const filter = { isActive: true };

        if (keyword) filter.$text = { $search: keyword };
        if (location) filter.location = new RegExp(location, 'i');
        if (level) filter.level = level;
        if (type) filter.type = type;
        if (experience) filter.experience = experience;

        // Logic lọc lương đúng
        if (salaryMin && !isNaN(salaryMin)) {
            filter.salaryMax = { $gte: Number(salaryMin) };
        }
        if (salaryMax && !isNaN(salaryMax)) {
            filter.$or = [
                { salaryMin: { $lte: Number(salaryMax) } },
                { salaryMin: { $exists: false } },
                { salaryMin: null }
            ];
        }
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
        const job = await Job.findById(req.params.id)
            .populate('recruiter', 'name companyName email companyLogo companyDesc companyWebsite');

        if (!job) {
            return res.status(404).json({ message: 'Không tìm thấy công việc' });
        }

        // Logic bảo mật: Nếu tin chưa được duyệt (pending/rejected)
        if (job.isApproved !== 'approved') {
            // Nếu là khách vãng lai (chưa đăng nhập) -> Chặn
            if (!req.user) {
                return res.status(403).json({ message: 'Tin tuyển dụng này đang chờ duyệt.' });
            }

            const isOwner = req.user.id === job.recruiter._id.toString();
            const isAdmin = req.user.role === 'admin';

            // Nếu đã đăng nhập, nhưng KHÔNG PHẢI người đăng tin và KHÔNG PHẢI Admin -> Chặn (Ứng viên bị chặn ở đây nếu tin chưa duyệt)
            if (!isOwner && !isAdmin) {
                return res.status(403).json({ message: 'Tin tuyển dụng này đang chờ duyệt hoặc đã bị khóa.' });
            }
        }

        res.json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};
// [POST] /api/jobs - Đăng tin tuyển dụng mới (Chỉ HR)
exports.createJob = async (req, res, next) => {
    try {
        // Whitelist dữ liệu đầu vào (Chống Mass Assignment)
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
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            throw new AppError('Job ID không hợp lệ', 400);

        // Chỉ thao tác trên Job đang active
        const job = await Job.findOne({ _id: req.params.id, isActive: true });
        if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

        if (job.recruiter?.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền sửa tin này', 403);
        }

        // Whitelist các field được phép update
        const { title, description, requirements, location,
            salaryMin, salaryMax, level, type, skills, deadline } = req.body;

        const allowedUpdates = {
            title, description, requirements, location,
            salaryMin, salaryMax, level, type, skills, deadline
        };

        // Lọc bỏ các key undefined
        Object.keys(allowedUpdates).forEach(
            k => allowedUpdates[k] === undefined && delete allowedUpdates[k]
        );

        Object.assign(job, allowedUpdates);
        await job.save();

        // Trả về biến 'job' vừa được lưu xong
        res.json({ success: true, data: job });
    } catch (err) { next(err); }
};

// [DELETE] /api/jobs/:id - Xóa tin (Soft delete)
exports.deleteJob = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            throw new AppError('Job ID không hợp lệ', 400);

        // Chỉ thao tác trên Job đang active
        const job = await Job.findOne({ _id: req.params.id, isActive: true });
        if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

        // ✅ FIX 2.2: Thêm ? 
        if (job.recruiter?.toString() !== req.user.id && req.user.role !== 'admin') {
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
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            throw new AppError('Job ID không hợp lệ', 400);

        // Chỉ thao tác trên Job đang active
        const job = await Job.findOne({ _id: req.params.id, isActive: true });
        if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

        // ✅ FIX 2.2: Thêm ? 
        if (job.recruiter?.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền thao tác', 403);
        }

        job.isFeatured = !job.isFeatured;
        await job.save();

        res.json({ success: true, isFeatured: job.isFeatured });
    } catch (err) { next(err); }
};
// [GET] /api/jobs/my-jobs - Lấy danh sách Job do chính HR này đăng
exports.getMyJobs = async (req, res, next) => {
    try {
        // req.user.id được lấy từ token (middleware protect)
        const jobs = await Job.find({ recruiter: req.user.id, isActive: true })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, data: jobs });
    } catch (err) { next(err); }
};
// [GET] /api/jobs/dashboard-stats - Thống kê cho dashboard HR`
exports.getDashboardStats = async (req, res, next) => {
    try {
        const recruiterId = req.user.id;

        // 1. Lấy danh sách ID các Job của HR này
        const jobs = await Job.find({ recruiter: recruiterId }).select('_id');
        const jobIds = jobs.map(j => j._id);

        // 2. Chạy song song các câu query để tối ưu hiệu năng
        const [totalJobs, activeJobs, totalApps, recentApps] = await Promise.all([
            Job.countDocuments({ recruiter: recruiterId }),
            Job.countDocuments({ recruiter: recruiterId, isActive: true }),
            Application.countDocuments({ job: { $in: jobIds } }),
            Application.find({ job: { $in: jobIds } })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('job', 'title')
                .populate('candidate', 'name email avatar')
        ]);

        res.json({
            success: true,
            data: {
                stats: {
                    totalJobs,
                    activeJobs,
                    totalApplications: totalApps,
                    newApplications: recentApps.length // Hoặc query theo ngày
                },
                recentApplications: recentApps
            }
        });
    } catch (err) { next(err); }
};
// [GET] /api/jobs/stats/analytics - Phân tích nâng cao cho Dashboard HR
exports.getRecruiterAnalytics = async (req, res, next) => {
    try {
        const recruiterId = new mongoose.Types.ObjectId(req.user.id);
        const now = new Date();
        const startOf = (offsetDays) => {
            const d = new Date(now);
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - offsetDays);
            return d;
        };
        const last30Start = startOf(29);
        const last60Start = startOf(59);
        const last30End = new Date(now);

        const jobs = await Job.find({ recruiter: recruiterId }).select('_id title isActive deadline').lean();
        const jobIds = jobs.map(j => j._id);

        // 1) Trend 30 ngày: số đơn ứng tuyển theo từng ngày
        const trendAgg = await Application.aggregate([
            { $match: { job: { $in: jobIds }, createdAt: { $gte: last30Start } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const map = new Map(trendAgg.map(r => [r._id, r.count]));
        const trend = [];
        for (let i = 29; i >= 0; i--) {
            const d = startOf(i);
            const key = d.toISOString().slice(0, 10);
            trend.push({ date: key, count: map.get(key) || 0 });
        }

        // 2) Tăng/giảm % số đơn ứng tuyển 30 ngày qua
        const [curApps, prevApps, curJobs, prevJobs] = await Promise.all([
            Application.countDocuments({ job: { $in: jobIds }, createdAt: { $gte: last30Start, $lt: last30End } }),
            Application.countDocuments({ job: { $in: jobIds }, createdAt: { $gte: last60Start, $lt: last30Start } }),
            Job.countDocuments({ recruiter: recruiterId, createdAt: { $gte: last30Start, $lt: last30End } }),
            Job.countDocuments({ recruiter: recruiterId, createdAt: { $gte: last60Start, $lt: last30Start } })
        ]);

        const growthPct = (cur, prev) => {
            if (!prev) return cur > 0 ? 100 : 0;
            return Math.round(((cur - prev) / prev) * 1000) / 10;
        };

        // 3) Phân bố trạng thái đơn ứng tuyển (toàn bộ)
        const statusAgg = await Application.aggregate([
            { $match: { job: { $in: jobIds } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const applicationStatus = { applied: 0, reviewing: 0, shortlisted: 0, interviewed: 0, offered: 0, rejected: 0 };
        statusAgg.forEach(r => { if (r._id) applicationStatus[r._id] = r.count; });

        const totalApps = Object.values(applicationStatus).reduce((a, b) => a + b, 0);

        // 4) Funnel chuyển đổi (cộng dồn theo "đã đi qua bước này")
        const passed = {
            applied: totalApps,
            reviewing: applicationStatus.reviewing + applicationStatus.shortlisted + applicationStatus.interviewed + applicationStatus.offered,
            shortlisted: applicationStatus.shortlisted + applicationStatus.interviewed + applicationStatus.offered,
            interviewed: applicationStatus.interviewed + applicationStatus.offered,
            offered: applicationStatus.offered
        };
        const offeredRate = totalApps ? Math.round((applicationStatus.offered / totalApps) * 1000) / 10 : 0;
        const rejectedRate = totalApps ? Math.round((applicationStatus.rejected / totalApps) * 1000) / 10 : 0;

        // 5) Top 5 tin tuyển dụng có nhiều đơn nhất
        const topJobsAgg = await Application.aggregate([
            { $match: { job: { $in: jobIds } } },
            { $group: { _id: '$job', applicantCount: { $sum: 1 } } },
            { $sort: { applicantCount: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
            { $unwind: '$job' },
            { $project: { _id: 0, title: '$job.title', applicantCount: 1 } }
        ]);

        // 6) Phân bố điểm AI theo các khoảng (0-20, 20-40, ...)
        const aiBucketAgg = await Application.aggregate([
            { $match: { job: { $in: jobIds }, aiScore: { $type: 'number' } } },
            {
                $bucket: {
                    groupBy: '$aiScore',
                    boundaries: [0, 20, 40, 60, 80, 101],
                    default: 'unscored',
                    output: { count: { $sum: 1 } }
                }
            }
        ]);
        const aiScoreBuckets = [
            { range: '0-20', count: 0 },
            { range: '20-40', count: 0 },
            { range: '40-60', count: 0 },
            { range: '60-80', count: 0 },
            { range: '80-100', count: 0 }
        ];
        const bucketIdx = { 0: 0, 20: 1, 40: 2, 60: 3, 80: 4 };
        aiBucketAgg.forEach(b => {
            const idx = bucketIdx[b._id];
            if (idx !== undefined) aiScoreBuckets[idx].count = b.count;
        });

        res.json({
            success: true,
            data: {
                trend,
                growth: {
                    applications: { current: curApps, previous: prevApps, pct: growthPct(curApps, prevApps) },
                    jobs: { current: curJobs, previous: prevJobs, pct: growthPct(curJobs, prevJobs) }
                },
                applicationStatus,
                funnel: passed,
                offeredRate,
                rejectedRate,
                topJobs: topJobsAgg,
                aiScoreBuckets
            }
        });
    } catch (err) { next(err); }
};

// [GET] /api/jobs/recruiter - Lấy danh sách job đơn giản cho dropdown HR
exports.getRecruiterJobs = async (req, res, next) => {
    try {
        const recruiterId = req.user.id;

        // Chỉ lấy _id và title để làm nhẹ dữ liệu trả về
        const jobs = await Job.find({ recruiter: recruiterId })
            .select('_id title isActive')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: jobs
        });
    } catch (err) {
        next(err);
    }
};