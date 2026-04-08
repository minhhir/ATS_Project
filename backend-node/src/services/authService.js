const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateTokens = (userId, role) => {
    const accessToken = jwt.sign(
        { id: userId, role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES }
    );
    const refreshToken = jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES }
    );
    return { accessToken, refreshToken };
};

/** Tạo OTP 6 chữ số ngẫu nhiên (crypto-safe) */
const generateOTP = () =>
    String(crypto.randomInt(100000, 999999));

// ─── Auth service methods ─────────────────────────────────────────────────────

exports.register = async ({ name, email, password, role, companyName }) => {
    // FIXED: Thêm validation đầu vào để tránh lỗi 500 từ Mongoose (Bug 15)
    if (!name?.trim() || name.trim().length < 2)
        throw new AppError('Họ tên phải từ 2 ký tự trở lên', 400);
    const emailRe = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRe.test(email))
        throw new AppError('Email không đúng định dạng', 400);
    if (!password || password.length < 6)
        throw new AppError('Mật khẩu phải ít nhất 6 ký tự', 400);

    const existing = await User.findOne({ email });
    if (existing) throw new AppError('Email đã được sử dụng', 400);

    const allowedRoles = ['candidate', 'recruiter'];
    const safeRole = allowedRoles.includes(role) ? role : 'candidate';

    const userData = { name, email, password, role: safeRole };
    if (safeRole === 'recruiter') userData.companyName = companyName;

    const user = await User.create(userData);
    // FIXED: Trả về đồng nhất giống hàm login (trả cả tokens và user)
    return { tokens: generateTokens(user._id, user.role), user };
};

exports.login = async ({ email, password }) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }
    if (!user.isActive) throw new AppError('Tài khoản đã bị khóa', 403);

    return { tokens: generateTokens(user._id, user.role), user };
};

exports.refreshToken = async (token) => {
    try {
        // FIXED: Bọc try-catch để bắt lỗi token hết hạn/sai chữ ký
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) throw new AppError('User không tồn tại', 404);
        if (!user.isActive) throw new AppError('Tài khoản đã bị khóa', 403);

        return generateTokens(user._id, user.role);
    } catch (error) {
        // Biến mọi lỗi JWT thành 401 để Frontend tự động Logout
        throw new AppError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn', 401);
    }
};

// ─── Reset password flow ───────────────────────────────────────────

exports.forgotPassword = async ({ email }) => {
    const user = await User.findOne({ email });

    if (!user || !user.isActive) return { success: true };

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    await User.findByIdAndUpdate(user._id, {
        resetOTPHash: otpHash,
        resetOTPExpiry: expiry,
        resetOTPVerified: false,
    });

    if (process.env.NODE_ENV !== 'production') {
        console.log(`\n📧 [DEV] OTP reset password cho ${email}: ${otp}\n`);
    }

    return { success: true };
};

exports.verifyOTP = async ({ email, otp }) => {
    if (!otp) throw new AppError('Vui lòng cung cấp mã OTP', 400);

    const user = await User.findOne({ email })
        .select('+resetOTPHash +resetOTPExpiry +resetOTPVerified');

    if (!user) throw new AppError('Email không tồn tại', 404);

    if (!user.resetOTPHash || !user.resetOTPExpiry) {
        throw new AppError('Chưa có yêu cầu đặt lại mật khẩu. Vui lòng thử lại.', 400);
    }

    if (new Date() > user.resetOTPExpiry) {
        await User.findByIdAndUpdate(user._id, {
            resetOTPHash: null, resetOTPExpiry: null, resetOTPVerified: false,
        });
        throw new AppError('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.', 400);
    }

    // FIXED: Ép kiểu String(otp) để tránh crash nếu client gửi lên số nguyên (Integer)
    const isValid = await bcrypt.compare(String(otp), user.resetOTPHash);
    if (!isValid) throw new AppError('Mã OTP không đúng.', 400);

    await User.findByIdAndUpdate(user._id, { resetOTPVerified: true });

    return { success: true };
};

exports.resetPassword = async ({ email, otp, newPassword }) => {
    if (!newPassword || newPassword.length < 6) {
        throw new AppError('Mật khẩu mới phải ít nhất 6 ký tự', 400);
    }
    if (!otp) throw new AppError('Vui lòng cung cấp mã OTP', 400);

    const user = await User.findOne({ email })
        .select('+resetOTPHash +resetOTPExpiry +resetOTPVerified');

    if (!user) throw new AppError('Email không tồn tại', 404);

    if (!user.resetOTPVerified) {
        throw new AppError('Vui lòng xác minh OTP trước khi đặt lại mật khẩu.', 400);
    }

    if (!user.resetOTPHash || !user.resetOTPExpiry || new Date() > user.resetOTPExpiry) {
        throw new AppError('Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thử lại.', 400);
    }

    // FIXED: Ép kiểu String(otp) tương tự bên trên
    const isValid = await bcrypt.compare(String(otp), user.resetOTPHash);
    if (!isValid) throw new AppError('Mã OTP không hợp lệ.', 400);

    user.password = newPassword;
    user.resetOTPHash = undefined;
    user.resetOTPExpiry = undefined;
    user.resetOTPVerified = false;
    await user.save();

    return { success: true };
};