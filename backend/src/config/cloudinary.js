const cloudinary = require('cloudinary').v2;
const DatauriParser = require('datauri/parser');
const path = require('path');
const logger = require('../utils/logger');

// Cloudinary yapılandırması
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Cloudinary yükleme fonksiyonu
const uploadToCloudinary = async (file) => {
  try {
    if (!file) {
      logger.error('Yüklenecek dosya bulunamadı');
      return { success: false, message: 'Yüklenecek dosya bulunamadı' };
    }

    // Dosya içeriğini dataURI formatına dönüştür
    const parser = new DatauriParser();
    const dataUri = parser.format(path.extname(file.originalname), file.buffer);

    // Cloudinary'ye yükle
    const result = await cloudinary.uploader.upload(dataUri.content, {
      folder: 'e-commerce/products',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    });

    logger.info(`Dosya başarıyla yüklendi: ${result.public_id}`);
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    logger.error(`Cloudinary yükleme hatası: ${error.message}`);
    return { success: false, message: error.message };
  }
};

// Cloudinary'den dosya silme
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      logger.error('Silinecek dosya ID\'si bulunamadı');
      return { success: false, message: 'Silinecek dosya ID\'si bulunamadı' };
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      logger.info(`Dosya başarıyla silindi: ${publicId}`);
      return { success: true, message: 'Dosya başarıyla silindi' };
    } else {
      logger.warn(`Dosya silinirken uyarı: ${result.result}`);
      return { success: false, message: result.result };
    }
  } catch (error) {
    logger.error(`Cloudinary silme hatası: ${error.message}`);
    return { success: false, message: error.message };
  }
};

// Çoklu dosya yükleme
const uploadMultipleToCloudinary = async (files) => {
  try {
    if (!files || files.length === 0) {
      logger.error('Yüklenecek dosyalar bulunamadı');
      return { success: false, message: 'Yüklenecek dosyalar bulunamadı' };
    }

    const uploadPromises = files.map(file => uploadToCloudinary(file));
    const results = await Promise.all(uploadPromises);
    
    logger.info(`${results.length} dosya başarıyla yüklendi`);
    return { 
      success: true, 
      results 
    };
  } catch (error) {
    logger.error(`Çoklu dosya yükleme hatası: ${error.message}`);
    return { success: false, message: error.message };
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadMultipleToCloudinary,
  cloudinary // Doğrudan erişim için
}; 