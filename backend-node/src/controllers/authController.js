const authService = require('../services/authService');
const User = require('../models/User');

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
};

// ─── Hiện có ──────────────────────────────────────────────────────────────────

exports.register = async (req, res, next) => {
    try {
        const { tokens, user } = await authService.register(req.body);
        res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
        res.status(201).json({
            success: true,
            accessToken: tokens.accessToken,
            user: { id: user._id, name: user.name, role: user.role, email: user.email },
        });
    } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password, rememberMe } = req.body;
        const { tokens, user } = await authService.login({ email, password });

        const COOKIE_OPTIONS = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        };

        if (rememberMe) {
            COOKIE_OPTIONS.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 ngày
        }

        res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

        res.json({
            success: true,
            accessToken: tokens.accessToken,
            user: { id: user._id, name: user.name, role: user.role, email: user.email },
        });
    } catch (err) { next(err); }
};
exports.refresh = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return res.status(401).json({ message: 'Không tìm thấy refresh token' });

        const { accessToken, refreshToken } = await authService.refreshToken(token);
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
        res.json({ accessToken });
    } catch (err) { next(err); }
};

exports.logout = (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Đăng xuất thành công' });
};

exports.getMe = (req, res) => {
    // protect middleware đã load user từ DB, dùng luôn không cần query thêm
    const user = req.user;
    res.json({
        success: true,
        user: {
            id: user._id,
            name: user.name,
            role: user.role,
            email: user.email,
            avatar: user.avatar,
            phone: user.phone,
            skills: user.skills,
            cvUrl: user.cvUrl,
            companyName: user.companyName,
            companyLogo: user.companyLogo,
            companyWebsite: user.companyWebsite,
            companyDesc: user.companyDesc,
        },
    });
};

// ─── THÊM MỚI: Reset password flow ───────────────────────────────────────────

/**
 * [POST] /api/auth/forgot-password
 * Body: { email }
 * → Tạo OTP 6 số, hash lưu DB, log ra console (dev) hoặc gửi email (prod)
 * Luôn trả 200 dù email không tồn tại (tránh lộ thông tin)
 */
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Vui lòng nhập email' });

        await authService.forgotPassword({ email });

        // Luôn trả success — không tiết lộ email có tồn tại không
        res.json({
            success: true,
            message: 'Nếu email tồn tại, chúng tôi đã gửi mã xác nhận.',
        });
    } catch (err) { next(err); }
};

/**
 * [POST] /api/auth/verify-otp
 * Body: { email, otp }
 * → Xác minh OTP còn hạn, đánh dấu verified trong DB
 */
exports.verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Vui lòng cung cấp email và mã OTP' });
        }

        await authService.verifyOTP({ email, otp: String(otp) });

        res.json({ success: true, message: 'OTP hợp lệ. Bạn có thể đặt lại mật khẩu.' });
    } catch (err) { next(err); }
};

/**
 * [POST] /api/auth/reset-password
 * Body: { email, otp, newPassword }
 * → Kiểm tra OTP đã verified, cập nhật mật khẩu, xóa OTP fields
 */
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }

        await authService.resetPassword({ email, otp: String(otp), newPassword });

        res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
    } catch (err) { next(err); }
};
// [PUT] /api/auth/profile - Cập nhật thông tin cá nhân
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, phone, skills, companyName, companyWebsite, companyDesc } = req.body;
        const user = await User.findById(req.user.id);

        // Update thông tin chung
        if (name !== undefined) user.name = name;
        if (phone !== undefined) user.phone = phone;

        // Update riêng cho Ứng viên
        if (user.role === 'candidate' && skills !== undefined) {
            // Tự động băm chuỗi "React, NodeJS" thành mảng ['React', 'NodeJS']
            user.skills = typeof skills === 'string'
                ? skills.split(',').map(s => s.trim()).filter(Boolean)
                : skills;
        }

        // Update riêng cho Nhà tuyển dụng
        if (user.role === 'recruiter' || user.role === 'admin') {
            if (companyName !== undefined) user.companyName = companyName;
            if (companyWebsite !== undefined) user.companyWebsite = companyWebsite;
            if (companyDesc !== undefined) user.companyDesc = companyDesc;
        }

        await user.save();

        res.json({ success: true, message: 'Cập nhật thành công', user });
    } catch (err) { next(err); }
};