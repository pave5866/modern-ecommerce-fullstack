const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const User = require('../models/user.model');
const crypto = require('crypto');

// JWT token oluştur
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Response'da token gönder
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Cookie ayarları
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Sadece production modunda secure ayarını aktifleştir
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // Token'ı cookie olarak gönder
  res.cookie('jwt', token, cookieOptions);

  // User nesnesi için password'ü gizle
  user.password = undefined;

  // Yanıt gönder
  res.status(statusCode).json({
    success: true,
    token,
    data: { user }
  });
};

// Kullanıcı giriş koruması middleware
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1) Token kontrolü
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Bearer token formatı: "Bearer [token]"
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      // Cookie'den token
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError('Erişim için lütfen giriş yapınız', 401)
      );
    }

    // 2) Token doğrulama
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Kullanıcı hala var mı?
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('Bu token\'a ait kullanıcı artık mevcut değil', 401)
      );
    }

    // 4) Şifre değiştirilmiş mi? (İsteğe bağlı)
    if (currentUser.passwordChangedAfter(decoded.iat)) {
      return next(
        new AppError('Şifreniz yakın zamanda değiştirildi. Lütfen tekrar giriş yapın', 401)
      );
    }

    // 5) Kullanıcıyı req nesnesine ekle
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (error) {
    logger.error('Koruma middleware hatası:', error);
    next(new AppError('Kimlik doğrulama hatası', 401));
  }
};

// Rol bazlı yetkilendirme
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Roles: ['admin', 'user', 'editor']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Bu işlemi gerçekleştirmek için yetkiniz yok', 403)
      );
    }
    next();
  };
};

// Kullanıcı giriş yapmış mı kontrolü (isteğe bağlı)
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // 1) Token doğrulama
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Kullanıcı hala var mı?
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Şifre değiştirilmiş mi?
      if (currentUser.passwordChangedAfter(decoded.iat)) {
        return next();
      }

      // 4) Kullanıcıyı res.locals'a ekle
      res.locals.user = currentUser;
      return next();
    }
    next();
  } catch (error) {
    logger.error('isLoggedIn middleware hatası:', error);
    next();
  }
};

// User modelinde passwordChangedAfter metodu için varsayılan (isteğe bağlı)
// Eğer User modelinde bu metod zaten tanımlıysa silebilirsiniz
User.schema.methods.passwordChangedAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  // False = değiştirilmemiş
  return false;
};

// Token şifre değiştirme/unuttum için (isteğe bağlı)
exports.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 dakika

  return resetToken;
};