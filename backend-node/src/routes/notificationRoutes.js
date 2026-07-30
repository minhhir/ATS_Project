const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const notificationController = require('../controllers/notificationController');

// Vấn đề: Mọi notification đều của user đăng nhập → cần protect ở mọi route; nếu thiếu sẽ lộ thông báo private.
// Giải pháp: Gắn protect lên từng route để middleware lấy req.user trước khi controller filter theo recipient.
router.get('/', protect, notificationController.getNotifications);
router.put('/read-all', protect, notificationController.markAsRead);
router.patch('/:id/read', protect, notificationController.markOneAsRead);

module.exports = router;