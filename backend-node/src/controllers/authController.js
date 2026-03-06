const authService = require('../services/authService');

// Cấu hình Cookie
const COOKIE_OPTIONS = {
    httpOnly: true,   // JS trên trình duyệt không đọc được (Chống XSS)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 ngày
};

exports.register = async (req, res, next) => {
    try {
        const { accessToken, refreshToken } = await authService.register(req.body);
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
        res.status(201).json({ success: true, accessToken });
    } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
    try {
        const { tokens, user } = await authService.login(req.body);
        res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
        res.json({
            success: true,
            accessToken: tokens.accessToken,
            user: { id: user._id, name: user.name, role: user.role, email: user.email }
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
exports.getMe = async (req, res, next) => {
    try {
        // req.user đã được gán từ middleware protect
        const user = await require('../models/User').findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });

        res.json({
            success: true,
            user: { id: user._id, name: user.name, role: user.role, email: user.email, avatar: user.avatar }
        });
    } catch (err) { next(err); }
};