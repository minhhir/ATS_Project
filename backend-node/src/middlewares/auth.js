const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Phải import model User

exports.protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
        return res.status(401).json({ message: 'Chưa đăng nhập' });

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // ✅ FIX: Phải kiểm tra user dưới DB
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({ message: 'Tài khoản không còn tồn tại trên hệ thống' });
        }
        if (!currentUser.isActive) {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
        }

        req.user = currentUser; // Truyền nguyên object user xịn đi tiếp
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};