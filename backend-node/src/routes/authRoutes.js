const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// ─── Hiện có ──────────────────────────────────────────────────────────────────
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);

// ─── THÊM MỚI: Reset password flow (3 bước) ──────────────────────────────────
// Bước 1: Yêu cầu OTP
router.post('/forgot-password', authController.forgotPassword);
// Bước 2: Xác minh OTP
router.post('/verify-otp', authController.verifyOTP);
// Bước 3: Đặt lại mật khẩu
router.post('/reset-password', authController.resetPassword);

module.exports = router;