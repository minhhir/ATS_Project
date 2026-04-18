const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { isCandidate, isRecruiter } = require('../middlewares/role');
const { upload } = require('../middlewares/upload');
const applicationController = require('../controllers/applicationController');


router.post('/:jobId/apply', protect, isCandidate, upload.single('cv'), applicationController.applyForJob);
router.get('/me', protect, isCandidate, applicationController.getMyApplications);
router.get('/my-apps', protect, isCandidate, applicationController.getMyApplications);

// HR thao tác với hồ sơ ứng viên
router.patch('/:id/feature', protect, isRecruiter, applicationController.toggleFeatured);
router.post('/:id/score', protect, isRecruiter, applicationController.retriggerScore);
router.patch('/:id/status', protect, isRecruiter, applicationController.updateApplicationStatus);

module.exports = router;