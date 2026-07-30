const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    cvUrl: { type: String, required: true },  // Link Cloudinary của file PDF

    // FIXED: Thêm maxlength: 3000 cho coverLetter
    coverLetter: { type: String, maxlength: 3000 },

    // Kết quả AI chấm điểm
    aiScore: { type: Number, min: 0, max: 100 },
    aiStatus: { type: String, enum: ['pending', 'processing', 'done', 'error'], default: 'pending' },
    aiSummary: { type: String },

    // Trạng thái xét duyệt của HR
    status: {
        type: String,
        enum: ['applied', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected'],
        default: 'applied'
    },
    report: {
        isReported: { type: Boolean, default: false },
        reason: String,
        reportedAt: Date
    },

    // FIXED: Thêm maxlength: 1000 cho recruiterNote
    recruiterNote: { type: String, maxlength: 1000 },
    isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

// Vấn đề: Ứng viên có thể spam apply nhiều lần vào cùng 1 job, làm rối danh sách của HR.
// Giải pháp: Compound unique index trên (job, candidate) để DB tự reject duplicate ngay từ tầng storage.
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

// Vấn đề: HR sort ứng viên theo điểm AI giảm dần — query này chạy thường xuyên, không index sẽ chậm.
// Giải pháp: Compound index (job, aiScore desc) để Mongo dùng index scan đã sort sẵn.
applicationSchema.index({ job: 1, aiScore: -1 });
// Vấn đề: Candidate xem lịch sử nộp đơn mới nhất, sort theo createdAt desc.
// Giải pháp: Compound index (candidate, createdAt desc) phục vụ pagination ngược thời gian.
applicationSchema.index({ candidate: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);