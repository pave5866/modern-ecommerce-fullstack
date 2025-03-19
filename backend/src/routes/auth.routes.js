const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect } = require('../middlewares/auth.middleware');
const { createToken } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');
const AppError = require('../utils/appError');

// Giriş doğrulama kuralları
const loginValidationRules = [
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi girin'),
  body('password').notEmpty().withMessage('Şifre gerekli')
];

// Kayıt doğrulama kuralları
const registerValidationRules = [
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi girin'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Şifre en az 8 karakter olmalıdır')
    .matches(/[0-9]/)
    .withMessage('Şifre en az bir rakam içermelidir')
    .matches(/[A-Z]/)
    .withMessage('Şifre en az bir büyük harf içermelidir'),
  body('full_name').notEmpty().withMessage('Ad Soyad gerekli')
];

// Şifre sıfırlama doğrulama kuralları
const resetPasswordValidationRules = [
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi girin')
];

// Yeni şifre doğrulama kuralları
const newPasswordValidationRules = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Şifre en az 8 karakter olmalıdır')
    .matches(/[0-9]/)
    .withMessage('Şifre en az bir rakam içermelidir')
    .matches(/[A-Z]/)
    .withMessage('Şifre en az bir büyük harf içermelidir'),
  body('token').notEmpty().withMessage('Token gerekli')
];

// Validasyon middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
      status: 'error',
      message: 'Doğrulama hatası',
      errors: errorMessages
    });
  }
  next();
};

// Kullanıcı kaydı
router.post('/register', registerValidationRules, validate, async (req, res, next) => {
  try {
    const { email, password, full_name, phone } = req.body;
    
    // E-posta adresi zaten var mı kontrol et
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();
    
    if (!findError && existingUser) {
      return next(new AppError('Bu e-posta adresi zaten kullanılıyor', 400));
    }
    
    // Şifreyi hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Kullanıcıyı oluştur
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email,
        password: hashedPassword,
        full_name,
        phone: phone || null,
        role: 'user', // Varsayılan rol
        created_at: new Date().toISOString(),
        email_verified: false
      }])
      .select();
    
    if (error) {
      logger.error('Kullanıcı kaydı hatası:', { error: error.message, email });
      return next(new AppError('Kullanıcı oluşturulamadı: ' + error.message, 500));
    }
    
    // JWT token oluştur
    const token = createToken(newUser[0].id);
    
    logger.info('Yeni kullanıcı kaydı başarılı:', { userId: newUser[0].id, email });
    
    // Kullanıcı bilgilerini döndür (şifre hariç)
    const userWithoutPassword = { ...newUser[0] };
    delete userWithoutPassword.password;
    
    res.status(201).json({
      status: 'success',
      message: 'Kayıt başarılı',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    logger.error('Kullanıcı kaydı hatası:', { error: error.message });
    next(error);
  }
});

// Kullanıcı girişi
router.post('/login', loginValidationRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Kullanıcıyı bul
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      logger.warn('Başarısız giriş denemesi: Kullanıcı bulunamadı', { email, ip: req.ip });
      return next(new AppError('E-posta veya şifre hatalı', 401));
    }
    
    // Şifreyi kontrol et
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      logger.warn('Başarısız giriş denemesi: Yanlış şifre', { email, ip: req.ip });
      return next(new AppError('E-posta veya şifre hatalı', 401));
    }
    
    // JWT token oluştur
    const token = createToken(user.id);
    
    logger.info('Kullanıcı girişi başarılı:', { userId: user.id, email });
    
    // Son giriş tarihini güncelle
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    // Kullanıcı bilgilerini döndür (şifre hariç)
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    
    res.status(200).json({
      status: 'success',
      message: 'Giriş başarılı',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    logger.error('Kullanıcı girişi hatası:', { error: error.message });
    next(error);
  }
});

// Kullanıcı bilgilerini getir
router.get('/me', protect, async (req, res, next) => {
  try {
    // kullanıcı zaten protect middleware'de req.user'a ekleniyor
    const user = { ...req.user };
    delete user.password;
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Kullanıcı bilgileri getirme hatası:', { error: error.message, userId: req.user?.id });
    next(error);
  }
});

// Şifre sıfırlama talebi
router.post('/forgot-password', resetPasswordValidationRules, validate, async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Kullanıcıyı kontrol et
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      // Güvenlik için kullanıcıya spesifik hata verme
      return res.status(200).json({
        status: 'success',
        message: 'Şifre sıfırlama talimatları e-posta adresinize gönderilmiştir (eğer hesap mevcutsa)'
      });
    }
    
    // Sıfırlama token'ı oluştur
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Token'ı veritabanına kaydet
    const { error: tokenError } = await supabase
      .from('password_resets')
      .insert([{
        user_id: user.id,
        token: resetToken,
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 saat
        created_at: new Date().toISOString()
      }]);
    
    if (tokenError) {
      logger.error('Şifre sıfırlama token kaydetme hatası:', { error: tokenError.message, userId: user.id });
      return next(new AppError('Şifre sıfırlama talebi işlenemedi', 500));
    }
    
    // E-posta gönderme (örnek - gerçek uygulamada e-posta servisi kullanılmalı)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    logger.info('Şifre sıfırlama e-postası gönderiliyor:', { email: user.email, resetUrl });
    
    // Gerçek bir e-posta gönderme kodu burada olmalı
    // sendEmail({ to: user.email, subject: 'Şifre Sıfırlama', text: resetUrl });
    
    res.status(200).json({
      status: 'success',
      message: 'Şifre sıfırlama talimatları e-posta adresinize gönderilmiştir',
      // Geliştirme amaçlı, gerçek uygulamada kaldırılmalı
      devInfo: {
        resetUrl
      }
    });
  } catch (error) {
    logger.error('Şifre sıfırlama talebi hatası:', { error: error.message });
    next(error);
  }
});

// Şifre sıfırlama
router.post('/reset-password', newPasswordValidationRules, validate, async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    // Token'ı çöz
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      logger.warn('Geçersiz şifre sıfırlama token\'ı:', { error: err.message });
      return next(new AppError('Geçersiz veya süresi dolmuş token', 400));
    }
    
    // Token'ı veritabanında kontrol et
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .single();
    
    if (tokenError || !resetToken) {
      return next(new AppError('Geçersiz veya süresi dolmuş token', 400));
    }
    
    // Token süresini kontrol et
    if (new Date(resetToken.expires_at) < new Date()) {
      return next(new AppError('Token süresi dolmuş', 400));
    }
    
    // Kullanıcıyı getir
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();
    
    if (userError || !user) {
      return next(new AppError('Kullanıcı bulunamadı', 404));
    }
    
    // Şifreyi hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Şifreyi güncelle
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        password_changed_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (updateError) {
      logger.error('Şifre güncelleme hatası:', { error: updateError.message, userId: user.id });
      return next(new AppError('Şifre güncellenemedi', 500));
    }
    
    // Kullanılan token'ı sil
    await supabase
      .from('password_resets')
      .delete()
      .eq('token', token);
    
    logger.info('Şifre sıfırlama başarılı:', { userId: user.id });
    
    res.status(200).json({
      status: 'success',
      message: 'Şifreniz başarıyla güncellendi'
    });
  } catch (error) {
    logger.error('Şifre sıfırlama hatası:', { error: error.message });
    next(error);
  }
});

// Çıkış yap
router.post('/logout', protect, (req, res) => {
  // JWT tabanlı kimlik doğrulamada gerçek bir çıkış işlemi yoktur
  // Client tarafında token'ı silmek yeterlidir
  // Ancak yine de bir audit log tutulabilir
  
  logger.info('Kullanıcı çıkış yaptı:', { userId: req.user.id });
  
  res.status(200).json({
    status: 'success',
    message: 'Başarıyla çıkış yapıldı'
  });
});

logger.info('auth.routes.js başarıyla yüklendi');

module.exports = router;