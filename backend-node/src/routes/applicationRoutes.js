const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { isCandidate, isRecruiter } = require('../middlewares/role');
const { upload } = require('../middlewares/upload');
const applicationController = require('../controllers/applicationController');


// Vấn đề: Apply nộp CV là form-data multi-part, cần parser đặc biệt; chỉ candidate mới được apply.
// Giải pháp: Pipeline middleware protect → isCandidate → upload.single('cv') → controller.
router.post('/:jobId/apply', protect, isCandidate, upload.single('cv'), applicationController.applyForJob);
router.get('/me', protect, isCandidate, applicationController.getMyApplications);

// Vấn đề: HR cần xem danh sách ứng viên theo từng job và "tất cả của tôi"; URL /:jobId='all' sẽ xung đột nếu không thiết kế cẩn thận.
// Giải pháp: Đặt prefix /job/ cho nhánh HR, controller xử lý jobId='all' để gộp 2 use-case vào 1 endpoint.
router.get('/job/:jobId', protect, isRecruiter, applicationController.getApplicationsByJob);

router.patch('/:id/feature', protect, isRecruiter, applicationController.toggleFeatured);
router.post('/:id/score', protect, isRecruiter, applicationController.retriggerScore);
router.patch('/:id/status', protect, isRecruiter, applicationController.updateApplicationStatus);

// Vấn đề: Report là tính năng dành cho HR (báo CV giả); chỉ có protect thì bất kỳ user đã đăng nhập
// nào (kể cả candidate) cũng gọi được endpoint, dựa hoàn toàn vào check ownership ở controller.
// Giải pháp: Thêm isRecruiter cùng pattern các route recruiter-only khác trong file này, controller
// vẫn giữ nguyên check recruiter của job khớp người gọi như một lớp phòng thủ thứ hai.
router.post('/:id/report', protect, isRecruiter, applicationController.reportApplication);

module.exports = router;