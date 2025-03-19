const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');

// Kullanıcı kimliğini doğrulama
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Authorization başlığını kontrol et
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Bearer token formatından token değerini ayıkla
      token = req.headers.authorization.split(' ')[1];
    } 
    // Cookie'den token kontrolü
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Token yoksa erişim engelle
    if (!token) {
      logger.warn('Yetkisiz erişim denemesi: Token yok');
      return res.status(401).json({
        success: false,
        message: 'Bu kaynağa erişmek için giriş yapmanız gerekiyor'
      });
    }

    try {
      // JWT token doğrulama (custom token için)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Supabase ile kullanıcı bilgisini al
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        logger.warn(`Geçersiz kullanıcı ID: ${decoded.id}`);
        return res.status(401).json({
          success: false, 
          message: 'Bu token ile ilişkili kullanıcı bulunamadı'
        });
      }

      // User bilgisini request nesnesine ekle
      req.user = user;
      next();
    } catch (error) {
      logger.error(`Token doğrulama hatası: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token, lütfen tekrar giriş yapın'
      });
    }
  } catch (error) {
    logger.error(`Koruma middleware hatası: ${error.message}`);
    next(error);
  }
};

// Admin yetkisini kontrol etme
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Yetkilendirme yapılamadı, lütfen önce giriş yapın'
      });
    }

    // Kullanıcının rolünü kontrol et
    if (!roles.includes(req.user.role)) {
      logger.warn(`Yetkisiz erişim denemesi: ${req.user.email} (${req.user.role}) ${req.originalUrl} adresine erişmeye çalıştı`);
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi gerçekleştirmek için yetkiniz yok'
      });
    }

    next();
  };
};

// Kendi profilini güncelleme yetkisi
exports.checkOwnership = (tableName) => async (req, res, next) => {
  try {
    const resourceId = req.params.id;
    
    // Kullanıcı admin ise her şeyi yapabilir
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Supabase'den kaynağı sorgula
    const { data: resource, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', resourceId)
      .single();
    
    if (error || !resource) {
      return res.status(404).json({
        success: false,
        message: 'Kaynak bulunamadı'
      });
    }
    
    // Kaynak sahibini kontrol et (user_id alanı kullanılıyor)
    const ownerId = resource.user_id;
    
    if (ownerId && ownerId !== req.user.id) {
      logger.warn(`Yetkisiz erişim denemesi: ${req.user.email} başka birinin ${tableName} kaynağına erişmeye çalıştı`);
      return res.status(403).json({
        success: false,
        message: 'Bu kaynağı değiştirmek için yetkiniz yok'
      });
    }
    
    next();
  } catch (error) {
    logger.error(`Sahiplik kontrolü hatası: ${error.message}`);
    next(error);
  }
};