const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { User } = require('../models/user.model');

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
      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Kullanıcıyı bul
      const user = await User.findById(decoded.id).select('-password');

      // Kullanıcı yoksa (silinmiş olabilir) hata döndür
      if (!user) {
        logger.warn(`Geçersiz kullanıcı ID: ${decoded.id}`);
        return res.status(401).json({
          success: false,
          message: 'Bu token ile ilişkili kullanıcı bulunamadı'
        });
      }

      // MongoDB bağlantısı yoksa ve Supabase fallback kullanılıyorsa
      // Burada alternatif bir doğrulama da yapılabilir

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
exports.checkOwnership = (modelName) => async (req, res, next) => {
  try {
    const Model = require(`../models/${modelName}.model`);
    const resourceId = req.params.id;
    
    // Kullanıcı admin ise her şeyi yapabilir
    if (req.user.role === 'admin') {
      return next();
    }
    
    const resource = await Model.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Kaynak bulunamadı'
      });
    }
    
    // Kaynak sahibini kontrol et (userId veya user alanı olabilir)
    const ownerId = resource.userId || resource.user;
    
    if (ownerId && ownerId.toString() !== req.user._id.toString()) {
      logger.warn(`Yetkisiz erişim denemesi: ${req.user.email} başka birinin ${modelName} kaynağına erişmeye çalıştı`);
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