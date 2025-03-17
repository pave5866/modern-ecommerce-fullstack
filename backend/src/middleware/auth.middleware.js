const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../utils/logger');

// Kimlik doğrulama middleware
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Token'ı header veya cookie'den al
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Token yoksa yetkisiz erişim
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Bu kaynağa erişim için yetkiniz yok'
      });
    }
    
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gizli-anahtar');
    
    // Kullanıcıyı bul
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcı aktif değilse
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Hesabınız askıya alınmış'
      });
    }
    
    // Kullanıcıyı req nesnesine ekle
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Auth middleware hatası: ${error.message}`, { error });
    return res.status(401).json({
      success: false,
      message: 'Yetkilendirme hatası',
      error: error.message
    });
  }
};

// Admin yetkisi kontrolü
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için yönetici yetkisine sahip olmanız gerekiyor'
    });
  }
};

// Satıcı yetkisi kontrolü
exports.seller = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'seller')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için satıcı yetkisine sahip olmanız gerekiyor'
    });
  }
};