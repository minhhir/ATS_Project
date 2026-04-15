const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { isRecruiter } = require('../middlewares/role');
const jobController = require('../controllers/jobController');

// public routes
router.get('/', jobController.getJobs);
router.get('/featured', jobController.getFeaturedJobs);

// ✅ FIX: Đưa route /my-jobs lên TRƯỚC /:id, và phải gắn protect để lấy req.user.id
router.get('/my-jobs', protect, isRecruiter, jobController.getMyJobs);

// Route /:id bắt buộc phải để ở cuối nhóm GET
router.get('/:id', jobController.getJobById);

// protected routes - chỉ recruiter mới được tạo/sửa/xóa job
router.use(protect, isRecruiter);

router.post('/', jobController.createJob);
router.put('/:id', jobController.updateJob);
router.delete('/:id', jobController.deleteJob);
router.patch('/:id/feature', jobController.toggleFeatured);

module.exports = router;