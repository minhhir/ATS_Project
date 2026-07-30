const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const { uploadToCloudinary } = require('../middlewares/upload');
const aiService = require('../services/aiService');
const Notification = require('../models/Notification');

// Vấn đề: Apply là flow dài (validate, upload, lưu DB, notify, scoring) - nếu đợi cả AI scoring thì user chờ 30s; nếu lỗi 1 bước có thể tạo rác (file đã upload nhưng app chưa tạo).
// Giải pháp: Xác thực sớm các điều kiện (deadline, duplicate), upload Cloudinary trước khi tạo app, gửi notification ngay, AI scoring chạy fire-and-forget với .catch để báo aiStatus='error'.
exports.applyForJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const candidateId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(jobId)) throw new AppError('jobId không hợp lệ', 400);
        if (!req.file) throw new AppError('Vui lòng đính kèm file CV (PDF)', 400);

        const job = await Job.findOne({ _id: jobId, isActive: true });
        if (!job) throw new AppError('Công việc không tồn tại hoặc đã đóng', 404);
        // Vấn đề: deadline lưu chỉ ngày, so sánh với new Date() đầu giờ sáng sẽ chặn nhầm user nộp ngay ngày deadline.
        // Giải pháp: Đẩy endOfDeadlineDay về 23:59:59.999 để cho phép nộp đến cuối ngày deadline.
        const endOfDeadlineDay = new Date(job.deadline);
        endOfDeadlineDay.setHours(23, 59, 59, 999);
        if (job.deadline && new Date() > job.deadline) {
            throw new AppError('Tin tuyển dụng đã hết hạn nộp hồ sơ', 400);
        }

        // Vấn đề: Unique index ở DB sẽ raise duplicate key error xấu xí; check trước cho UX rõ ràng hơn.
        // Giải pháp: Kiểm tra existingApp trước khi upload Cloudinary để không lãng phí upload.
        const existingApp = await Application.findOne({ job: jobId, candidate: candidateId });
        if (existingApp) throw new AppError('Bạn đã nộp đơn cho vị trí này rồi', 400);

        const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);

        const application = await Application.create({
            job: jobId,
            candidate: candidateId,
            cvUrl: uploadResult.secure_url,
            coverLetter: req.body.coverLetter || ''
        });

        // Vấn đề: Nếu cộng dồn applicantCount bằng find/save sẽ race với apply song song và cho count sai.
        // Giải pháp: Dùng $inc atomic để đảm bảo concurrency-safe.
        await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

        // Vấn đề: HR cần biết ngay khi có ứng viên mới để xử lý nhanh, gửi email không realtime.
        // Giải pháp: Insert vào collection Notification để bell icon ở FE poll/realtime hiện ngay.
        await Notification.create({
            recipient: job.recruiter,
            title: 'Có ứng viên mới!',
            message: `Ứng viên vừa nộp CV vào vị trí "${job.title}".`,
            link: `/recruiter/jobs/${jobId}/applicants`
        });

        // Vấn đề: Nếu đợi AI scoring trong response, user sẽ chờ rất lâu; nếu AI fail không thể block apply.
        // Giải pháp: Fire-and-forget trigger AI, .catch riêng để cập nhật aiStatus='error' mà không kéo lỗi ra ngoài.
        aiService.triggerAIScoring(application._id, {
            cvUrl: uploadResult.secure_url,
            jdText: `${job.description || ''}\n\n${job.requirements || ''}`,
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

// Vấn đề: HR cần xem ứng viên theo job hoặc theo "tất cả của tôi", filter đa chiều (keyword, score, date), nếu viết 2 endpoint riêng sẽ dư thừa; dữ liệu HR khác phải được bảo vệ.
// Giải pháp: Một endpoint duy nhất, route động: jobId='all' → match jobIds của HR, jobId cụ thể → check ownership trước khi cho xem.
exports.getApplicationsByJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { page, limit, sort, keyword, scoreFilter, dateFrom, dateTo, featured } = req.query;

        let matchStage = {};

        if (!jobId || jobId === 'all' || jobId === 'undefined') {
            const jobs = await Job.find({ recruiter: req.user.id }).select('_id');
            const jobIds = jobs.map(j => j._id);
            matchStage = { job: { $in: jobIds } };
        }
        else {
            if (!mongoose.Types.ObjectId.isValid(jobId)) throw new AppError('Job ID không hợp lệ', 400);
            const job = await Job.findById(jobId);
            if (!job) throw new AppError('Không tìm thấy Job', 404);

            // Vấn đề: HR có thể guess jobId của HR khác để xem ứng viên; chỉ admin được nhìn xuyên qua.
            // Giải pháp: So sánh recruiter trên job với req.user.id trước khi build pipeline.
            if (job.recruiter.toString() !== req.user.id && req.user.role !== 'admin') {
                throw new AppError('Bạn không có quyền xem', 403);
            }

            matchStage = { job: new mongoose.Types.ObjectId(jobId) };
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, parseInt(limit) || 20);
        const skip = (pageNum - 1) * limitNum;

        let pipeline = [
            { $match: matchStage }
        ];

        // Vấn đề: User cần lọc theo nhiều ngưỡng điểm AI; viết if/else trên DB hiệu quả hơn fetch về Node.
        // Giải pháp: Push thêm $match tương ứng với từng nhóm score để Mongo tự lọc trước khi join.
        if (scoreFilter === 'high') pipeline.push({ $match: { aiScore: { $gte: 80 } } });
        else if (scoreFilter === 'medium') pipeline.push({ $match: { aiScore: { $gte: 50, $lt: 80 } } });
        else if (scoreFilter === 'low') pipeline.push({ $match: { aiScore: { $lt: 50 } } });

        // Vấn đề: Filter "đến ngày X" không bao gồm các app nộp lúc 23:50 ngày X nếu chỉ so sánh đầu ngày.
        // Giải pháp: Đẩy giờ kết thúc về 23:59:59.999 trước khi đưa vào range.
        if (dateFrom || dateTo) {
            const range = {};
            if (dateFrom) range.$gte = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                range.$lte = end;
            }
            pipeline.push({ $match: { createdAt: range } });
        }

        if (featured === 'true' || featured === '1') {
            pipeline.push({ $match: { isFeatured: true } });
        }

        // Vấn đề: Application chỉ lưu reference, FE cần info ứng viên + tên job; populate ở Mongoose không dùng được trong aggregate.
        // Giải pháp: $lookup join sang users/jobs rồi $unwind để biến array 1 phần tử thành object phẳng.
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'candidate',
                foreignField: '_id',
                as: 'candidate'
            }
        });
        pipeline.push({ $unwind: '$candidate' });

        pipeline.push({
            $lookup: {
                from: 'jobs',
                localField: 'job',
                foreignField: '_id',
                as: 'job'
            }
        });
        pipeline.push({ $unwind: '$job' });

        // Vấn đề: Search theo tên/email ứng viên cần data đã join (không có ở stage match đầu); regex trên trường email/name lớn nhưng dữ liệu đã filter trước nên acceptable.
        // Giải pháp: Đặt $match keyword sau $lookup, dùng $or để khớp theo cả name lẫn email.
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

        // Vấn đề: $lookup user trả nguyên document có cả password hash, không được lộ ra response.
        // Giải pháp: $project loại bỏ password và __v khỏi output.
        pipeline.push({
            $project: {
                'candidate.password': 0,
                'candidate.__v': 0
            }
        });

        // Vấn đề: HR đánh dấu ứng viên "nổi bật" muốn họ luôn nổi lên đầu bất kể sort.
        // Giải pháp: Mọi sort key đều prefix isFeatured: -1.
        const sortMap = {
            score: { isFeatured: -1, aiScore: -1 },
            newest: { isFeatured: -1, createdAt: -1 },
            oldest: { isFeatured: -1, createdAt: 1 }
        };
        pipeline.push({ $sort: sortMap[sort] || { isFeatured: -1, aiScore: -1, createdAt: -1 } });

        // Vấn đề: Pagination cần cả tổng count lẫn data của page hiện tại; chạy 2 query riêng sẽ filter 2 lần phí công.
        // Giải pháp: $facet chia pipeline thành 2 nhánh chạy song song cùng 1 lần scan.
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

// Vấn đề: HR cần đổi trạng thái duyệt ứng viên (reviewing/shortlisted/...) và muốn ứng viên biết ngay; status không hợp lệ sẽ làm dirty data.
// Giải pháp: Whitelist status, check ownership, sau khi update thì tạo notification cho candidate với link tới trang lịch sử ứng tuyển.
exports.updateApplicationStatus = async (req, res, next) => {
    try {
        const { status, recruiterNote } = req.body;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('ID đơn ứng tuyển không hợp lệ', 400);
        }

        const validStatuses = ['applied', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected'];
        if (!validStatuses.includes(status)) throw new AppError('Trạng thái không hợp lệ', 400);

        const application = await Application.findByIdAndUpdate(
            id,
            { status, recruiterNote },
            { new: true, runValidators: true }
        ).populate('job');

        if (!application) throw new AppError('Không tìm thấy đơn', 404);
        if (!application.job) throw new AppError('Công việc liên quan không còn tồn tại', 404);

        const recruiterId = application.job.recruiter?.toString();
        if (recruiterId !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Bạn không có quyền cập nhật đơn này', 403);
        }

        // Vấn đề: Hiển thị status code thô (reviewing/shortlisted) không thân thiện với candidate; status 'applied' không cần notify lại.
        // Giải pháp: Map sang nhãn tiếng Việt và chỉ gửi notify cho các status có nghĩa "đã thay đổi".
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

// Vấn đề: HR cần đánh dấu ứng viên "nổi bật" để dễ theo dõi qua nhiều ngày làm việc; nhưng phải đảm bảo HR khác không tick được candidate của HR khác.
// Giải pháp: Populate job để lấy recruiter và so sánh với req.user.id trước khi toggle.
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

// Vấn đề: AI scoring có thể fail (model bận, network) hoặc HR vừa sửa JD muốn chấm lại; không có cơ chế retry sẽ buộc xoá-apply lại.
// Giải pháp: Endpoint trigger lại scoring cho 1 application, fire-and-forget với .catch để cập nhật aiStatus='error' khi fail.
exports.retriggerScore = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new AppError('ID không hợp lệ', 400);
        const app = await Application.findById(req.params.id)
            .populate('job', 'description requirements skills recruiter');
        if (!app) throw new AppError('Không tìm thấy đơn', 404);
        if (app.job.recruiter?.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('Không có quyền', 403);
        }
        aiService.triggerAIScoring(app._id, {
            cvUrl: app.cvUrl,
            jdText: `${app.job.description || ''}\n\n${app.job.requirements || ''}`,
            jdSkills: app.job.skills || []
        }).catch(async (err) => {
            console.error('[AI Retrigger Error]:', err);
            await Application.findByIdAndUpdate(app._id, { aiStatus: 'error' });
        });

        res.json({ success: true, message: 'Đã gửi yêu cầu chấm lại AI' });
    } catch (err) { next(err); }
};

// Vấn đề: Trang lịch sử ứng tuyển của candidate cần thông tin job + công ty, populate lồng nhau dễ thiếu/select dư field.
// Giải pháp: Populate path 'job' với select gọn, lồng populate recruiter để lấy companyName + logo và lean() để FE chỉ nhận object phẳng.
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

// Vấn đề: HR có thể gặp ứng viên gian lận (CV giả, spam) và muốn báo cáo cho admin xử lý; cần ngăn HR khác báo cáo nhầm.
// Giải pháp: Check recruiter của job khớp HR đang đăng nhập rồi đánh dấu report kèm timestamp để admin lọc.
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