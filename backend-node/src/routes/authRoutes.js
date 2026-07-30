const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');
const rateLimit = require('express-rate-limit');

// Vấn đề: /login và /register dễ bị brute-force/email-spam.
// Giải pháp: Áp riêng rate-limit chặt (20 req / 15 phút / IP) cho 2 endpoint này thay vì share global limiter.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút!' }
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);

// Vấn đề: Update profile có thể kèm avatar (image) lẫn CV (PDF), 2 file khác mimetype và folder Cloudinary.
// Giải pháp: upload.fields cho phép nhận nhiều field file song song, mỗi field maxCount=1.
router.put('/profile',
    protect,
    upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cv', maxCount: 1 }]),
    authController.updateProfile
);

router.put('/change-password', protect, authController.changePassword);

module.exports = router;