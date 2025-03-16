const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Cloudinary yapılandırması - URL formatında
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Yapılandırma kontrolü
try {
  logger.info('Cloudinary yapılandırması kontrol ediliyor...');
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    logger.error('Cloudinary yapılandırma bilgileri eksik!', {
      cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
      api_key: !!process.env.CLOUDINARY_API_KEY,
      api_secret: !!process.env.CLOUDINARY_API_SECRET
    });
  } else {
    logger.info('Cloudinary yapılandırması başarılı', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME
    });
  }
} catch (error) {
  logger.error('Cloudinary yapılandırma hatası:', error.message);
}

module.exports = cloudinary;