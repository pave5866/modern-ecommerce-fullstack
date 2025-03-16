const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');
const dotenv = require('dotenv');

dotenv.config();

// Cloudinary konfigürasyonu
try {
  // CLOUDINARY_URL kullanımı
  if (process.env.CLOUDINARY_URL) {
    logger.info('Cloudinary CLOUDINARY_URL ile yapılandırılıyor... ');
    
    // CLOUDINARY_URL varsa, bu otomatik olarak yapılandırır
    // Ek olarak bir şey yapmamız gerekmiyor
  } 
  // Ayrı API anahtarları kullanımı
  else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    logger.info('Cloudinary ayrı API anahtarları ile yapılandırılıyor... ');
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  } 
  // Yetersiz yapılandırma durumu
  else {
    logger.warn('Cloudinary yapılandırması eksik! Görüntü yükleme işlemleri çalışmayabilir.');
    
    // Varsayılan yapılandırma ekleyelim - Geçici çözüm
    cloudinary.config({
      cloud_name: 'dlkrduwav',
      api_key: '123456789012345',
      api_secret: 'dummy_secret_key',
      secure: true
    });
  }

  // Yapılandırmanın doğru olup olmadığını kontrol et
  logger.info('Cloudinary yapılandırması kontrol ediliyor... ');
  
  // Basit bir test yaparak Cloudinary'nin çalışıp çalışmadığını kontrol edelim
  (async () => {
    try {
      const result = await cloudinary.api.ping();
      logger.info('Cloudinary yapılandırması başarılı', { cloud_name: cloudinary.config().cloud_name });
    } catch (error) {
      logger.error('Cloudinary yapılandırma testi başarısız:', { 
        errorMessage: error.message,
        errorCode: error.http_code
      });
      
      // Hata olsa bile uygulamanın çalışmaya devam etmesini istiyoruz
      // Bu nedenle burada exception fırlatmıyoruz
    }
  })();
  
} catch (error) {
  logger.error('Cloudinary yapılandırma hatası:', { errorMessage: error.message });
  
  // Varsayılan yapılandırma ekleyelim - Geçici çözüm
  cloudinary.config({
    cloud_name: 'dlkrduwav',
    api_key: '123456789012345',
    api_secret: 'dummy_secret_key',
    secure: true
  });
}

// Fonksiyonlar
const cloudinaryUpload = {
  // Resim yükleme fonksiyonu
  upload: async (file, folder = 'default') => {
    try {
      if (!file) {
        throw new Error('Yüklenecek dosya bulunamadı');
      }
      
      const result = await cloudinary.uploader.upload(file, {
        folder: folder,
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
      });
      
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id
      };
    } catch (error) {
      logger.error(`Cloudinary yükleme hatası: ${error.message}`);
      
      // Hata durumunda varsayılan resim URL'si döndür
      return {
        success: false,
        url: 'https://res.cloudinary.com/dlkrduwav/image/upload/v1647812345/placeholder_kq1tnu.png',
        error: error.message
      };
    }
  },
  
  // Resim silme fonksiyonu
  destroy: async (publicId) => {
    try {
      if (!publicId) {
        throw new Error('Silinecek resim ID\'si bulunamadı');
      }
      
      const result = await cloudinary.uploader.destroy(publicId);
      
      return {
        success: result.result === 'ok',
        result: result.result
      };
    } catch (error) {
      logger.error(`Cloudinary silme hatası: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

module.exports = cloudinaryUpload;