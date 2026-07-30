const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { isRecruiter, isAdmin } = require('../middlewares/role');
const jobController = require('../controllers/jobController');

// Vấn đề: Express match route theo thứ tự — nếu /:id đặt trước /my-jobs sẽ "ăn" luôn URL /my-jobs khiến controller chi tiết bị gọi nhầm.
// Giải pháp: Khai báo route cụ thể (/my-jobs, /recruiter, /stats/...) trước /:id; dùng router.use() ở cuối cho block CRUD chỉ HR.
router.get('/', jobController.getJobs);
router.get('/featured', jobController.getFeaturedJobs);
router.get('/my-jobs', protect, isRecruiter, jobController.getMyJobs);
router.get('/recruiter', protect, isRecruiter, jobController.getRecruiterJobs);
router.get('/stats/summary', protect, isRecruiter, jobController.getDashboardStats);
router.get('/stats/analytics', protect, isRecruiter, jobController.getRecruiterAnalytics);

// Vấn đề: Trang chi tiết job vừa cho khách (chưa login) xem tin approved, vừa cho recruiter/admin xem cả tin pending của mình.
// Giải pháp: Đặt route public ở đây (không có protect), việc kiểm tra quyền chuyển sang controller xử lý theo state job.
router.get('/:id', jobController.getJobById);

// Vấn đề: Tính năng "đẩy tin Hot" là đặc quyền admin, không nằm chung middleware isRecruiter ở dưới.
// Giải pháp: Khai báo riêng với isAdmin trước khi router.use chuyển sang scope HR.
router.patch('/:id/feature', protect, isAdmin, jobController.toggleFeatured);

// Vấn đề: Mọi route CRUD job phía dưới đều cần protect + isRecruiter, viết lại từng route gây lặp.
// Giải pháp: router.use(protect, isRecruiter) áp middleware cho toàn bộ route khai báo sau dòng này.
router.use(protect, isRecruiter);

router.post('/', jobController.createJob);
router.put('/:id', jobController.updateJob);
router.delete('/:id', jobController.deleteJob);

module.exports = router;