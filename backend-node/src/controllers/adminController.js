const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');

// Vấn đề: Admin dashboard cần 5 con số khác nhau, gọi tuần tự sẽ chậm; tổng count + danh sách user mới nhất là dữ liệu độc lập.
// Giải pháp: Promise.all chạy song song, đồng thời loại role admin khỏi recentUsers để bảng không tự liệt kê chính admin.
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

// Vấn đề: Lộ password hash khi list user là rủi ro nghiêm trọng; admin tự liệt kê admin khác sẽ tạo bề mặt tấn công nội bộ.
// Giải pháp: Loại role 'admin' khỏi list và select('-password') để bảo đảm không bao giờ trả password.
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    } catch (error) { next(error); }
};

// Vấn đề: Admin cần xem job kèm thông tin recruiter để duyệt/từ chối; nếu chỉ trả recruiter id thì FE phải gọi thêm endpoint.
// Giải pháp: Populate name/email/companyName để bảng admin có đủ thông tin trong 1 lần fetch.
exports.getAllJobs = async (req, res, next) => {
    try {
        const jobs = await Job.find().populate('recruiter', 'name email companyName').sort({ createdAt: -1 });
        res.json({ success: true, data: jobs });
    } catch (error) { next(error); }
};

// Vấn đề: Admin có thể vô tình tự xoá tài khoản chính mình → mất quyền truy cập hệ thống; khi xoá user, các job/application của họ sẽ thành "mồ côi".
// Giải pháp: Block self-delete; sau khi xoá user thì cascade xoá data phụ thuộc theo role để giữ DB sạch.
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

// Vấn đề: Admin cần ưu tiên xử lý báo cáo mới nhất, kèm thông tin candidate + job để quyết định xử lý.
// Giải pháp: Filter report.isReported=true, sort theo report.reportedAt desc, populate đủ data cần thiết.
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

// Vấn đề: Tin do HR đăng phải qua kiểm duyệt trước khi public để chống spam/scam; HR không được tự duyệt tin của mình.
// Giải pháp: Endpoint riêng cho admin set approvalStatus, route đã chặn role !== admin nên ở đây chỉ update field.
exports.approveJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const job = await Job.findByIdAndUpdate(id, { approvalStatus: status }, { new: true });
        if (!job) return res.status(404).json({ message: 'Không tìm thấy tin' });

        res.json({ success: true, message: `Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} tin tuyển dụng!` });
    } catch (error) { next(error); }
};
// Vấn đề: Admin cần thẩm định 1 user kèm lịch sử hoạt động của họ (job đã đăng / application đã nộp); 2 collection khác nhau theo role.
// Giải pháp: Branch theo role để query đúng collection và populate job title cho candidate.
exports.getUserDetail = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        const activities = user.role === 'recruiter'
            ? await Job.find({ recruiter: user._id })
            : await Application.find({ candidate: user._id }).populate('job', 'title');

        res.json({ success: true, data: { user, activities } });
    } catch (error) {
        next(error);
    }
};
// Vấn đề: Khi admin xóa đơn vi phạm, ứng viên bị xóa "im lặng" sẽ không hiểu lý do và lặp lại hành vi; sau khi xóa thì không còn cách nào lấy lại job title.
// Giải pháp: Notify ứng viên TRƯỚC khi xóa (vì sau xóa mất context), populate job để có title cho message.
exports.deleteApplication = async (req, res, next) => {
    try {
        const { id } = req.params;

        const application = await Application.findById(id).populate('job', 'title');

        if (!application) {
            return res.status(404).json({ message: 'Không tìm thấy đơn ứng tuyển để xóa' });
        }

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

// Vấn đề: Admin cần dashboard tổng quan với nhiều biểu đồ (trend 30 ngày, growth, status, top recruiter); nếu mỗi widget gọi 1 endpoint sẽ lâu và phá rate-limit.
// Giải pháp: 1 endpoint trả tất cả dữ liệu, dùng aggregate $bucket/$dateToString/$lookup để DB tính giúp, fillSeries lấp ngày trống cho chart liền mạch.
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

        // Vấn đề: aggregate chỉ trả các ngày có data → biểu đồ bị "đứt đoạn" tại ngày 0 record.
        // Giải pháp: Build map từ kết quả rồi lặp 30 ngày, ngày nào không có thì fill count: 0.
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
            { $group: { _id: '$approvalStatus', count: { $sum: 1 } } }
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

// Vấn đề: Xoá tin vi phạm đơn thuần sẽ làm mất dấu vết cho cả HR và ứng viên đã apply; insert từng notification trong loop sẽ chậm khi có nhiều ứng viên.
// Giải pháp: Lấy tất cả candidate đã apply, dùng insertMany để bắn batch, đồng thời gửi 1 notification riêng cho HR; sau đó mới xoá Application + Job để giữ ngữ cảnh khi build message.
exports.deleteJob = async (req, res, next) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng để xóa' });
        }

        // Vấn đề: Lấy full document Application sẽ kéo cả CV/coverLetter không cần dùng.
        // Giải pháp: select('candidate') để chỉ lấy field cần cho việc gửi notify.
        const applications = await Application.find({ job: id }).select('candidate');

        if (applications.length > 0) {
            const candidateNotis = applications.map(app => ({
                recipient: app.candidate,
                title: '🛡️ Thông báo an toàn: Việc làm đã bị gỡ',
                message: `Tin tuyển dụng "${job.title}" mà bạn ứng tuyển đã bị Ban quản trị gỡ bỏ do vi phạm quy định. Đơn ứng tuyển của bạn cho vị trí này đã được hủy tự động để bảo vệ thông tin.`,
                link: '/candidate/applications'
            }));

            // Vấn đề: Loop create() từng record sẽ tốn N round-trip tới Mongo.
            // Giải pháp: insertMany một phát ghi tất cả vào DB.
            await Notification.insertMany(candidateNotis);
        }

        await Notification.create({
            recipient: job.recruiter,
            title: 'CẢNH BÁO: Tin tuyển dụng bị gỡ bỏ',
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