const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Yeni yaklaşım: Öncelikle CLOUDINARY_URL değişkenini kullan (daha güvenilir)
if (process.env.CLOUDINARY_URL) {
  // Cloudinary otomatik olarak CLOUDINARY_URL'den yapılandırmayı alacak
  logger.info('Cloudinary CLOUDINARY_URL ile yapılandırılıyor...');
} else {
  // Yedek olarak bireysel değişkenleri kullan
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  logger.info('Cloudinary bireysel değişkenlerle yapılandırılıyor...');
}

// Yapılandırma kontrolü
try {
  logger.info('Cloudinary yapılandırması kontrol ediliyor...');
  
  // Cloudinary test çağrısı yapalım
  cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error) => {
    if (error) {
      logger.error('Cloudinary yapılandırma testi başarısız:', { errorMessage: error.message });
    } else {
      logger.info('Cloudinary yapılandırma testi başarılı');
    }
  });
  
  logger.info('Cloudinary yapılandırması başarılı', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'CLOUDINARY_URL üzerinden ayarlandı'
  });
} catch (error) {
  logger.error('Cloudinary yapılandırma hatası:', error.message);
}

module.exports = cloudinary;