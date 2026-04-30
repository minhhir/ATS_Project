const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');

// 1. Lấy dữ liệu tổng quan cho Dashboard
exports.getDashboardData = async (req, res, next) => {
    try {
        const [totalCandidates, totalRecruiters, totalJobs, totalApplications, recentUsers] = await Promise.all([
            User.countDocuments({ role: 'candidate' }),
            User.countDocuments({ role: 'recruiter' }),
            Job.countDocuments(),
            Application.countDocuments(),
            User.find({ role: { $ne: 'admin' } })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name email role createdAt')
        ]);

        res.json({
            success: true,
            data: {
                stats: { totalCandidates, totalRecruiters, totalJobs, totalApplications },
                recentUsers
            }
        });
    } catch (error) { next(error); }
};

// 2. Lấy danh sách ALL Users
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    } catch (error) { next(error); }
};

// 3. Lấy danh sách ALL Jobs
exports.getAllJobs = async (req, res, next) => {
    try {
        const jobs = await Job.find().populate('recruiter', 'name email companyName').sort({ createdAt: -1 });
        res.json({ success: true, data: jobs });
    } catch (error) { next(error); }
};

// 4. Xóa vĩnh viễn người dùng (Kèm theo data rác)
exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (id === req.user.id) {
            return res.status(400).json({ message: 'Không thể tự xóa tài khoản Super Admin!' });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        if (user.role === 'recruiter') {
            await Job.deleteMany({ recruiter: id });
        } else if (user.role === 'candidate') {
            await Application.deleteMany({ candidate: id });
        }

        res.json({ success: true, message: 'Đã xóa vĩnh viễn người dùng và dữ liệu liên quan' });
    } catch (error) { next(error); }
};

// 5. Lấy danh sách các đơn ứng tuyển bị BÁO CÁO FAKE
exports.getReportedApplications = async (req, res, next) => {
    try {
        const reports = await Application.find({ "report.isReported": true })
            .populate('candidate', 'name email avatar')
            .populate('job', 'title')
            .sort({ "report.reportedAt": -1 });

        res.json({ success: true, data: reports });
    } catch (error) { next(error); }
};

// 6. Xem chi tiết đơn ứng tuyển (Để Admin soi CV)
exports.getApplicationDetail = async (req, res, next) => {
    try {
        const app = await Application.findById(req.params.id)
            .populate('candidate', 'name email phone avatar')
            .populate('job', 'title companyName');
        res.json({ success: true, data: app });
    } catch (error) { next(error); }
};

// 7. Phê duyệt hoặc từ chối tin tuyển dụng
exports.approveJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const job = await Job.findByIdAndUpdate(id, { isApproved: status }, { new: true });
        if (!job) return res.status(404).json({ message: 'Không tìm thấy tin' });

        res.json({ success: true, message: `Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} tin tuyển dụng!` });
    } catch (error) { next(error); }
};
// 8. Xóa đơn ứng tuyển vi phạm (Dành cho chức năng Thẩm định)
exports.getUserDetail = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        // Lấy thêm lịch sử hoạt động tùy theo vai trò
        const activities = user.role === 'recruiter'
            ? await Job.find({ recruiter: user._id })
            : await Application.find({ candidate: user._id }).populate('job', 'title');

        res.json({ success: true, data: { user, activities } });
    } catch (error) {
        next(error);
    }
};
// 9. Xóa đơn ứng tuyển vi phạm (Dành cho chức năng Thẩm định)
// 9. Xóa đơn ứng tuyển vi phạm & Bắn cảnh báo cho Ứng viên
exports.deleteApplication = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Tìm đơn ứng tuyển trước (để lấy thông tin gửi mail/thông báo)
        // Dùng populate để lấy được Tên công việc (title)
        const application = await Application.findById(id).populate('job', 'title');

        if (!application) {
            return res.status(404).json({ message: 'Không tìm thấy đơn ứng tuyển để xóa' });
        }

        // 2. TẠO THÔNG BÁO CHO ỨNG VIÊN TRƯỚC KHI XÓA
        // Cảnh báo họ rằng hồ sơ của họ có vấn đề
        await Notification.create({
            recipient: application.candidate,
            title: '⚠️ CẢNH BÁO: Hồ sơ vi phạm bị gỡ bỏ',
            message: `Đơn ứng tuyển của bạn cho vị trí "${application.job?.title || 'Không xác định'}" đã bị Ban quản trị hệ thống gỡ bỏ do nghi ngờ CV giả mạo hoặc vi phạm điều khoản sử dụng.`,
            link: '/candidate/applications' // Link về trang của họ
        });

        // 3. Tiến hành xóa đơn ứng tuyển "rác"
        await Application.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Đã xóa đơn vi phạm và gửi cảnh báo đến Ứng viên thành công!'
        });
    } catch (error) {
        next(error);
    }
};

// 11. Thống kê phân tích nâng cao cho Dashboard Admin (charts + tăng/giảm)
exports.getAnalytics = async (req, res, next) => {
    try {
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

        // 1) Trend 30 ngày: users / jobs / applications theo từng ngày
        const dayGroup = {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        };

        const [usersTrend, jobsTrend, appsTrend] = await Promise.all([
            User.aggregate([
                { $match: { role: { $ne: 'admin' }, createdAt: { $gte: last30Start } } },
                { $group: { _id: dayGroup, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            Job.aggregate([
                { $match: { createdAt: { $gte: last30Start } } },
                { $group: { _id: dayGroup, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            Application.aggregate([
                { $match: { createdAt: { $gte: last30Start } } },
                { $group: { _id: dayGroup, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ])
        ]);

        // Lấp đầy các ngày trống để biểu đồ không gãy
        const fillSeries = (rows) => {
            const map = new Map(rows.map(r => [r._id, r.count]));
            const out = [];
            for (let i = 29; i >= 0; i--) {
                const d = startOf(i);
                const key = d.toISOString().slice(0, 10);
                out.push({ date: key, count: map.get(key) || 0 });
            }
            return out;
        };

        const trend = {
            users: fillSeries(usersTrend),
            jobs: fillSeries(jobsTrend),
            applications: fillSeries(appsTrend)
        };

        // 2) Tăng/giảm % so với 30 ngày trước
        const countInRange = async (Model, extra, gte, lt) => Model.countDocuments({
            ...(extra || {}),
            createdAt: { $gte: gte, $lt: lt }
        });

        const [
            curCandidates, prevCandidates,
            curRecruiters, prevRecruiters,
            curJobs, prevJobs,
            curApps, prevApps
        ] = await Promise.all([
            countInRange(User, { role: 'candidate' }, last30Start, last30End),
            countInRange(User, { role: 'candidate' }, last60Start, last30Start),
            countInRange(User, { role: 'recruiter' }, last30Start, last30End),
            countInRange(User, { role: 'recruiter' }, last60Start, last30Start),
            countInRange(Job, {}, last30Start, last30End),
            countInRange(Job, {}, last60Start, last30Start),
            countInRange(Application, {}, last30Start, last30End),
            countInRange(Application, {}, last60Start, last30Start)
        ]);

        const growthPct = (cur, prev) => {
            if (!prev) return cur > 0 ? 100 : 0;
            return Math.round(((cur - prev) / prev) * 1000) / 10;
        };

        const growth = {
            candidates: { current: curCandidates, previous: prevCandidates, pct: growthPct(curCandidates, prevCandidates) },
            recruiters: { current: curRecruiters, previous: prevRecruiters, pct: growthPct(curRecruiters, prevRecruiters) },
            jobs: { current: curJobs, previous: prevJobs, pct: growthPct(curJobs, prevJobs) },
            applications: { current: curApps, previous: prevApps, pct: growthPct(curApps, prevApps) }
        };

        // 3) Phân bố trạng thái duyệt tin
        const jobApprovalAgg = await Job.aggregate([
            { $group: { _id: '$isApproved', count: { $sum: 1 } } }
        ]);
        const jobApproval = { pending: 0, approved: 0, rejected: 0 };
        jobApprovalAgg.forEach(r => { jobApproval[r._id] = r.count; });

        // 4) Phân bố trạng thái đơn ứng tuyển
        const appStatusAgg = await Application.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const applicationStatus = { applied: 0, reviewing: 0, shortlisted: 0, interviewed: 0, offered: 0, rejected: 0 };
        appStatusAgg.forEach(r => { if (r._id) applicationStatus[r._id] = r.count; });

        // 5) Tỷ lệ đạt toàn hệ thống
        const totalApps = Object.values(applicationStatus).reduce((a, b) => a + b, 0);
        const offeredRate = totalApps ? Math.round((applicationStatus.offered / totalApps) * 1000) / 10 : 0;

        // 6) Top 5 nhà tuyển dụng theo số tin đăng
        const topRecruiters = await Job.aggregate([
            { $group: { _id: '$recruiter', jobCount: { $sum: 1 } } },
            { $sort: { jobCount: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 0,
                    name: { $ifNull: ['$user.companyName', '$user.name'] },
                    jobCount: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: { trend, growth, jobApproval, applicationStatus, offeredRate, topRecruiters }
        });
    } catch (error) { next(error); }
};

// 10. Xóa tin tuyển dụng vi phạm và gửi cảnh báo cho cả HR lẫn Ứng viên
exports.deleteJob = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Tìm tin tuyển dụng trước để lấy thông tin
        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng để xóa' });
        }

        // 2. TÌM TẤT CẢ ĐƠN ỨNG TUYỂN ĐÃ NỘP VÀO TIN NÀY
        // Chỉ lấy trường 'candidate' để cho nhẹ dữ liệu
        const applications = await Application.find({ job: id }).select('candidate');

        // 3. CHUẨN BỊ THÔNG BÁO CHO ỨNG VIÊN
        if (applications.length > 0) {
            // Tạo một mảng chứa thông báo cho từng người
            const candidateNotis = applications.map(app => ({
                recipient: app.candidate,
                title: '🛡️ Thông báo an toàn: Việc làm đã bị gỡ',
                message: `Tin tuyển dụng "${job.title}" mà bạn ứng tuyển đã bị Ban quản trị gỡ bỏ do vi phạm quy định. Đơn ứng tuyển của bạn cho vị trí này đã được hủy tự động để bảo vệ thông tin.`,
                link: '/candidate/applications'
            }));

            // Bắn một loạt thông báo vào Database cực kỳ nhanh
            await Notification.insertMany(candidateNotis);
        }

        // 4. BẮN CẢNH BÁO CHO NHÀ TUYỂN DỤNG (HR)
        await Notification.create({
            recipient: job.recruiter,
            title: '⚠️ CẢNH BÁO: Tin tuyển dụng bị gỡ bỏ',
            message: `Tin tuyển dụng "${job.title}" của công ty bạn đã bị Ban quản trị xóa bỏ do vi phạm quy định nền tảng.`,
            link: '/recruiter/jobs'
        });

        // 5. Dọn dẹp sạch sẽ: Xóa đơn ứng tuyển & Xóa tin
        await Application.deleteMany({ job: id });
        await Job.findByIdAndDelete(id);

        res.json({
            success: true,
            message: `Đã xóa tin, dọn dẹp ${applications.length} đơn và thông báo cho tất cả các bên liên quan!`
        });
    } catch (error) {
        next(error);
    }
};