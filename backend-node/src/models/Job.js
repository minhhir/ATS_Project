const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String, required: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: String, required: true },
    salaryMin: { type: Number, min: 0 },

    salaryMax: {
        type: Number,
        min: 0,
        validate: {
            validator: function (val) {
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