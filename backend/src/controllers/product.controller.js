const Product = require('../models/product.model');
const createError = require('http-errors');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const cloudinary = require('../config/cloudinary');

// Tüm ürünleri getir
exports.getAllProducts = async (req, res, next) => {
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

    // Ürünleri getir - populate işlemini kaldırdık
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

    res.status(200).json({
      success: true,
      data: products,
      pagination: pagination,
      count: products.length,
      message: 'Ürünler başarıyla getirildi'
    });
  } catch (error) {
    logger.error(`Ürünleri getirme hatası: ${error.message}`);
    next(error);
  }
};

// Tek ürün getir
exports.getProduct = async (req, res, next) => {
  try {
    // populate işlemini kaldırdık
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw createError(404, 'Ürün bulunamadı');
    }
    res.status(200).json({
      success: true,
      data: product,
      message: 'Ürün başarıyla getirildi'
    });
  } catch (error) {
    logger.error(`Ürün getirme hatası: ${error.message}`);
    next(error);
  }
};

// Ürün oluştur - Resim işleme etkinleştirildi
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, featured } = req.body;
    let { images } = req.body;

    // Tüm gerekli alanların kontrolü
    if (!name || !description || !price || !category || stock === undefined) {
      throw createError(400, 'Lütfen tüm gerekli alanları doldurun');
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

    // Resim işleme bölümü
    try {
      // Base64 veya resim URL'leri dizisi olarak gönderilmişse
      if (images && Array.isArray(images) && images.length > 0) {
        const uploadedImages = [];
        
        for (const image of images) {
          // Eğer zaten bir URL ise ve cloudinary içeriyorsa, doğrudan ekle
          if (typeof image === 'string' && (image.includes('cloudinary') || image.includes('/uploads/'))) {
            uploadedImages.push(image);
          } 
          // Base64 formatındaysa veya yeni bir dosyaysa yükle
          else if (typeof image === 'string' && image.startsWith('data:image')) {
            const result = await cloudinary.upload(image, 'products');
            if (result.success) {
              uploadedImages.push(result.url);
            }
          }
        }
        
        if (uploadedImages.length > 0) {
          productData.images = uploadedImages;
        } else {
          // Hiç resim yüklenemezse varsayılan resmi kullan
          productData.images = [cloudinary.getDefaultImageUrl()];
        }
      } 
      // Eğer tek bir resim gönderilmişse
      else if (images && typeof images === 'string' && images.startsWith('data:image')) {
        const result = await cloudinary.upload(images, 'products');
        if (result.success) {
          productData.images = [result.url];
        } else {
          productData.images = [cloudinary.getDefaultImageUrl()];
        }
      }
      // Resim yoksa varsayılan resmi kullan
      else {
        productData.images = [cloudinary.getDefaultImageUrl()];
      }
    } catch (uploadError) {
      logger.error(`Resim yükleme hatası: ${uploadError.message}`);
      // Hata durumunda varsayılan resmi kullan
      productData.images = [cloudinary.getDefaultImageUrl()];
    }

    // Ürünü veritabanında oluştur
    const product = await Product.create(productData);

    logger.info(`Yeni ürün oluşturuldu: ${product.name}`);
    
    return res.status(201).json({
      success: true,
      data: product,
      message: 'Ürün başarıyla oluşturuldu'
    });
  } catch (error) {
    logger.error(`Ürün oluşturma hatası: ${error.message}`);
    next(error);
  }
};

// Ürün güncelle - Resim işleme etkinleştirildi
exports.updateProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, featured } = req.body;
    let { images } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      throw createError(404, 'Ürün bulunamadı');
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
    
    // Resim işleme bölümü
    try {
      // Base64 veya resim URL'leri dizisi olarak gönderilmişse
      if (images && Array.isArray(images) && images.length > 0) {
        const uploadedImages = [];
        
        for (const image of images) {
          // Eğer zaten bir URL ise ve cloudinary içeriyorsa, doğrudan ekle
          if (typeof image === 'string' && (image.includes('cloudinary') || image.includes('/uploads/'))) {
            uploadedImages.push(image);
          } 
          // Base64 formatındaysa veya yeni bir dosyaysa yükle
          else if (typeof image === 'string' && image.startsWith('data:image')) {
            const result = await cloudinary.upload(image, 'products');
            if (result.success) {
              uploadedImages.push(result.url);
            }
          }
        }
        
        if (uploadedImages.length > 0) {
          updateData.images = uploadedImages;
        } else {
          // Eğer hiç görsel yüklenemezse, mevcut görselleri koru
          updateData.images = product.images;
        }
      } 
      // Eğer tek bir resim gönderilmişse
      else if (images && typeof images === 'string' && images.startsWith('data:image')) {
        const result = await cloudinary.upload(images, 'products');
        if (result.success) {
          updateData.images = [result.url];
        } else {
          // Yükleme başarısız olursa mevcut görselleri koru
          updateData.images = product.images;
        }
      }
      // Resim yoksa mevcut resimleri koru
      else {
        updateData.images = product.images;
      }
    } catch (uploadError) {
      logger.error(`Resim yükleme hatası: ${uploadError.message}`);
      // Hata durumunda mevcut görselleri koru
      updateData.images = product.images;
    }
    
    // Ürünü güncelle
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    logger.info(`Ürün güncellendi: ${updatedProduct.name}`);
    
    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: 'Ürün başarıyla güncellendi'
    });
  } catch (error) {
    logger.error(`Ürün güncelleme hatası: ${error.message}`);
    next(error);
  }
};

// Ürün sil
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      throw createError(404, 'Ürün bulunamadı');
    }
    
    // Ürüne ait resimleri sil
    try {
      if (product.images && product.images.length > 0) {
        for (const imageUrl of product.images) {
          if (imageUrl && (imageUrl.includes('cloudinary') || imageUrl.includes('/uploads/'))) {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.destroy(publicId);
          }
        }
      }
    } catch (error) {
      logger.error(`Resimleri silme hatası: ${error.message}`);
      // Resim silme hatası olsa bile ürünü silmeye devam et
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    logger.info(`Ürün silindi: ${product.name}`);
    
    res.status(200).json({
      success: true,
      data: null,
      message: 'Ürün başarıyla silindi'
    });
  } catch (error) {
    logger.error(`Ürün silme hatası: ${error.message}`);
    next(error);
  }
};

// Kategorileri getir
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({
      success: true,
      data: categories,
      message: 'Kategoriler başarıyla getirildi'
    });
  } catch (error) {
    logger.error(`Kategorileri getirme hatası: ${error.message}`);
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
      data: products,
      message: 'Arama sonuçları başarıyla getirildi'
    });
  } catch (error) {
    logger.error(`Ürün arama hatası: ${error.message}`);
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
      data: products,
      message: `${category} kategorisindeki ürünler başarıyla getirildi`
    });
  } catch (error) {
    logger.error(`Kategori ürünlerini getirme hatası: ${error.message}`);
    next(error);
  }
};

// Öne çıkan ürünleri getir
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    
    const products = await Product.find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.status(200).json({
      success: true,
      data: products,
      message: 'Öne çıkan ürünler başarıyla getirildi'
    });
  } catch (error) {
    logger.error(`Öne çıkan ürünleri getirme hatası: ${error.message}`);
    next(error);
  }
};

// İlgili ürünleri getir
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      throw createError(404, 'Ürün bulunamadı');
    }
    
    const limit = req.query.limit ? Number(req.query.limit) : 4;
    
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category
    })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.status(200).json({
      success: true,
      data: relatedProducts,
      message: 'İlgili ürünler başarıyla getirildi'
    });
  } catch (error) {
    logger.error(`İlgili ürünleri getirme hatası: ${error.message}`);
    next(error);
  }
};