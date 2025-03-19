const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

// JWT tokenı doğrula ve kullanıcıya eriş
exports.protect = async (req, res, next) => {
  try {
    // 1) Token var mı kontrol et
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      logger.warn('Oturum açılmamış: Token bulunamadı', { ip: req.ip, path: req.originalUrl });
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için lütfen giriş yapın'
      });
    }

    // 2) Token doğrulama
    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    } catch (err) {
      logger.warn('Geçersiz token', { error: err.message, ip: req.ip, path: req.originalUrl });
      return res.status(401).json({
        status: 'error',
        message: 'Geçersiz token. Lütfen tekrar giriş yapın'
      });
    }

    // 3) Kullanıcı hala var mı kontrol et
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      logger.warn('Token geçerli ancak kullanıcı bulunamadı', { userId: decoded.id, ip: req.ip });
      return res.status(401).json({
        status: 'error',
        message: 'Bu tokena sahip kullanıcı artık mevcut değil'
      });
    }

    // 4) Kullanıcı şifresini değiştirmişse token geçerli mi kontrol et
    if (user.password_changed_at) {
      const passwordChangedTimestamp = parseInt(
        new Date(user.password_changed_at).getTime() / 1000,
        10
      );

      if (decoded.iat < passwordChangedTimestamp) {
        logger.warn('Şifre değişikliğinden sonra eski token kullanımı', { userId: user.id, ip: req.ip });
        return res.status(401).json({
          status: 'error',
          message: 'Kullanıcı yakın zamanda şifresini değiştirdi. Lütfen tekrar giriş yapın'
        });
      }
    }

    // Kullanıcıyı request nesnesine ekle
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware hatası:', { error: error.message });
    next(error);
  }
};

// Sadece belirli rollere izin ver
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // protect middleware'i önce çalıştığı için req.user vardır
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn('Yetkisiz erişim girişimi', { 
        userId: req.user ? req.user.id : 'Bilinmiyor', 
        userRole: req.user ? req.user.role : 'Bilinmiyor',
        requiredRoles: roles.join(','),
        ip: req.ip,
        path: req.originalUrl
      });
      
      return res.status(403).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için yetkiniz yok'
      });
    }
    next();
  };
};

// İsteğe bağlı kullanıcı bilgilerini kontrol et
exports.isLoggedIn = async (req, res, next) => {
  try {
    // 1) Token var mı kontrol et
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(); // Token yoksa devam et, kullanıcı giriş yapmamış
    }

    // 2) Token doğrulama
    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(); // Geçersiz token, devam et
    }

    // 3) Kullanıcı hala var mı kontrol et
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return next(); // Kullanıcı bulunamadı, devam et
    }

    // 4) Kullanıcı şifresini değiştirmişse token geçerli mi kontrol et
    if (user.password_changed_at) {
      const passwordChangedTimestamp = parseInt(
        new Date(user.password_changed_at).getTime() / 1000,
        10
      );

      if (decoded.iat < passwordChangedTimestamp) {
        return next(); // Şifre değişmiş, devam et
      }
    }

    // Kullanıcıyı request nesnesine ekle
    req.user = user;
    next();
  } catch (error) {
    logger.error('isLoggedIn middleware hatası:', { error: error.message });
    next();
  }
};

// JWT token oluştur
exports.createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};