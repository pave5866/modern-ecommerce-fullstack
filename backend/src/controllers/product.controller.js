const Product = require('../models/product.model');
const createError = require('http-errors');
const path = require('path');
const parser = require('datauri/parser');
const AppError = require('../utils/appError');
const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');

// Buffer'ı DataURI'ye dönüştür
const formatBuffer = (file) => {
  try {
    if (!file || !file.buffer || !file.originalname) {
      throw new Error('Geçersiz dosya formatı');
    }
    logger.debug('Buffer dönüştürme başladı:', {
      fileName: file.originalname,
      size: file.size,
      mimeType: file.mimetype
    });
    const extName = path.extname(file.originalname).toString();
    const datauri = new parser();
    const result = datauri.format(extName, file.buffer).content;
    logger.debug('Buffer dönüştürme başarılı');
    return result;
  } catch (error) {
    logger.error('Buffer dönüştürme hatası:', error);
    throw new AppError('Dosya formatı dönüştürme hatası: ' + error.message, 500);
  }
};

// Buffer'ı base64'e dönüştürme yardımcı fonksiyonu
const bufferToBase64 = (buffer, mimetype) => {
  try {
    logger.debug('Buffer dönüştürme başladı:', {
      bufferLength: buffer.length,
      mimetype
    });
    
    // Buffer'ı base64'e dönüştür
    const base64 = buffer.toString('base64');
    const dataURI = `data:${mimetype};base64,${base64}`;
    
    logger.debug('Buffer dönüştürme başarılı');
    return dataURI;
  } catch (error) {
    logger.error('Buffer dönüştürme hatası:', { error: error.message });
    throw error;
  }
};

// Tüm ürünleri getir
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// Tek ürün getir
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw createError(404, 'Ürün bulunamadı');
    }
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// Ürün oluştur - Düzeltilmiş
exports.createProduct = async (req, res, next) => {
  try {
    // Ürün verilerini hazırla
    const productData = {
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      price: parseFloat(req.body.price),
      category: req.body.category.trim(),
      stock: parseInt(req.body.stock),
      images: []
    };

    // Cloudinary yapılandırma kontrolü
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      logger.error('Cloudinary yapılandırma bilgileri eksik!');
      throw new AppError('Resim yükleme servisi yapılandırması eksik', 500);
    }

    // Resimleri Cloudinary'ye yükle
    if (req.files && req.files.length > 0) {
      logger.info('Resim yükleme başladı:', { fileCount: req.files.length });
      
      try {
        const uploadPromises = req.files.map(async (file) => {
          // Base64 formatına dönüştür
          const dataURI = bufferToBase64(file.buffer, file.mimetype);
          
          // Cloudinary'ye yükle - timestamp ve imza sorunlarını önlemek için api_key ve api_secret direkt kullanmıyoruz
          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'products'
          });
          
          logger.info('Resim yüklendi:', { url: result.secure_url });
          return result.secure_url;
        });
        
        productData.images = await Promise.all(uploadPromises);
        logger.info('Tüm resimler yüklendi:', { imageCount: productData.images.length });
      } catch (error) {
        logger.error('Ürün oluşturma hatası:', { error: error.message });
        throw new AppError(`Resim yükleme hatası: ${error.message}`, 500);
      }
    }

    // Ürünü veritabanına kaydet
    const product = await Product.create(productData);
    logger.info('Ürün başarıyla oluşturuldu:', { productId: product._id });

    // Başarılı yanıt döndür
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Ürün oluşturma hatası:', { error: error.message });
    next(error);
  }
};

// Ürün güncelle
exports.updateProduct = async (req, res, next) => {
  try {
    logger.info('Ürün güncelleme başladı:', { productId: req.params.id });
    
    // Önce ürünü bul
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      throw createError(404, 'Ürün bulunamadı');
    }
    
    // Güncelleme verilerini hazırla
    const updateData = {
      name: req.body.name ? req.body.name.trim() : existingProduct.name,
      description: req.body.description ? req.body.description.trim() : existingProduct.description,
      price: req.body.price ? parseFloat(req.body.price) : existingProduct.price,
      category: req.body.category ? req.body.category.trim() : existingProduct.category,
      stock: req.body.stock ? parseInt(req.body.stock) : existingProduct.stock
    };
    
    // Mevcut resimler varsa işle
    let imagesToKeep = [];
    if (req.body.existingImages) {
      try {
        imagesToKeep = JSON.parse(req.body.existingImages);
        logger.info('Korunacak mevcut resimler:', { count: imagesToKeep.length });
      } catch (error) {
        logger.error('Mevcut resimleri ayrıştırma hatası:', { error: error.message });
        imagesToKeep = [];
      }
    }
    
    // Yeni yüklenen resimleri işle
    if (req.files && req.files.length > 0) {
      logger.info('Yeni resim yükleme başladı:', { fileCount: req.files.length });
      
      const uploadPromises = req.files.map(async (file) => {
        const dataURI = bufferToBase64(file.buffer, file.mimetype);
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'products'
        });
        
        logger.info('Yeni resim yüklendi:', { url: result.secure_url });
        return result.secure_url;
      });
      
      const newImages = await Promise.all(uploadPromises);
      logger.info('Tüm yeni resimler yüklendi:', { imageCount: newImages.length });
      
      // Mevcut ve yeni resimleri birleştir
      updateData.images = [...imagesToKeep, ...newImages];
    } else {
      // Sadece mevcut resimler
      updateData.images = imagesToKeep;
    }
    
    logger.info('Ürün güncelleniyor:', { 
      productId: req.params.id,
      imageCount: updateData.images.length
    });
    
    // Ürünü güncelle
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    logger.error('Ürün güncelleme hatası:', { error: error.message });
    next(error);
  }
};

// Ürün sil
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      throw createError(404, 'Ürün bulunamadı');
    }
    res.status(200).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Kategorileri getir
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// Ürün ara
exports.searchProducts = async (req, res, next) => {
  try {
    const { query } = req.query;
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// Kategoriye göre ürünleri getir
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category });
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};