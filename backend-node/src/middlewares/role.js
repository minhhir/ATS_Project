
// Nhận nhiều roles được phép
exports.role = (...allowedRoles) => (req, res, next) => {
    if (!allowedRoles.includes(req.user.role))
        return res.status(403).json({ message: 'Không có quyền truy cập' });
    next();
};

// Các hàm viết tắt cho tiện gọi
exports.isAdmin = (req, res, next) => exports.role('admin')(req, res, next);
exports.isRecruiter = (req, res, next) => exports.role('admin', 'recruiter')(req, res, next);
exports.isCandidate = (req, res, next) => exports.role('candidate')(req, res, next);