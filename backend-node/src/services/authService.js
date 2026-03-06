const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError'); // <-- Import Error chuẩn

const generateTokens = (userId, role) => {
    const accessToken = jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES });
    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES });
    return { accessToken, refreshToken };
};

exports.register = async ({ name, email, password, role, companyName }) => {
    const existing = await User.findOne({ email });
    if (existing) throw new AppError('Email đã được sử dụng', 400); // <-- Trả về 400

    const userData = { name, email, password, role };
    if (role === 'recruiter') userData.companyName = companyName;

    const user = await User.create(userData);
    return generateTokens(user._id, user.role);
};

exports.login = async ({ email, password }) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        throw new AppError('Email hoặc mật khẩu không đúng', 401); // <-- Trả về 401
    }

    if (!user.isActive) throw new AppError('Tài khoản đã bị khóa', 403); // <-- Trả về 403

    return { tokens: generateTokens(user._id, user.role), user };
};

exports.refreshToken = async (token) => {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) throw new AppError('User không tồn tại', 404);
    if (!user.isActive) throw new AppError('Tài khoản đã bị khóa', 403); // <-- Fix Bug 3: Chặn token nếu bị ban

    return generateTokens(user._id, user.role);
};