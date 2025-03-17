const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/upload.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');

/**
 * Multer yapılandırması - Hafıza tabanlı depolama kullanarak
 * resimleri doğrudan buffer olarak saklıyoruz
 */
const storage = multer.memoryStorage();

/**
 * Dosya filtresi - Sadece belirli resim formatlarına izin ver
 */
const fileFilter = (req, file, cb) => {
  // Kabul edilen MIME tipleri
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya formatı. Sadece JPEG, PNG, WEBP ve GIF formatları kabul edilir.'), false);
  }
};

/**
 * Multer yükleme işleyicisi - 5MB boyut sınırı ile
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * Tek resim yükleme için middleware
 */
const uploadSingleImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          logger.warn('Dosya boyutu sınırı aşıldı');
          return res.status(400).json({
            success: false,
            message: 'Dosya boyutu 5MB sınırını aşıyor.'
          });
        }
      }
      
      logger.error('Resim yükleme hatası:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Yükleme başarılı
    next();
  });
};

/**
 * Çoklu resim yükleme için middleware
 */
const uploadMultipleImages = (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          logger.warn('Dosya boyutu sınırı aşıldı');
          return res.status(400).json({
            success: false,
            message: 'Bir veya daha fazla dosya 5MB sınırını aşıyor.'
          });
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          logger.warn('Dosya sayısı sınırı aşıldı');
          return res.status(400).json({
            success: false,
            message: 'En fazla 10 resim yükleyebilirsiniz.'
          });
        }
      }
      
      logger.error('Çoklu resim yükleme hatası:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Yükleme başarılı
    next();
  });
};

// Tekli resim yükleme route'u - Giriş yapmış kullanıcılar için
router.post('/image', protect, uploadSingleImage, uploadController.uploadImage);

// Çoklu resim yükleme route'u - Giriş yapmış kullanıcılar için
router.post('/images', protect, uploadMultipleImages, uploadController.uploadMultipleImages);

// Base64 formatında resim yükleme - Giriş yapmış kullanıcılar için
router.post('/base64', protect, uploadController.uploadBase64Image);

// URL'den resim yükleme - Giriş yapmış kullanıcılar için
router.post('/url', protect, uploadController.uploadImageFromUrl);

// Resim silme route'u - Sadece admin veya resmin sahibi silebilir
router.delete('/image/:publicId', protect, uploadController.deleteImage);

module.exports = router;