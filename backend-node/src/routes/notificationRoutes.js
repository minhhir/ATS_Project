const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', protect, notificationController.getNotifications);
router.put('/read-all', protect, notificationController.markAsRead);
router.patch('/:id/read', protect, notificationController.markOneAsRead);

module.exports = router;