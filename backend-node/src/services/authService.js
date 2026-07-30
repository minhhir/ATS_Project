const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Vấn đề: Dùng 1 token duy nhất buộc phải chọn giữa "ngắn hạn → hay phải đăng nhập lại" và "dài hạn → rủi ro lộ token"; cần cả role để middleware phân quyền nhanh không phải truy DB.
// Giải pháp: Cấp đôi token — accessToken ngắn hạn kèm role, refreshToken dài hạn chỉ chứa id để rotate khi access hết hạn.
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

// Vấn đề: Math.random không an toàn về mặt mật mã, kẻ tấn công có thể dò OTP.
// Giải pháp: Dùng crypto.randomInt để sinh OTP 6 số ngẫu nhiên đủ entropy.
const generateOTP = () =>
    String(crypto.randomInt(100000, 999999));

// ─── Auth service methods ─────────────────────────────────────────────────────

// Vấn đề: Nếu để Mongoose tự validate, lỗi trả về dạng kỹ thuật (cast/validation) khó cho FE; user có thể tự gửi role='admin' để chiếm quyền.
// Giải pháp: Validate sớm bằng regex/length, whitelist role chỉ candidate|recruiter, đồng thời reject email trùng trước khi insert.
exports.register = async ({ name, email, password, role, companyName }) => {
    if (!name?.trim() || name.trim().length < 2)
        throw new AppError('Họ tên phải từ 2 ký tự trở lên', 400);
    const emailRe = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRe.test(email))
        throw new AppError('Email không đúng định dạng', 400);
    if (!password || password.length < 6)
        throw new AppError('Mật khẩu phải ít nhất 6 ký tự', 400);

    const existing = await User.findOne({ email });
    if (existing) throw new AppError('Email đã được sử dụng', 400);

    // Vấn đề: User có thể submit role='admin' qua API để leo thang đặc quyền.
    // Giải pháp: Whitelist role hợp lệ, fallback về candidate nếu input lạ.
    const allowedRoles = ['candidate', 'recruiter'];
    const safeRole = allowedRoles.includes(role) ? role : 'candidate';

    const userData = { name, email, password, role: safeRole };
    if (safeRole === 'recruiter') userData.companyName = companyName;

    const user = await User.create(userData);
    return { tokens: generateTokens(user._id, user.role), user };
};

// Vấn đề: Trả error khác nhau cho "email không tồn tại" vs "sai mật khẩu" sẽ giúp attacker enumerate email; password field bị select:false trong schema.
// Giải pháp: Chỉ trả 1 thông báo chung "Email hoặc mật khẩu không đúng", và .select('+password') để có field so sánh.
exports.login = async ({ email, password }) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }
    if (!user.isActive) throw new AppError('Tài khoản đã bị khóa', 403);

    return { tokens: generateTokens(user._id, user.role), user };
};

// Vấn đề: Access token hết hạn nhanh (security) nhưng user không muốn login lại liên tục; jwt.verify throw nhiều exception khác nhau.
// Giải pháp: Dùng refresh token dài hạn để issue access token mới; gói mọi lỗi verify thành 401 để FE biết phải logout.
exports.refreshToken = async (token) => {
    try {
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

// Vấn đề: Nếu trả "email không tồn tại", attacker dùng endpoint này để dò email user; OTP plaintext nếu bị lưu sẽ thành key vào tài khoản.
// Giải pháp: Luôn trả success:true bất kể email có tồn tại hay không; OTP được hash bcrypt và có expiry 10 phút.
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

    // Vấn đề: Chưa có service email thật, dev cần xem OTP để test flow.
    // Giải pháp: Log OTP ra console chỉ khi không phải production.
    if (process.env.NODE_ENV !== 'production') {
        console.log(`\n📧 [DEV] OTP reset password cho ${email}: ${otp}\n`);
    }

    return { success: true };
};

// Vấn đề: Cho user reset password ngay sau khi nhập OTP đúng dễ bị bot brute-force OTP rồi chiếm tài khoản; OTP có thể được gửi dạng số khiến bcrypt.compare crash.
// Giải pháp: Tách verify OTP thành bước riêng (set resetOTPVerified=true), ép kiểu String(otp) trước khi compare.
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

// Vấn đề: Cần đảm bảo chỉ ai đã verify OTP ở bước trước mới được đổi password, và OTP không bị reuse cho các lần reset sau.
// Giải pháp: Check resetOTPVerified=true + expiry còn hiệu lực, sau khi đổi password thì xoá hết các field OTP.
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