const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    cvUrl: { type: String, required: true },  // Link Cloudinary của file PDF
    coverLetter: { type: String },

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

    isFeatured: { type: Boolean, default: false },
    recruiterNote: { type: String },

}, { timestamps: true });

// Đảm bảo 1 ứng viên chỉ được nộp 1 lần cho 1 công việc
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

// ✅ Fix Vấn đề 3: Thêm index tối ưu performance cho các query thường dùng nhất
applicationSchema.index({ job: 1, aiScore: -1 });         // Cho HR: Lọc ứng viên của 1 job theo điểm AI giảm dần
applicationSchema.index({ candidate: 1, createdAt: -1 }); // Cho Candidate: Xem lịch sử nộp đơn mới nhất

module.exports = mongoose.model('Application', applicationSchema);