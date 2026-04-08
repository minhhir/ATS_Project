const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // FIXED: Thêm maxlength: 100 cho name và maxlength: 254 cho email
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, maxlength: 254 },
    password: { type: String, required: true, minlength: 6, select: false },

    // Phân quyền 3 cấp độ
    role: { type: String, enum: ['admin', 'recruiter', 'candidate'], default: 'candidate' },

    // Thông tin riêng của Nhà tuyển dụng (recruiter)
    companyName: { type: String },
    companyLogo: { type: String },
    companyWebsite: { type: String },
    companyDesc: { type: String },

    // Thông tin riêng của Ứng viên (candidate)
    phone: { type: String },
    avatar: { type: String },
    skills: [{ type: String }],
    cvUrl: { type: String },

    isActive: { type: Boolean, default: true },

    resetOTPHash: { type: String, select: false },
    resetOTPExpiry: { type: Date, select: false },
    resetOTPVerified: { type: Boolean, default: false, select: false }
}, { timestamps: true });

// Mã hóa mật khẩu trước khi save
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// So sánh mật khẩu khi đăng nhập
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);