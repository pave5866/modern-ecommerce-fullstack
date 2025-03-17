const Category = require('../models/category.model');
const Product = require('../models/product.model');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const logger = require('../utils/logger');

/**
 * Tüm kategorileri getir
 */
exports.getAllCategories = catchAsync(async (req, res) => {
  // Filtre, sıralama ve sayfalama
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const skip = (page - 1) * limit;
  const sort = req.query.sort ? { [req.query.sort]: req.query.order === 'desc' ? -1 : 1 } : { name: 1 };

  // Kategori arama
  const filter = {};
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  // Sadece aktif kategorileri getir (isActive: true)
  if (req.query.active === 'true') {
    filter.isActive = true;
  }

  // Sorgu ve toplam sayı
  const [categories, total] = await Promise.all([
    Category.find(filter)
      .select('-__v')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Category.countDocuments(filter)
  ]);

  // Yanıt
  res.status(200).json({
    success: true,
    count: categories.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: categories
  });
});

/**
 * Belirli bir kategoriyi ID veya slug ile getir
 */
exports.getCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // ID veya slug ile kategori bul
  const category = await Category.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
      { slug: id }
    ]
  }).lean();

  if (!category) {
    return next(new AppError('Kategori bulunamadı', 404));
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

/**
 * Kategoriye ait ürünleri getir
 */
exports.getCategoryProducts = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  
  // Kategoriyi bul
  const category = await Category.findOne({ slug }).lean();
  
  if (!category) {
    return next(new AppError('Kategori bulunamadı', 404));
  }

  // Filtre, sıralama ve sayfalama
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Sıralama seçenekleri
  const sortOptions = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'date-asc': { createdAt: 1 },
    'date-desc': { createdAt: -1 },
    'name-asc': { name: 1 },
    'name-desc': { name: -1 },
    'popular': { totalSales: -1 }
  };
  
  const sort = sortOptions[req.query.sort] || { createdAt: -1 };
  
  // Ürünleri getir
  const [products, total] = await Promise.all([
    Product.find({ 
      category: category._id,
      isActive: true 
    })
    .select('-__v')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean(),
    Product.countDocuments({ 
      category: category._id,
      isActive: true 
    })
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    category: {
      _id: category._id,
      name: category.name,
      slug: category.slug
    },
    data: products
  });
});

/**
 * Yeni kategori oluştur
 */
exports.createCategory = catchAsync(async (req, res, next) => {
  // Veri doğrulama
  const { name, description, slug, imageUrl, isActive, parent } = req.body;
  
  // Kategori oluştur
  const category = await Category.create({
    name,
    description,
    slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
    imageUrl,
    isActive: isActive !== undefined ? isActive : true,
    parent
  });

  logger.info(`Yeni kategori oluşturuldu: ${category.name} (${category._id})`);
  
  res.status(201).json({
    success: true,
    data: category
  });
});

/**
 * Kategori güncelle
 */
exports.updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Kategoriyi bul
  const category = await Category.findById(id);
  
  if (!category) {
    return next(new AppError('Kategori bulunamadı', 404));
  }
  
  // Alanları güncelle
  const fieldsToUpdate = ['name', 'description', 'slug', 'imageUrl', 'isActive', 'parent'];
  
  fieldsToUpdate.forEach(field => {
    if (req.body[field] !== undefined) {
      category[field] = req.body[field];
    }
  });
  
  // Özel slug kontrolü - slug belirtilmediyse isimden otomatik oluştur
  if (req.body.name && !req.body.slug) {
    category.slug = req.body.name.toLowerCase().replace(/\s+/g, '-');
  }
  
  // Kaydet
  await category.save();
  
  logger.info(`Kategori güncellendi: ${category.name} (${category._id})`);
  
  res.status(200).json({
    success: true,
    data: category
  });
});

/**
 * Kategori sil
 */
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Kategoriyi bul
  const category = await Category.findById(id);
  
  if (!category) {
    return next(new AppError('Kategori bulunamadı', 404));
  }
  
  // Kategoriyi sil
  await category.remove();
  
  logger.info(`Kategori silindi: ${category.name} (${category._id})`);
  
  res.status(200).json({
    success: true,
    message: 'Kategori başarıyla silindi'
  });
});