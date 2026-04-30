const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { isRecruiter } = require('../middlewares/role');
const jobController = require('../controllers/jobController');

//1. Các route xem danh sách công khai (Ai cũng xem được)
router.get('/', jobController.getJobs);
router.get('/featured', jobController.getFeaturedJobs);
//2. Các route xem chi tiết công khai (Ai cũng xem được)
// Các route xem danh sách riêng của HR (Gắn thẳng middleware vào từng route)
router.get('/my-jobs', protect, isRecruiter, jobController.getMyJobs);
router.get('/recruiter', protect, isRecruiter, jobController.getRecruiterJobs);
router.get('/stats/summary', protect, isRecruiter, jobController.getDashboardStats);
router.get('/stats/analytics', protect, isRecruiter, jobController.getRecruiterAnalytics);

//
// Đặt ở trên trạm gác router.use() để Ứng viên có thể xem được
router.get('/:id', jobController.getJobById);

//3. Các route thao tác tạo/sửa/xóa (Chỉ HR mới làm được, nên đặt sau middleware kiểm tra role)
router.use(protect, isRecruiter);

// Các route thao tác tạo/sửa/xóa của HR
router.post('/', jobController.createJob);
router.put('/:id', jobController.updateJob);
router.delete('/:id', jobController.deleteJob);
router.patch('/:id/feature', jobController.toggleFeatured);

module.exports = router;