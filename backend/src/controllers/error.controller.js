/**
 * Global hata yakalama ve işleme kontrolörü
 */
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

// Geliştirme ortamında hata yanıtı
const sendErrorDev = (err, res) => {
  logger.error({
    statusCode: err.statusCode,
    status: err.status,
    message: err.message,
    stack: err.stack
  }, 'DEV ERROR');

  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Üretim ortamında hata yanıtı
const sendErrorProd = (err, res) => {
  // Operasyonel, güvenilir hata: Client'a mesaj gönder
  if (err.isOperational) {
    logger.warn({
      statusCode: err.statusCode,
      message: err.message
    }, 'OPERATIONAL ERROR');

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  // Bilinmeyen hata: Detayları sızdırma
  else {
    // Log hataları
    logger.error({
      err: err,
      message: err.message,
      stack: err.stack
    }, 'UNKNOWN ERROR');

    // Genel hata mesajı gönder
    res.status(500).json({
      status: 'error',
      message: 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    });
  }
};

// Veritabanı hataları için handlers
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Geçersiz veri girişi. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleCastErrorDB = err => {
  const message = `Geçersiz ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `${value} değeri zaten kullanılıyor. Lütfen başka bir değer deneyin.`;
  return new AppError(message, 400);
};

// JWT hataları için handlers
const handleJWTError = () => new AppError('Geçersiz token. Lütfen tekrar giriş yapın.', 401);
const handleJWTExpiredError = () => new AppError('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.', 401);

// Ana hata işleme middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Ortama göre hata yanıtı
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // MongoDB Error Handlers
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    
    // JWT Error Handlers
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
}; 