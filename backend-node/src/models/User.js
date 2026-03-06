const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
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
}, { timestamps: true });

// Mã hóa mật khẩu trước khi lưu vào database
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Hàm hỗ trợ kiểm tra mật khẩu khi đăng nhập
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);