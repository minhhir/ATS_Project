const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String, required: true },  // Dành cho AI chấm điểm

    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Bộ lọc tìm kiếm
    location: { type: String, required: true },

    // ✅ Fix Bug 1: Chặn lương âm và validate salaryMax >= salaryMin
    salaryMin: { type: Number, min: 0 },
    salaryMax: {
        type: Number,
        min: 0,
        validate: {
            validator: function (val) {
                // Chỉ check khi cả 2 đều có giá trị
                return !this.salaryMin || val >= this.salaryMin;
            },
            message: 'Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu'
        }
    },

    level: { type: String, enum: ['intern', 'fresher', 'junior', 'mid', 'senior', 'lead'], required: true },
    type: { type: String, enum: ['full-time', 'part-time', 'remote', 'contract'], default: 'full-time' },
    skills: [{ type: String }],  // Ví dụ: ['React', 'Node.js']

    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    deadline: { type: Date },

    // ✅ Fix Bug 2: Chặn applicantCount bị âm
    applicantCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

// Tạo Index để Search chữ cho nhanh (Tối ưu Database)
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ location: 1, level: 1, salaryMin: 1, salaryMax: 1 });

module.exports = mongoose.model('Job', jobSchema);