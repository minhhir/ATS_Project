const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { isRecruiter } = require('../middlewares/role'); // Dùng file role.js đã tạo hôm qua
const jobController = require('../controllers/jobController');

// public routes
router.get('/', jobController.getJobs);
// Route /featured đặt trước /:id để tránh xung đột
router.get('/featured', jobController.getFeaturedJobs);
router.get('/:id', jobController.getJobById);

// protected routes - chỉ recruiter mới được tạo/sửa/xóa job
router.use(protect, isRecruiter);

router.post('/', jobController.createJob);
router.put('/:id', jobController.updateJob);
router.delete('/:id', jobController.deleteJob);
router.patch('/:id/feature', jobController.toggleFeatured);

module.exports = router;