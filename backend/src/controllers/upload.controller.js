const cloudinary = require('../config/cloudinary');
const DatauriParser = require('datauri/parser');
const path = require('path');
const parser = new DatauriParser();
const logger = require('../utils/logger');
const axios = require('axios');
const AppError = require('../utils/appError');
const { isValidBase64 } = require('../utils/validators');

/**
 * Dosyadan DataURI formatına dönüştürme
 * @param {Buffer} file - Resim dosyası buffer'ı
 * @param {string} originalname - Orijinal dosya adı
 * @returns {string} - DataURI formatında resim
 */
const formatBufferToDataURI = (file, originalname) => {
  return parser.format(path.extname(originalname).toString(), file);
};

/**
 * Tekli resim yükleme
 * @param {Express.Request} req - Request nesnesi
 * @param {Express.Response} res - Response nesnesi
 * @param {Function} next - Next fonksiyonu
 */
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Lütfen bir resim yükleyin', 400));
    }

    // Dosyayı DataURI formatına dönüştür
    const fileDataURI = formatBufferToDataURI(req.file.buffer, req.file.originalname);
    
    // Cloudinary'ye yükle
    const result = await cloudinary.uploader.upload(fileDataURI.content, {
      folder: 'modern-ecommerce',
      use_filename: true,
      unique_filename: true
    });

    // Başarılı yanıt
    res.status(200).json({
      success: true,
      message: 'Resim başarıyla yüklendi',
      image: {
        public_id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type
      }
    });
  } catch (error) {
    logger.error('Resim yükleme hatası:', error);
    return next(new AppError('Resim yüklenirken bir hata oluştu: ' + error.message, 500));
  }
};

/**
 * Çoklu resim yükleme
 * @param {Express.Request} req - Request nesnesi
 * @param {Express.Response} res - Response nesnesi
 * @param {Function} next - Next fonksiyonu
 */
exports.uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('Lütfen en az bir resim yükleyin', 400));
    }

    // Tüm dosyaları işle
    const uploadPromises = req.files.map(async (file) => {
      const fileDataURI = formatBufferToDataURI(file.buffer, file.originalname);
      
      const result = await cloudinary.uploader.upload(fileDataURI.content, {
        folder: 'modern-ecommerce',
        use_filename: true,
        unique_filename: true
      });

      return {
        public_id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type
      };
    });

    // Tüm yükleme işlemlerini bekle
    const uploadedImages = await Promise.all(uploadPromises);

    // Başarılı yanıt
    res.status(200).json({
      success: true,
      message: `${uploadedImages.length} resim başarıyla yüklendi`,
      images: uploadedImages
    });
  } catch (error) {
    logger.error('Çoklu resim yükleme hatası:', error);
    return next(new AppError('Resimler yüklenirken bir hata oluştu: ' + error.message, 500));
  }
};

/**
 * Base64 formatında resim yükleme
 * @param {Express.Request} req - Request nesnesi
 * @param {Express.Response} res - Response nesnesi
 * @param {Function} next - Next fonksiyonu
 */
exports.uploadBase64Image = async (req, res, next) => {
  try {
    const { image } = req.body;

    if (!image) {
      return next(new AppError('Base64 formatında resim verisi gereklidir', 400));
    }

    // Base64 formatı doğrulama
    if (!isValidBase64(image)) {
      return next(new AppError('Geçersiz Base64 formatı', 400));
    }

    // Cloudinary'ye yükle
    const result = await cloudinary.uploader.upload(image, {
      folder: 'modern-ecommerce',
      unique_filename: true
    });

    // Başarılı yanıt
    res.status(200).json({
      success: true,
      message: 'Base64 resim başarıyla yüklendi',
      image: {
        public_id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type
      }
    });
  } catch (error) {
    logger.error('Base64 resim yükleme hatası:', error);
    return next(new AppError('Base64 resim yüklenirken bir hata oluştu: ' + error.message, 500));
  }
};

/**
 * URL'den resim yükleme
 * @param {Express.Request} req - Request nesnesi
 * @param {Express.Response} res - Response nesnesi
 * @param {Function} next - Next fonksiyonu
 */
exports.uploadImageFromUrl = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return next(new AppError('Resim URL\'si gereklidir', 400));
    }

    // URL'nin geçerli bir resim uzantısı içerip içermediğini kontrol et
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasValidExtension = validExtensions.some(ext => url.toLowerCase().includes(ext));
    
    if (!hasValidExtension) {
      // URL uzantısı geçerli değilse hata döndür
      return next(new AppError('Geçersiz resim URL\'si. Desteklenen formatlar: JPG, JPEG, PNG, WEBP, GIF', 400));
    }

    // Cloudinary'ye yükle
    const result = await cloudinary.uploader.upload(url, {
      folder: 'modern-ecommerce',
      unique_filename: true
    });

    // Başarılı yanıt
    res.status(200).json({
      success: true,
      message: 'URL\'den resim başarıyla yüklendi',
      image: {
        public_id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type
      }
    });
  } catch (error) {
    logger.error('URL\'den resim yükleme hatası:', error);
    return next(new AppError('URL\'den resim yüklenirken bir hata oluştu: ' + error.message, 500));
  }
};

/**
 * Cloudinary'den resim silme
 * @param {Express.Request} req - Request nesnesi
 * @param {Express.Response} res - Response nesnesi
 * @param {Function} next - Next fonksiyonu
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return next(new AppError('Resim ID\'si gereklidir', 400));
    }

    // Cloudinary'den sil
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return next(new AppError('Resim silinirken bir hata oluştu', 500));
    }

    // Başarılı yanıt
    res.status(200).json({
      success: true,
      message: 'Resim başarıyla silindi',
      result
    });
  } catch (error) {
    logger.error('Resim silme hatası:', error);
    return next(new AppError('Resim silinirken bir hata oluştu: ' + error.message, 500));
  }
};