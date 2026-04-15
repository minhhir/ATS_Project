const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { isCandidate, isRecruiter } = require('../middlewares/role');
const { upload } = require('../middlewares/upload');
const applicationController = require('../controllers/applicationController');

//candidate nộp CV
router.post('/:jobId/apply',
    protect, isCandidate,
    upload.single('cv'),
    applicationController.applyForJob
);
// HR xem danh sách ứng viên cho 1 job
router.get('/job/:jobId', protect, isRecruiter, applicationController.getApplicationsByJob);
//admin cũng có quyền xem tất cả ứng viên
router.patch('/:id/feature', protect, isRecruiter, applicationController.toggleFeatured);
router.post('/:id/score', protect, isRecruiter, applicationController.retriggerScore);
router.patch('/:id/status', protect, isRecruiter, applicationController.updateApplicationStatus);
router.get('/me', protect, isCandidate, applicationController.getMyApplications);
module.exports = router;