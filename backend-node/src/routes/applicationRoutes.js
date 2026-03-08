const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { isCandidate, isRecruiter } = require('../middlewares/role');
const { upload } = require('../middlewares/upload');
const applicationController = require('../controllers/applicationController');

// candidate routes
router.post('/:jobId/apply', protect, isCandidate, upload.single('cv'), applicationController.applyForJob);

// recruiter routes/andmin routes
// Nguyên tắc vàng: Route có path cụ thể (/job/...) LUÔN đặt lên TRƯỚC route chỉ chứa tham số động (/:id)
router.get('/job/:jobId', protect, isRecruiter, applicationController.getApplicationsByJob);

//có thể thêm route xem chi tiết đơn ứng tuyển nếu cần, nhưng hiện tại chưa có yêu cầu cụ thể nên tạm comment lại
// router.get('/:id', protect, applicationController.getApplicationById);

// Route xử lý thao tác với ID cụ thể đặt ở dưới cùng
router.patch('/:id/status', protect, isRecruiter, applicationController.updateApplicationStatus);

module.exports = router;