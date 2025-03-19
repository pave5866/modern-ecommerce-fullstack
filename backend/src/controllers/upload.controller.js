const { supabase } = require('../config/supabase');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const path = require('path');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

// Rastgele dosya adı oluştur
const generateFileName = (originalName) => {
  const extension = path.extname(originalName).toString();
  return `${uuidv4()}${extension}`;
};

// Tek dosya yükleme
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Lütfen bir resim dosyası seçin', 400));
    }

    logger.info('Resim yükleme başladı:', { 
      fileName: req.file.originalname, 
      size: req.file.size, 
      mimetype: req.file.mimetype 
    });

    // Rastgele dosya adı oluştur
    const fileName = generateFileName(req.file.originalname);
    const filePath = `products/${fileName}`;
    
    // Supabase Storage'a yükle
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600'
      });
    
    if (error) {
      logger.error('Resim yükleme hatası:', { error: error.message });
      return next(new AppError('Resim yükleme hatası: ' + error.message, 500));
    }
    
    // Public URL oluştur
    const { data: publicData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);
    
    logger.info('Resim yükleme başarılı:', {
      path: filePath,
      url: publicData.publicUrl
    });

    res.status(201).json({
      success: true,
      data: {
        publicId: filePath,
        url: publicData.publicUrl,
        path: filePath,
        fileName
      }
    });
  } catch (error) {
    logger.error('Resim yükleme hatası:', { error: error.message });
    next(error);
  }
};

// Çoklu dosya yükleme
exports.uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('Lütfen en az bir resim dosyası seçin', 400));
    }

    logger.info('Çoklu resim yükleme başladı:', { fileCount: req.files.length });

    // Tüm resimleri yükleme
    const uploadPromises = req.files.map(async (file) => {
      try {
        const fileName = generateFileName(file.originalname);
        const filePath = `products/${fileName}`;
        
        // Supabase Storage'a yükle
        const { data, error } = await supabase.storage
          .from('products')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600'
          });
        
        if (error) {
          throw new Error(error.message);
        }
        
        // Public URL oluştur
        const { data: publicData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
        
        return {
          publicId: filePath,
          url: publicData.publicUrl,
          path: filePath,
          fileName
        };
      } catch (uploadError) {
        logger.error('Tekil resim yükleme hatası:', { error: uploadError.message });
        throw uploadError;
      }
    });

    // Tüm promise'ları çalıştır
    const results = await Promise.all(uploadPromises);

    logger.info('Çoklu resim yükleme başarılı:', { 
      count: results.length,
      urls: results.map(r => r.url)
    });

    res.status(201).json({
      success: true,
      data: {
        count: results.length,
        images: results,
        urls: results.map(r => r.url)
      }
    });
  } catch (error) {
    logger.error('Çoklu resim yükleme genel hatası:', { error: error.message });
    next(error);
  }
};

// Base64 resim yükleme
exports.uploadBase64Image = async (req, res, next) => {
  try {
    const { image, name } = req.body;
    
    if (!image) {
      return next(new AppError('Base64 formatında resim gönderilmedi', 400));
    }
    
    // Base64 formatını kontrol et
    if (!image.startsWith('data:image')) {
      return next(new AppError('Geçersiz base64 formatı. data:image ile başlamalı', 400));
    }

    logger.info('Base64 resim yükleme başladı');
    
    // Base64'ü blob'a çevir
    const base64Data = image.split(';base64,').pop();
    const fileBuffer = Buffer.from(base64Data, 'base64');
    
    // MIME tipi al
    const mimeType = image.split(';')[0].split(':')[1];
    const extension = mimeType.split('/')[1];
    
    // Dosya adı oluştur
    const fileName = name ? `${name}.${extension}` : `${uuidv4()}.${extension}`;
    const filePath = `products/${fileName}`;
    
    // Supabase Storage'a yükle
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600'
      });
    
    if (error) {
      logger.error('Base64 resim yükleme hatası:', { error: error.message });
      return next(new AppError('Resim yükleme hatası: ' + error.message, 500));
    }
    
    // Public URL oluştur
    const { data: publicData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    logger.info('Base64 resim yükleme başarılı:', {
      path: filePath,
      url: publicData.publicUrl
    });

    res.status(201).json({
      success: true,
      data: {
        publicId: filePath,
        url: publicData.publicUrl,
        path: filePath,
        fileName
      }
    });
  } catch (error) {
    logger.error('Base64 resim yükleme hatası:', { error: error.message });
    next(error);
  }
};

// URL'den resim yükleme
exports.uploadImageFromUrl = async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return next(new AppError('Resim URL\'i gönderilmedi', 400));
    }

    logger.info('URL\'den resim yükleme başladı:', { url });
    
    // URL geçerliliğini kontrol et
    try {
      const response = await fetch(url, { method: 'HEAD' });
      
      if (!response.ok) {
        return next(new AppError('Geçersiz resim URL\'i. Erişilemiyor.', 400));
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        return next(new AppError('URL bir resme ait değil', 400));
      }
      
      // Resim verilerini al
      const imageResponse = await fetch(url);
      const imageBuffer = await imageResponse.buffer();
      
      // Dosya adı oluştur
      const extension = contentType.split('/')[1];
      const fileName = `url_${uuidv4()}.${extension}`;
      const filePath = `products/${fileName}`;
      
      // Supabase Storage'a yükle
      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, imageBuffer, {
          contentType: contentType,
          cacheControl: '3600'
        });
      
      if (error) {
        logger.error('URL\'den resim yükleme hatası:', { error: error.message });
        return next(new AppError('Resim yükleme hatası: ' + error.message, 500));
      }
      
      // Public URL oluştur
      const { data: publicData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
  
      logger.info('URL\'den resim yükleme başarılı:', {
        path: filePath,
        url: publicData.publicUrl
      });
  
      res.status(201).json({
        success: true,
        data: {
          publicId: filePath,
          url: publicData.publicUrl,
          path: filePath,
          fileName
        }
      });
    } catch (fetchError) {
      logger.error('URL doğrulama hatası:', { error: fetchError.message });
      return next(new AppError('URL erişim hatası: ' + fetchError.message, 400));
    }
  } catch (error) {
    logger.error('URL\'den resim yükleme hatası:', { error: error.message });
    next(error);
  }
};

// Resim silme
exports.deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return next(new AppError('Silmek için dosya yolu gerekli', 400));
    }

    logger.info('Resim silme işlemi başladı:', { publicId });
    
    // Path formatını düzelt
    let filePath = publicId;
    
    // Eğer "products/" içermiyorsa ve "/" içermiyorsa, ön ek ekle
    if (!filePath.includes('/')) {
      filePath = `products/${filePath}`;
    }
    
    // Supabase Storage'dan sil
    const { data, error } = await supabase.storage
      .from('products')
      .remove([filePath]);
    
    if (error) {
      logger.error('Resim silme hatası:', { error: error.message, publicId });
      return next(new AppError('Resim silme hatası: ' + error.message, 500));
    }

    logger.info('Resim silme başarılı:', { publicId });

    res.status(200).json({
      success: true,
      message: 'Resim başarıyla silindi',
      data: { publicId }
    });
  } catch (error) {
    logger.error('Resim silme hatası:', { error: error.message, publicId: req.params.publicId });
    next(error);
  }
};