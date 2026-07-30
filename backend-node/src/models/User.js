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

    // Vấn đề: Lưu OTP plaintext, nếu DB leak hacker có thể chiếm tài khoản qua flow reset password.
    // Giải pháp: Lưu hash OTP + expiry, set select:false để OTP không vô tình bị trả về client.
    resetOTPHash: { type: String, select: false },
    resetOTPExpiry: { type: Date, select: false },
    resetOTPVerified: { type: Boolean, default: false, select: false }
}, { timestamps: true });

// Vấn đề: Lưu password thô vi phạm mọi best practice; nếu DB leak attacker có ngay tài khoản user.
// Giải pháp: Pre-save hook tự hash bằng bcrypt cost 12, chỉ chạy khi field password thay đổi để tránh hash 2 lần.
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Vấn đề: Field password có select:false nên có lúc this.password = undefined, bcrypt.compare sẽ throw 500.
// Giải pháp: Trả về false sớm nếu password chưa được populate, để controller tự gọi với .select('+password').
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false; // Tránh lỗi 500 khi so sánh với undefined
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);