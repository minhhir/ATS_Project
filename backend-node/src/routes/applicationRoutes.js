const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { isCandidate, isRecruiter } = require('../middlewares/role');
const { upload } = require('../middlewares/upload');
const applicationController = require('../controllers/applicationController');


router.post('/:jobId/apply', protect, isCandidate, upload.single('cv'), applicationController.applyForJob);
router.get('/me', protect, isCandidate, applicationController.getMyApplications);

// HR xem danh sách ứng viên (theo job hoặc 'all')
router.get('/job/:jobId', protect, isRecruiter, applicationController.getApplicationsByJob);

// HR thao tác với hồ sơ ứng viên
router.patch('/:id/feature', protect, isRecruiter, applicationController.toggleFeatured);
router.post('/:id/score', protect, isRecruiter, applicationController.retriggerScore);
router.patch('/:id/status', protect, isRecruiter, applicationController.updateApplicationStatus);

router.post('/:id/report', protect, applicationController.reportApplication);

module.exports = router;