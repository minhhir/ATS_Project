const authService = require('../services/authService');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { uploadToCloudinary } = require('../middlewares/upload');

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

exports.register = async (req, res, next) => {
    try {
        const { tokens, user } = await authService.register(req.body);
        res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
        res.status(201).json({ success: true, accessToken: tokens.accessToken, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
    } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password, rememberMe } = req.body;
        const { tokens, user } = await authService.login({ email, password });
        const CURRENT_COOKIE_OPTIONS = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' };
        if (rememberMe) CURRENT_COOKIE_OPTIONS.maxAge = 7 * 24 * 60 * 60 * 1000;
        res.cookie('refreshToken', tokens.refreshToken, CURRENT_COOKIE_OPTIONS);
        res.json({ success: true, accessToken: tokens.accessToken, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
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
    const user = req.user;
    res.json({ success: true, user: { id: user._id, name: user.name, role: user.role, email: user.email, avatar: user.avatar, phone: user.phone, skills: user.skills, cvUrl: user.cvUrl, companyName: user.companyName, companyLogo: user.companyLogo, companyWebsite: user.companyWebsite, companyDesc: user.companyDesc } });
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Vui lòng nhập email' });
        await authService.forgotPassword({ email });
        res.json({ success: true, message: 'Nếu email tồn tại, chúng tôi đã gửi mã xác nhận.' });
    } catch (err) { next(err); }
};

exports.verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Vui lòng cung cấp email và mã OTP' });
        await authService.verifyOTP({ email, otp: String(otp) });
        res.json({ success: true, message: 'OTP hợp lệ. Bạn có thể đặt lại mật khẩu.' });
    } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        await authService.resetPassword({ email, otp: String(otp), newPassword });
        res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
    } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) throw new AppError('Vui lòng nhập đầy đủ mật khẩu!', 400);
        const user = await User.findById(req.user.id).select('+password');
        if (!user) throw new AppError('Không tìm thấy người dùng', 404);
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) throw new AppError('Mật khẩu hiện tại không chính xác', 401);
        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (err) { next(err); }
};

// ✅ FIX LỖI "Cannot read properties of undefined (reading 'name')"
exports.updateProfile = async (req, res, next) => {
    try {
        // Cứu cánh an toàn: Nếu upload.fields hỏng, req.body vẫn là một object rỗng
        const body = req.body || {};
        const updateData = {};

        if (body.name !== undefined) updateData.name = body.name;
        if (body.phone !== undefined) updateData.phone = body.phone;

        if (body.skills !== undefined) {
            updateData.skills = typeof body.skills === 'string'
                ? body.skills.split(',').map(s => s.trim()).filter(Boolean)
                : body.skills;
        }

        if (body.companyName !== undefined) updateData.companyName = body.companyName;
        if (body.companyWebsite !== undefined) updateData.companyWebsite = body.companyWebsite;
        if (body.companyDesc !== undefined) updateData.companyDesc = body.companyDesc;

        if (req.files) {
            if (req.files.avatar && req.files.avatar[0]) {
                const avatarResult = await uploadToCloudinary(req.files.avatar[0].buffer, req.files.avatar[0].originalname, true);
                updateData.avatar = avatarResult.secure_url;
            }
            if (req.files.cv && req.files.cv[0]) {
                const cvResult = await uploadToCloudinary(req.files.cv[0].buffer, req.files.cv[0].originalname, false);
                updateData.cvUrl = cvResult.secure_url;
            }
        }

        const user = await User.findByIdAndUpdate(req.user.id, updateData, { returnDocument: 'after' }).select('-password');
        res.json({ success: true, message: 'Cập nhật thành công!', data: user });
    } catch (err) {
        console.error(' [LỖI UPDATE PROFILE]:', err);
        next(err);
    }
};