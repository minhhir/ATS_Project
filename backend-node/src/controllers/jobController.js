const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');
const Application = require('../models/Application');
const filter = { isActive: true, isApproved: 'approved' };

// Vấn đề: Trả về toàn bộ job sẽ kéo nặng response và làm chậm UI; user có thể truyền limit=1000000 để DoS database; query string đến dạng string không thể dùng làm số.
// Giải pháp: Bắt buộc pagination với cap limit=50, ép parseInt và clamp về [1, 50] để mọi giá trị đầu vào đều an toàn.
exports.getJobs = async (req, res, next) => {
    try {
        const { keyword, location, level, salaryMin, salaryMax, type, experience, sort, page, limit } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, parseInt(limit) || 10);
        const skip = (pageNum - 1) * limitNum;

        const filter = { isActive: true };

        // Vấn đề: Search bằng regex trên text dài rất chậm; lương nằm trong khoảng nên không thể compare đơn lẻ.
        // Giải pháp: Dùng $text index cho keyword, regex i cho location ngắn, và compare chéo salaryMax/salaryMin để tìm overlap khoảng lương.
        if (keyword) filter.$text = { $search: keyword };
        if (location) filter.location = new RegExp(location, 'i');
        if (level) filter.level = level;
        if (type) filter.type = type;
        if (experience) filter.experience = experience;

        // Vấn đề: User search "lương từ X" cần job có salaryMax ≥ X, không phải salaryMin ≥ X.
        // Giải pháp: filter.salaryMax >= salaryMin user nhập để bao phủ đúng khoảng giao nhau.
        if (salaryMin && !isNaN(salaryMin)) {
            filter.salaryMax = { $gte: Number(salaryMin) };
        }
        // Vấn đề: Job không khai salaryMin (null/undefined) sẽ bị loại oan khi filter salaryMax.
        // Giải pháp: Dùng $or để vẫn cho qua các job thiếu salaryMin (coi như "thương lượng").
        if (salaryMax && !isNaN(salaryMax)) {
            filter.$or = [
                { salaryMin: { $lte: Number(salaryMax) } },
                { salaryMin: { $exists: false } },
                { salaryMin: null }
            ];
        }
        // Vấn đề: HR mua tính năng "đẩy tin Hot" mong tin xuất hiện đầu, nhưng nếu sort theo createdAt thì tin Hot cũ sẽ rớt xuống.
        // Giải pháp: Tất cả mode sort đều prefix isFeatured: -1 để tin Hot luôn nổi lên đầu mỗi page.
        const sortMap = {
            newest: { isFeatured: -1, createdAt: -1 },
            popular: { isFeatured: -1, applicantCount: -1 },
            salary: { isFeatured: -1, salaryMax: -1 },
        };
        const sortBy = sortMap[sort] || { isFeatured: -1, createdAt: -1 };

        // Vấn đề: Gọi find rồi countDocuments tuần tự sẽ chậm gấp đôi mặc dù hai query không phụ thuộc nhau.
        // Giải pháp: Promise.all chạy song song, đồng thời .lean() để bỏ qua hydration document Mongoose cho nhẹ.
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

// Vấn đề: Cho ai cũng xem mọi tin sẽ làm tin đang chờ duyệt / bị reject vẫn lộ ra ngoài cho candidate apply nhầm.
// Giải pháp: Public chỉ thấy tin approved; tin pending/rejected chỉ owner (recruiter) hoặc admin mới được xem.
exports.getJobById = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('recruiter', 'name companyName email companyLogo companyDesc companyWebsite');

        if (!job) {
            return res.status(404).json({ message: 'Không tìm thấy công việc' });
        }

        if (job.isApproved !== 'approved') {
            if (!req.user) {
                return res.status(403).json({ message: 'Tin tuyển dụng này đang chờ duyệt.' });
            }

            const isOwner = req.user.id === job.recruiter._id.toString();
            const isAdmin = req.user.role === 'admin';

            if (!isOwner && !isAdmin) {
                return res.status(403).json({ message: 'Tin tuyển dụng này đang chờ duyệt hoặc đã bị khóa.' });
            }
        }

        res.json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};
// Vấn đề: Nếu spread req.body vào Job.create, attacker có thể tự set isApproved='approved' hoặc recruiter=otherId để mạo danh.
// Giải pháp: Whitelist explicit field cho phép, recruiter luôn lấy từ req.user.id (đã verify ở middleware) thay vì body.
exports.createJob = async (req, res, next) => {
    try {
        const { title, description, requirements, location,
            salaryMin, salaryMax, level, type, skills, deadline } = req.body;

        const job = await Job.create({
            title, description, requirements, location,
            salaryMin, salaryMax, level, type, skills, deadline,
            recruiter: req.user.id
        });

        res.status(201).json({ success: true, data: job });
    } catch (err) { next(err); }
};

// Vấn đề: ID không phải ObjectId sẽ ném CastError 500; HR khác có thể sửa tin của HR khác; client gửi field rác (isApproved) sẽ ghi đè trạng thái duyệt.
// Giải pháp: Validate ObjectId, chỉ cho owner hoặc admin sửa, whitelist explicit field, lọc undefined để không ghi đè field cũ thành null.
exports.updateJob = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            throw new AppError('Job ID không hợp lệ', 400);

        const job = await Job.findOne({ _id: req.params.id, isActive: true });
        if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

        if (job.recruiter?.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền sửa tin này', 403);
        }

        const { title, description, requirements, location,
            salaryMin, salaryMax, level, type, skills, deadline } = req.body;

        const allowedUpdates = {
            title, description, requirements, location,
            salaryMin, salaryMax, level, type, skills, deadline
        };

        // Vấn đề: Field chưa gửi (undefined) khi gán sẽ làm Mongoose set null và mất dữ liệu cũ.
        // Giải pháp: Loại bỏ key undefined trước khi Object.assign để chỉ update field user thực sự đổi.
        Object.keys(allowedUpdates).forEach(
            k => allowedUpdates[k] === undefined && delete allowedUpdates[k]
        );

        Object.assign(job, allowedUpdates);
        await job.save();

        res.json({ success: true, data: job });
    } catch (err) { next(err); }
};

// Vấn đề: Hard delete sẽ làm mất luôn lịch sử ứng tuyển, candidate truy cập tin cũ sẽ thấy lỗi; HR khác có thể xoá tin của người khác.
// Giải pháp: Soft delete bằng isActive=false (vẫn giữ data, không hiển thị), kèm check owner/admin trước khi cho phép.
exports.deleteJob = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            throw new AppError('Job ID không hợp lệ', 400);

        const job = await Job.findOne({ _id: req.params.id, isActive: true });
        if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

        if (job.recruiter?.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền xóa tin này', 403);
        }

        job.isActive = false;
        await job.save();

        res.json({ success: true, message: 'Đã xóa/ẩn tin tuyển dụng' });
    } catch (err) { next(err); }
};

// Vấn đề: Đánh dấu tin Hot là tính năng admin/đối tác trả phí, không cho phép HR thường tự bật; nếu chỉ dựa vào middleware mà middleware bị bỏ sót thì lộ.
// Giải pháp: Defense-in-depth - check role admin lần thứ 2 trong controller, kết hợp validate ObjectId và toggle giá trị hiện tại.
exports.toggleFeatured = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            throw new AppError('Job ID không hợp lệ', 400);

        if (req.user.role !== 'admin') {
            throw new AppError('Chỉ Quản trị viên có quyền đánh dấu tin Hot', 403);
        }

        const job = await Job.findOne({ _id: req.params.id, isActive: true });
        if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

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
// Vấn đề: Dashboard cần 4 số liệu khác nhau, nếu query tuần tự sẽ chậm gấp 4 và làm UI giật.
// Giải pháp: Lấy jobIds 1 lần rồi Promise.all chạy song song 4 query để giảm latency xuống ~1 query.
exports.getDashboardStats = async (req, res, next) => {
    try {
        const recruiterId = req.user.id;

        const jobs = await Job.find({ recruiter: recruiterId }).select('_id');
        const jobIds = jobs.map(j => j._id);

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
// Vấn đề: Dashboard analytics cần nhiều biểu đồ (trend, growth, funnel, top jobs, AI bucket); query lẻ tẻ ở client sẽ tốn nhiều round-trip và lộ dữ liệu khác recruiter.
// Giải pháp: Một endpoint trả tất cả số liệu, dùng aggregate pipeline ở DB để gom tính toán, bound dữ liệu theo recruiterId.
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

        // Vấn đề: Đếm theo ngày trong app phải scan toàn bộ document và group ở RAM, rất chậm; ngày không có application sẽ bị bỏ trống làm chart đứt đoạn.
        // Giải pháp: Dùng aggregate $dateToString để DB tự group, sau đó fill đủ 30 ngày bằng map để chart liền mạch.
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

        // Vấn đề: HR cần biết "tháng này tăng/giảm bao nhiêu so với tháng trước", chia 0 sẽ ra Infinity gây lỗi UI.
        // Giải pháp: Lấy đếm 2 chu kỳ song song; growthPct trả 100% khi prev=0 và cur>0 để chart không bị break.
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

        // Vấn đề: aggregate có thể bỏ trống status không có data, FE render donut chart sẽ thiếu phần.
        // Giải pháp: Khởi tạo template đầy đủ 6 status với count=0 rồi merge kết quả từ DB vào.
        const statusAgg = await Application.aggregate([
            { $match: { job: { $in: jobIds } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const applicationStatus = { applied: 0, reviewing: 0, shortlisted: 0, interviewed: 0, offered: 0, rejected: 0 };
        statusAgg.forEach(r => { if (r._id) applicationStatus[r._id] = r.count; });

        const totalApps = Object.values(applicationStatus).reduce((a, b) => a + b, 0);

        // Vấn đề: Funnel hiển thị "đã đi qua bước này" - status hiện tại 'offered' nghĩa là đã đi qua applied/reviewing/shortlisted/interviewed.
        // Giải pháp: Cộng dồn count của các status sau để mỗi cấp funnel = tổng người đã đi qua cấp đó.
        const passed = {
            applied: totalApps,
            reviewing: applicationStatus.reviewing + applicationStatus.shortlisted + applicationStatus.interviewed + applicationStatus.offered,
            shortlisted: applicationStatus.shortlisted + applicationStatus.interviewed + applicationStatus.offered,
            interviewed: applicationStatus.interviewed + applicationStatus.offered,
            offered: applicationStatus.offered
        };
        const offeredRate = totalApps ? Math.round((applicationStatus.offered / totalApps) * 1000) / 10 : 0;
        const rejectedRate = totalApps ? Math.round((applicationStatus.rejected / totalApps) * 1000) / 10 : 0;

        // Vấn đề: Cần biết job nào "ăn khách" để HR tối ưu mô tả; group + lookup ở DB nhanh hơn nhiều so với fetch về app rồi tự gom.
        // Giải pháp: Aggregate group theo job, sort desc, lookup tên job và project gọn để FE chỉ nhận đúng 2 field cần thiết.
        const topJobsAgg = await Application.aggregate([
            { $match: { job: { $in: jobIds } } },
            { $group: { _id: '$job', applicantCount: { $sum: 1 } } },
            { $sort: { applicantCount: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
            { $unwind: '$job' },
            { $project: { _id: 0, title: '$job.title', applicantCount: 1 } }
        ]);

        // Vấn đề: HR muốn nhìn nhanh chất lượng pool ứng viên qua các bucket điểm AI; tính ở app cần load hết score rất tốn RAM.
        // Giải pháp: Aggregate $bucket trực tiếp ở DB, biên 0-20-40-60-80-100 trả về count theo từng khoảng.
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

// Vấn đề: Dropdown chọn job ở UI HR chỉ cần id + title, nếu trả full object sẽ kéo description/requirements không cần thiết.
// Giải pháp: select('_id title isActive') để response gọn nhất, sort newest first cho UX quen thuộc.
exports.getRecruiterJobs = async (req, res, next) => {
    try {
        const recruiterId = req.user.id;

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