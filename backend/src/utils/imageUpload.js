const logger = require('./logger');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Resim yükleme yardımcı fonksiyonu - Stream kullanarak
 * @param {Buffer} fileBuffer - Resim buffer'ı
 * @returns {Promise<string>} - Yüklenen resmin URL'i
 */
const uploadImageBuffer = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    // Stream oluştur
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          logger.error('Resim yükleme hatası (stream):', { 
            errorMessage: error.message,
            errorName: error.name
          });
          reject(new Error(`Resim yükleme hatası: ${error.message}`));
          return;
        }
        
        logger.info('Resim yükleme başarılı (stream):', { 
          publicId: result.public_id,
          url: result.secure_url
        });
        
        resolve(result.secure_url);
      }
    );
    
    // Buffer'ı stream'e aktar
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Resim yükleme yardımcı fonksiyonu - Base64 kullanarak
 * @param {string} fileDataUrl - base64 formatında resim verisi
 * @returns {Promise<string>} - Yüklenen resmin URL'i
 */
const uploadImage = async (fileDataUrl) => {
  try {
    logger.debug('Resim yükleme isteği başladı');
    
    // En basit konfigürasyonla yükleme yapılıyor - hiçbir ekstra parametre belirtmeden
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
  uploadImage,
  uploadImageBuffer
};