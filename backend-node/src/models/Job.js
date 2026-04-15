const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 10000 },
    requirements: { type: String, required: true, maxlength: 10000 },
    location: { type: String, required: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    salaryMin: { type: Number },
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

jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ location: 1, level: 1, salaryMin: 1, salaryMax: 1 });

module.exports = mongoose.model('Job', jobSchema);