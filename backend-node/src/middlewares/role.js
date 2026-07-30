
// Vấn đề: Nhiều route cần phân quyền theo role, nếu mỗi controller tự check sẽ rời rạc và dễ sót.
// Giải pháp: Một factory nhận danh sách role cho phép → trả về middleware reusable cho mọi route.
exports.role = (...allowedRoles) => (req, res, next) => {
    if (!allowedRoles.includes(req.user.role))
        return res.status(403).json({ message: 'Không có quyền truy cập' });
    next();
};

// Vấn đề: Gọi role('admin') khắp nơi bị lặp và dễ sai chính tả role.
// Giải pháp: Wrap sẵn các tổ hợp role hay dùng để route chỉ cần import isAdmin / isRecruiter / isCandidate.
exports.isAdmin = (req, res, next) => exports.role('admin')(req, res, next);
exports.isRecruiter = (req, res, next) => exports.role('admin', 'recruiter')(req, res, next);
exports.isCandidate = (req, res, next) => exports.role('candidate')(req, res, next);