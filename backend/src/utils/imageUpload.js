const logger = require('./logger');
const cloudinary = require('../config/cloudinary');

/**
 * Resim yükleme yardımcı fonksiyonu
 * @param {string} fileDataUrl - base64 formatında resim verisi
 * @returns {Promise<string>} - Yüklenen resmin URL'i
 */
const uploadImage = async (fileDataUrl) => {
  try {
    logger.debug('Resim yükleme isteği başladı');
    
    // En basit konfigürasyonla yükleme yapılıyor
    // Hiçbir ek parametre olmadan, timestamp ve diğer opsiyonları Cloudinary kendisi oluşturacak
    const uploadResult = await cloudinary.uploader.upload(fileDataUrl);
    
    logger.debug('Resim yükleme başarılı', { 
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url
    });
    
    return uploadResult.secure_url;
  } catch (error) {
    logger.error('Resim yükleme hatası:', { 
      error: error.message, 
      errorName: error.name 
    });
    throw new Error(`Cloudinary resim yükleme hatası: ${error.message}`);
  }
};

module.exports = {
  uploadImage
};