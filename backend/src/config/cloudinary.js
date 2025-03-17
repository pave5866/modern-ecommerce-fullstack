const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Cloudinary yapılandırması
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Cloudinary yapılandırmasını kontrol et
const checkCloudinaryConfig = () => {
  // Eksik yapılandırma değerlerini kontrol et
  const missingValues = [];
  
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    missingValues.push('CLOUDINARY_CLOUD_NAME');
  }
  
  if (!process.env.CLOUDINARY_API_KEY) {
    missingValues.push('CLOUDINARY_API_KEY');
  }
  
  if (!process.env.CLOUDINARY_API_SECRET) {
    missingValues.push('CLOUDINARY_API_SECRET');
  }
  
  // Eksik değer varsa uyarı ver
  if (missingValues.length > 0) {
    logger.warn('Cloudinary yapılandırması eksik:', { 
      missingValues,
      environment: process.env.NODE_ENV 
    });
    
    // Test veya geliştirme ortamındaysak sadece uyarı, üretimde hata
    if (process.env.NODE_ENV === 'production') {
      logger.error('Üretim ortamında eksik Cloudinary yapılandırması');
    }
  } else {
    logger.info('Cloudinary yapılandırması başarılı');
  }
};

// Uygulama başladığında yapılandırmayı kontrol et
checkCloudinaryConfig();

module.exports = cloudinary;