const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');
const multer = require('multer');
const uploadController = require('../controllers/upload.controller');

// Multer ayarları - bellekte geçici depolama
const storage = multer.memoryStorage();

// Dosya tipi filtreleme
const fileFilter = (req, file, cb) => {
  // Kabul edilen MIME tipleri
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Yalnızca jpg, png, gif, webp ve svg formatındaki resimler kabul edilir.'), false);
  }
};

// Multer yükleme yapılandırması
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maksimum dosya boyutu
    files: 5 // Tek seferde en fazla 5 dosya
  }
});

// Hata yakalama middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'Dosya yükleme hatası';
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Dosya boyutu çok büyük. Maksimum 5MB kabul edilir.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Çok fazla dosya. Tek seferde en fazla 5 dosya yükleyebilirsiniz.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Beklenmeyen dosya alanı.';
    }
    
    logger.error('Multer hatası:', { error: err.message, code: err.code });
    
    return res.status(400).json({
      status: 'error',
      message
    });
  }
  
  if (err.message === 'Yalnızca jpg, png, gif, webp ve svg formatındaki resimler kabul edilir.') {
    logger.error('Dosya format hatası:', { error: err.message });
    
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
  
  next(err);
};

// Rotalar
router.use(handleMulterError);

// Tek dosya yükleme
router.post(
  '/image',
  protect,
  restrictTo('admin', 'manager'), // Sadece admin ve yöneticiler yükleyebilir
  upload.single('image'),
  uploadController.uploadImage
);

// Çoklu dosya yükleme
router.post(
  '/images',
  protect,
  restrictTo('admin', 'manager'),
  upload.array('images', 5), // 'images' alanından en fazla 5 dosya
  uploadController.uploadMultipleImages
);

// Base64 resim yükleme
router.post(
  '/base64',
  protect,
  restrictTo('admin', 'manager'),
  uploadController.uploadBase64Image
);

// URL'den resim yükleme
router.post(
  '/url',
  protect,
  restrictTo('admin', 'manager'),
  uploadController.uploadImageFromUrl
);

// Resim silme
router.delete(
  '/:publicId',
  protect,
  restrictTo('admin', 'manager'),
  uploadController.deleteImage
);

logger.info('upload.routes.js başarıyla yüklendi');

module.exports = router;