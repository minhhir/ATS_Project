const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateTokens = (userId, role) => {
    // Tạo Access Token (sống ngắn - 15p)
    const accessToken = jwt.sign(
        { id: userId, role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES }
    );
    // Tạo Refresh Token (sống dai - 7 ngày)
    const refreshToken = jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES }
    );
    return { accessToken, refreshToken };
};

exports.register = async ({ name, email, password, role, companyName }) => {
    const existing = await User.findOne({ email });
    if (existing) throw new Error('Email đã được sử dụng');

    const userData = { name, email, password, role };
    if (role === 'recruiter') userData.companyName = companyName;

    const user = await User.create(userData);
    return generateTokens(user._id, user.role);
};

exports.login = async ({ email, password }) => {
    // Bắt buộc select('+password') vì mặc định Mongoose có thể ẩn nó đi
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        throw new Error('Email hoặc mật khẩu không đúng');
    }

    if (!user.isActive) throw new Error('Tài khoản đã bị khóa');

    return { tokens: generateTokens(user._id, user.role), user };
};

exports.refreshToken = async (token) => {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new Error('User không tồn tại');
    return generateTokens(user._id, user.role);
};