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

        // Trả về full object user (trừ password) để Frontend có đủ data ngay lập tức
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            accessToken: tokens.accessToken,
            user: userResponse
        });
    } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password, rememberMe } = req.body;
        const { tokens, user } = await authService.login({ email, password });

        const cookieOptions = { ...COOKIE_OPTIONS };
        if (!rememberMe) delete cookieOptions.maxAge;
        res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            accessToken: tokens.accessToken, // ✅ ĐÃ FIX: Lấy từ tokens.accessToken
            user: userResponse
        });
    } catch (err) { next(err); }
};

exports.refresh = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) throw new AppError('Không tìm thấy refresh token', 401);
        const { accessToken, refreshToken } = await authService.refreshToken(token);
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
        res.json({ success: true, accessToken });
    } catch (err) { next(err); }
};

exports.logout = (req, res) => {
    const { maxAge, ...clearOptions } = COOKIE_OPTIONS;
    res.clearCookie('refreshToken', clearOptions);
    res.json({ success: true, message: 'Đăng xuất thành công' });
};

exports.getMe = async (req, res, next) => {
    try {
        // ✅ ĐÃ FIX: Không tự tạo object nữa, trả về toàn bộ dữ liệu từ DB (trừ password)
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json({
            success: true,
            user: user
        });
    } catch (error) {
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) throw new AppError('Vui lòng nhập email', 400);
        await authService.forgotPassword({ email });
        res.json({ success: true, message: 'Nếu email tồn tại, chúng tôi đã gửi mã xác nhận.' });
    } catch (err) { next(err); }
};

exports.verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) throw new AppError('Vui lòng cung cấp email và mã OTP', 400);
        await authService.verifyOTP({ email, otp: String(otp) });
        res.json({ success: true, message: 'OTP hợp lệ. Bạn có thể đặt lại mật khẩu.' });
    } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) throw new AppError('Thiếu thông tin bắt buộc', 400);
        await authService.resetPassword({ email, otp: String(otp), newPassword });
        res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
    } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) throw new AppError('Vui lòng nhập đầy đủ mật khẩu!', 400);
        if (newPassword.length < 6) throw new AppError('Mật khẩu mới phải ít nhất 6 ký tự', 400);

        const userId = req.user._id || req.user.id;
        const user = await User.findById(userId).select('+password');
        if (!user) throw new AppError('Không tìm thấy người dùng', 404);

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) throw new AppError('Mật khẩu hiện tại không chính xác', 401);

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
        next(err);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
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

        const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
        res.json({ success: true, message: 'Cập nhật thành công!', data: user });
    } catch (err) {
        console.error(' [LỖI UPDATE PROFILE]:', err);
        next(err);
    }
};