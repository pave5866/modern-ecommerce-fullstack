const { check, validationResult } = require('express-validator');

// Hataları inceleme ve kullanıcıya geri bildirim sağlama
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(error => ({
        param: error.param,
        msg: error.msg
      }))
    });
  }
  next();
};

// Kayıt doğrulama kuralları
exports.registerValidation = [
  check('name')
    .trim()
    .notEmpty().withMessage('İsim alanı zorunludur')
    .isLength({ min: 2, max: 50 }).withMessage('İsim 2-50 karakter arasında olmalıdır')
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/).withMessage('İsim sadece harflerden oluşmalıdır'),
  
  check('email')
    .trim()
    .notEmpty().withMessage('E-posta alanı zorunludur')
    .isEmail().withMessage('Geçerli bir e-posta adresi giriniz')
    .normalizeEmail(),
  
  check('password')
    .trim()
    .notEmpty().withMessage('Şifre alanı zorunludur')
    .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır')
    .matches(/[a-z]/).withMessage('Şifre en az bir küçük harf içermelidir')
    .matches(/[A-Z]/).withMessage('Şifre en az bir büyük harf içermelidir')
    .matches(/\d/).withMessage('Şifre en az bir rakam içermelidir'),
  
  check('confirmPassword')
    .trim()
    .notEmpty().withMessage('Şifre onay alanı zorunludur')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Şifreler eşleşmiyor');
      }
      return true;
    })
];

// Giriş doğrulama kuralları
exports.loginValidation = [
  check('email')
    .trim()
    .notEmpty().withMessage('E-posta alanı zorunludur')
    .isEmail().withMessage('Geçerli bir e-posta adresi giriniz')
    .normalizeEmail(),
  
  check('password')
    .trim()
    .notEmpty().withMessage('Şifre alanı zorunludur')
];

// Şifre sıfırlama talebi doğrulama kuralları
exports.forgotPasswordValidation = [
  check('email')
    .trim()
    .notEmpty().withMessage('E-posta alanı zorunludur')
    .isEmail().withMessage('Geçerli bir e-posta adresi giriniz')
    .normalizeEmail()
];

// Şifre sıfırlama doğrulama kuralları
exports.resetPasswordValidation = [
  check('token')
    .trim()
    .notEmpty().withMessage('Token alanı zorunludur'),
  
  check('password')
    .trim()
    .notEmpty().withMessage('Şifre alanı zorunludur')
    .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır')
    .matches(/[a-z]/).withMessage('Şifre en az bir küçük harf içermelidir')
    .matches(/[A-Z]/).withMessage('Şifre en az bir büyük harf içermelidir')
    .matches(/\d/).withMessage('Şifre en az bir rakam içermelidir'),
  
  check('confirmPassword')
    .trim()
    .notEmpty().withMessage('Şifre onay alanı zorunludur')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Şifreler eşleşmiyor');
      }
      return true;
    })
];

// E-posta değiştirme doğrulama kuralları
exports.updateEmailValidation = [
  check('currentEmail')
    .trim()
    .notEmpty().withMessage('Mevcut e-posta alanı zorunludur')
    .isEmail().withMessage('Geçerli bir e-posta adresi giriniz')
    .normalizeEmail(),
  
  check('newEmail')
    .trim()
    .notEmpty().withMessage('Yeni e-posta alanı zorunludur')
    .isEmail().withMessage('Geçerli bir e-posta adresi giriniz')
    .normalizeEmail()
    .custom((value, { req }) => {
      if (value === req.body.currentEmail) {
        throw new Error('Yeni e-posta mevcut e-posta ile aynı olamaz');
      }
      return true;
    }),
  
  check('password')
    .trim()
    .notEmpty().withMessage('Şifre alanı zorunludur')
];

// Şifre değiştirme doğrulama kuralları
exports.updatePasswordValidation = [
  check('currentPassword')
    .trim()
    .notEmpty().withMessage('Mevcut şifre alanı zorunludur'),
  
  check('newPassword')
    .trim()
    .notEmpty().withMessage('Yeni şifre alanı zorunludur')
    .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır')
    .matches(/[a-z]/).withMessage('Şifre en az bir küçük harf içermelidir')
    .matches(/[A-Z]/).withMessage('Şifre en az bir büyük harf içermelidir')
    .matches(/\d/).withMessage('Şifre en az bir rakam içermelidir')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('Yeni şifre mevcut şifre ile aynı olamaz');
      }
      return true;
    }),
  
  check('confirmPassword')
    .trim()
    .notEmpty().withMessage('Şifre onay alanı zorunludur')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Şifreler eşleşmiyor');
      }
      return true;
    })
];