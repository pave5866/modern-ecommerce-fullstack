const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateEmailValidation,
  updatePasswordValidation,
  validateRequest
} = require('../middlewares/validators/auth.validator');

// Kimlik doğrulama rotaları
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);
router.get('/logout', authController.logout);
router.get('/me', protect, authController.getMe);
router.get('/refresh-token', authController.refreshToken);

// Şifre işlemleri
router.post('/forgot-password', forgotPasswordValidation, validateRequest, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, validateRequest, authController.resetPassword);
router.patch('/update-password', protect, updatePasswordValidation, validateRequest, authController.updatePassword);

// E-posta değiştirme
router.patch('/update-email', protect, updateEmailValidation, validateRequest, authController.updateEmail);

// Kullanıcı hesabı yönetimi
router.delete('/delete-account', protect, authController.deleteAccount);

module.exports = router;