const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);

router.put('/profile',
    protect,
    upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cv', maxCount: 1 }]),
    authController.updateProfile
);

router.put('/change-password', protect, authController.changePassword);

module.exports = router;