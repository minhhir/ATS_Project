const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 10000 },
    requirements: { type: String, required: true, maxlength: 10000 },
    location: { type: String, required: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    salaryMin: { type: Number },
    // Vấn đề: User/HR nhập salaryMax < salaryMin sẽ tạo ra tin tuyển dụng vô lý cho frontend hiển thị.
    // Giải pháp: Custom validator chặn ngay từ schema; bỏ qua khi update partial vì lúc đó this không phải Document.
    salaryMax: {
        type: Number,
        validate: {
            validator: function (val) {
                // Chỉ validate tự động khi create/save
                if (this instanceof mongoose.Document) {
                    return !this.salaryMin || val >= this.salaryMin;
                }
                return true;
            },
            message: 'Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu'
        }
    },

    level: {
        type: String,
        enum: ['intern', 'fresher', 'junior', 'mid', 'senior', 'lead'],
        required: true
    },
    isApproved: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    experience: {
        type: String,
        enum: ['không yêu cầu', '<1 năm', '1-2 năm', '3-5 năm', '>5 năm'],
        default: 'không yêu cầu'
    },
    type: {
        type: String,
        enum: ['full-time', 'part-time', 'remote', 'contract'],
        default: 'full-time'
    },
    skills: [{ type: String }],

    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    deadline: { type: Date },
    applicantCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

// Vấn đề: Search job theo từ khóa bằng regex sẽ scan full collection và rất chậm.
// Giải pháp: Tạo text index trên các field tìm kiếm chính để dùng $text + score sort hiệu quả.
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
// Vấn đề: Filter job theo (location, level, salary) là query phổ biến, nếu không index sẽ scan toàn bảng.
// Giải pháp: Compound index khớp với pattern filter ở job listing để Mongo dùng index scan.
jobSchema.index({ location: 1, level: 1, salaryMin: 1, salaryMax: 1 });

module.exports = mongoose.model('Job', jobSchema);