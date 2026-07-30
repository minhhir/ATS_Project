const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Phải import model User

// Vấn đề: Các route private cần đảm bảo người gọi đã đăng nhập và account còn hiệu lực; verify JWT đơn thuần không đủ vì user có thể đã bị xóa hoặc bị admin khóa.
// Giải pháp: Verify token, sau đó load user từ DB để chặn các trường hợp deleted/disabled, và gắn user thật vào req.user cho controller dùng tiếp.
exports.protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
        return res.status(401).json({ message: 'Chưa đăng nhập' });

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Vấn đề: Token vẫn hợp lệ về chữ ký nhưng user có thể đã bị xóa hoặc bị admin khóa.
        // Giải pháp: Truy DB để xác nhận user còn tồn tại và isActive trước khi cho qua.
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