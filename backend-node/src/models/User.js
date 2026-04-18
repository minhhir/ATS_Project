const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, maxlength: 254 },
    password: { type: String, required: true, minlength: 6, select: false },

    // Phân quyền 3 cấp độ
    role: { type: String, enum: ['admin', 'recruiter', 'candidate'], default: 'candidate' },

    // Thông tin riêng của Nhà tuyển dụng (Recruiter)
    companyName: { type: String, default: '' },
    companyLogo: { type: String, default: '' },
    companyWebsite: { type: String, default: '' },
    companyDesc: { type: String, default: '' },

    // Thông tin riêng của Ứng viên (Candidate)
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    skills: [{ type: String }],
    cvUrl: { type: String, default: '' }, // Đã chuẩn hóa theo CV upload

    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    // OTP khôi phục mật khẩu (Giữ nguyên tên cũ của bạn để không hỏng code, nhưng giấu đi)
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);