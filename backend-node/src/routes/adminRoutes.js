const express = require('express');
const { protect } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Middleware kiểm tra quyền Admin
const checkAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ dành cho Quản trị viên!' });
    }
};

// ==========================================
// CÁC ROUTES CỦA ADMIN (Đã thêm /reports)
// ==========================================

// Thống kê & Báo cáo
router.get('/dashboard', protect, checkAdmin, adminController.getDashboardData);
router.get('/analytics', protect, checkAdmin, adminController.getAnalytics);
router.get('/reports', protect, checkAdmin, adminController.getReportedApplications); // <- DÒNG NÀY ĐANG BỊ THIẾU GÂY LỖI 404

// Quản lý Users
router.get('/users', protect, checkAdmin, adminController.getAllUsers);
router.get('/users/:id', protect, checkAdmin, adminController.getUserDetail);
router.delete('/users/:id', protect, checkAdmin, adminController.deleteUser);

// Quản lý Jobs
router.get('/jobs', protect, checkAdmin, adminController.getAllJobs);
router.patch('/jobs/:id/approve', protect, checkAdmin, adminController.approveJob);
router.delete('/jobs/:id', protect, checkAdmin, adminController.deleteJob);
// Quản lý Đơn ứng tuyển (Dành cho chức năng Thẩm định)
router.get('/applications/:id', protect, checkAdmin, adminController.getApplicationDetail);
//xóa đơn ứng tuyển (Dành cho chức năng Thẩm định)
router.delete('/applications/:id', protect, checkAdmin, adminController.deleteApplication);
module.exports = router;