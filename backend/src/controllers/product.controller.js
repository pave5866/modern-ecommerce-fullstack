const Product = require('../models/product.model');
const createError = require('http-errors');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { uploadImageBuffer } = require('../utils/imageUpload');

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

// Ürün oluştur - Buffer -> Base64 ile yükleme
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

    // Resimleri yükle
    if (req.files && req.files.length > 0) {
      logger.info('Resim yükleme başladı:', { fileCount: req.files.length });
      
      try {
        // Her dosya için ayrı yükleme işlemi gerçekleştir
        for (const file of req.files) {
          // Buffer'ı doğrudan Cloudinary'ye yükle
          const imageUrl = await uploadImageBuffer(file.buffer, file.mimetype);
          
          // Başarılı yüklenen resmi listeye ekle
          productData.images.push(imageUrl);
        }
        
        logger.info('Tüm resimler yüklendi:', { imageCount: productData.images.length });
      } catch (error) {
        logger.error('Resim yükleme hatası:', { error: error.message });
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
      
      // Her dosyayı tek tek işle
      for (const file of req.files) {
        try {
          // Buffer'ı doğrudan Cloudinary'ye yükle
          const imageUrl = await uploadImageBuffer(file.buffer, file.mimetype);
          
          // Başarılı yüklenen resmi listeye ekle
          imagesToKeep.push(imageUrl);
        } catch (uploadError) {
          logger.error('Resim yükleme hatası:', { error: uploadError.message });
          throw new AppError(`Resim yükleme hatası: ${uploadError.message}`, 500);
        }
      }
      
      logger.info('Tüm yeni resimler yüklendi:', { imageCount: imagesToKeep.length });
    }
    
    // Resim listesini güncelleme verisine ekle
    updateData.images = imagesToKeep;
    
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