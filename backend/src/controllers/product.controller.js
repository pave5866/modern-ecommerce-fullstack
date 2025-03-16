const Product = require('../models/product.model');
const createError = require('http-errors');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

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

// Ürün oluştur - Resim işleme devre dışı bırakılmış
exports.createProduct = async (req, res, next) => {
  try {
    // Ürün verilerini hazırla
    const productData = {
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      price: parseFloat(req.body.price),
      category: req.body.category.trim(),
      stock: parseInt(req.body.stock),
      // Varsayılan bir resim URL'si kullan
      images: ["https://res.cloudinary.com/dlkrduwav/image/upload/v1647812345/default_product_image.png"]
    };

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

// Ürün güncelle - Resim işleme devre dışı bırakılmış
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
      stock: req.body.stock ? parseInt(req.body.stock) : existingProduct.stock,
      // Mevcut resimleri koru
      images: existingProduct.images
    };
    
    logger.info('Ürün güncelleniyor:', { 
      productId: req.params.id
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