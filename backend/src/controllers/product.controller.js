const Product = require('../models/product.model');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const logger = require('../config/logger');
const cloudinary = require('../config/cloudinary');

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, featured } = req.body;

    // Tüm gerekli alanların kontrolü
    if (!name || !description || !price || !category || stock === undefined) {
      throw new ApiError(400, 'Lütfen tüm gerekli alanları doldurun');
    }

    // Ürün verilerini hazırla
    const productData = {
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
      featured: featured === 'true' || featured === true
    };

    // Varsayılan resim kullanılacak - Cloudinary sorunu geçici çözüm
    // Images model içinde varsayılan değere sahip

    // Ürünü veritabanında oluştur
    const product = await Product.create(productData);

    logger.info(`Yeni ürün oluşturuldu: ${product.name}`);
    
    return res.status(201).json(
      new ApiResponse(201, product, 'Ürün başarıyla oluşturuldu')
    );
  } catch (error) {
    logger.error(`Ürün oluşturma hatası: ${error.message}`);
    next(error);
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getAllProducts = async (req, res, next) => {
  try {
    const { keyword, category, minPrice, maxPrice, sort, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Temel sorgu
    const query = {};

    // Arama kelimesi varsa
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Kategori filtresi
    if (category) {
      query.category = category;
    }

    // Fiyat filtresi
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sıralama seçenekleri
    let sortOptions = {};
    if (sort) {
      switch (sort) {
        case 'price_asc':
          sortOptions = { price: 1 };
          break;
        case 'price_desc':
          sortOptions = { price: -1 };
          break;
        case 'latest':
          sortOptions = { createdAt: -1 };
          break;
        case 'ratings':
          sortOptions = { ratings: -1 };
          break;
        default:
          sortOptions = { createdAt: -1 };
      }
    } else {
      sortOptions = { createdAt: -1 };
    }

    // Toplam ürün sayısı
    const totalProducts = await Product.countDocuments(query);

    // Ürünleri getir
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    // Sayfalama bilgisi
    const pagination = {
      total: totalProducts,
      page: Number(page),
      pages: Math.ceil(totalProducts / limit),
      limit: Number(limit)
    };

    res.status(200).json(
      new ApiResponse(200, { products, pagination }, 'Ürünler başarıyla getirildi')
    );
  } catch (error) {
    logger.error(`Ürünleri getirme hatası: ${error.message}`);
    next(error);
  }
};

// @desc    Get a single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new ApiError(404, 'Ürün bulunamadı');
    }

    res.status(200).json(
      new ApiResponse(200, product, 'Ürün başarıyla getirildi')
    );
  } catch (error) {
    logger.error(`Ürün getirme hatası: ${error.message}`);
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, featured } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      throw new ApiError(404, 'Ürün bulunamadı');
    }
    
    // Güncelleme verilerini hazırla
    const updateData = {
      name: name || product.name,
      description: description || product.description,
      price: price ? Number(price) : product.price,
      category: category || product.category,
      stock: stock !== undefined ? Number(stock) : product.stock,
      featured: featured !== undefined ? (featured === 'true' || featured === true) : product.featured
    };
    
    // Mevcut resimleri koru - Cloudinary sorunu geçici çözüm
    updateData.images = product.images;
    
    // Ürünü güncelle
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    logger.info(`Ürün güncellendi: ${updatedProduct.name}`);
    
    res.status(200).json(
      new ApiResponse(200, updatedProduct, 'Ürün başarıyla güncellendi')
    );
  } catch (error) {
    logger.error(`Ürün güncelleme hatası: ${error.message}`);
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      throw new ApiError(404, 'Ürün bulunamadı');
    }
    
    // Ürüne ait resimleri Cloudinary'den sil
    try {
      if (product.images && product.images.length > 0) {
        for (const imageUrl of product.images) {
          if (imageUrl && imageUrl.includes('cloudinary')) {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          }
        }
      }
    } catch (error) {
      logger.error(`Resimleri silme hatası: ${error.message}`);
      // Resim silme hatası olsa bile ürünü silmeye devam et
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    logger.info(`Ürün silindi: ${product.name}`);
    
    res.status(200).json(
      new ApiResponse(200, null, 'Ürün başarıyla silindi')
    );
  } catch (error) {
    logger.error(`Ürün silme hatası: ${error.message}`);
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    
    const products = await Product.find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.status(200).json(
      new ApiResponse(200, products, 'Öne çıkan ürünler başarıyla getirildi')
    );
  } catch (error) {
    logger.error(`Öne çıkan ürünleri getirme hatası: ${error.message}`);
    next(error);
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryName
// @access  Public
const getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryName } = req.params;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const skip = (page - 1) * limit;
    
    const totalProducts = await Product.countDocuments({ category: categoryName });
    
    const products = await Product.find({ category: categoryName })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const pagination = {
      total: totalProducts,
      page,
      pages: Math.ceil(totalProducts / limit),
      limit
    };
    
    res.status(200).json(
      new ApiResponse(
        200, 
        { products, pagination }, 
        `${categoryName} kategorisindeki ürünler başarıyla getirildi`
      )
    );
  } catch (error) {
    logger.error(`Kategori ürünlerini getirme hatası: ${error.message}`);
    next(error);
  }
};

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      throw new ApiError(404, 'Ürün bulunamadı');
    }
    
    const limit = req.query.limit ? Number(req.query.limit) : 4;
    
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category
    })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.status(200).json(
      new ApiResponse(200, relatedProducts, 'İlgili ürünler başarıyla getirildi')
    );
  } catch (error) {
    logger.error(`İlgili ürünleri getirme hatası: ${error.message}`);
    next(error);
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
const getProductCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    
    res.status(200).json(
      new ApiResponse(200, categories, 'Ürün kategorileri başarıyla getirildi')
    );
  } catch (error) {
    logger.error(`Ürün kategorilerini getirme hatası: ${error.message}`);
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByCategory,
  getRelatedProducts,
  getProductCategories
};