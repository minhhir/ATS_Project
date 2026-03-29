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
//admin cũng có quyền xem tất cả ứng viên

router.get('/job/:jobId',
    protect, isRecruiter,
    applicationController.getApplicationsByJob
);

router.patch('/:id/feature',
    protect, isRecruiter,
    applicationController.toggleFeatured
);

router.post('/:id/score',
    protect, isRecruiter,
    applicationController.retriggerScore
);

// Route với :id đặt cuối cùng để tránh xung đột
router.patch('/:id/status',
    protect, isRecruiter,
    applicationController.updateApplicationStatus
);

module.exports = router;