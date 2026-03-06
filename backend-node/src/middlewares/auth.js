const jwt = require('jsonwebtoken');

// Xác thực JWT từ Authorization header
exports.protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
        return res.status(401).json({ message: 'Chưa đăng nhập' });

    try {
        const token = authHeader.split(' ')[1];
        req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        next();
    } catch {
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};