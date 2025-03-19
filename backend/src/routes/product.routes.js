const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');
const AppError = require('../utils/appError');

// Tüm ürünleri getir (public)
router.get('/', async (req, res, next) => {
  try {
    // Query parametreleri
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? true : false;
    
    // Offset hesapla
    const offset = (page - 1) * limit;
    
    // Base query
    let query = supabase
      .from('products')
      .select('*, categories(name)', { count: 'exact' });
    
    // Filtreler
    if (category) {
      query = query.eq('category_id', category);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`);
    }
    
    if (minPrice !== null) {
      query = query.gte('price', minPrice);
    }
    
    if (maxPrice !== null) {
      query = query.lte('price', maxPrice);
    }
    
    // Sadece aktif ürünleri getir (admin değilse)
    if (!req.user || req.user.role !== 'admin') {
      query = query.eq('is_active', true);
    }
    
    // Sıralama
    query = query.order(sortBy, { ascending: sortOrder });
    
    // Pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      logger.error('Ürün listeleme hatası:', { error: error.message });
      return next(new AppError('Ürünler alınamadı: ' + error.message, 500));
    }
    
    // Total pages hesapla
    const totalPages = Math.ceil((count || 0) / limit);
    
    res.status(200).json({
      status: 'success',
      results: data.length,
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages
      },
      data: {
        products: data || []
      }
    });
  } catch (error) {
    logger.error('Ürün listeleme hatası:', { error: error.message });
    next(error);
  }
});

// Tek ürün getir (public)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Ürünü ve kategorisini getir
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, id)')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error('Ürün getirme hatası:', { error: error.message, id });
      return next(new AppError(
        error.code === 'PGRST116' ? 'Ürün bulunamadı' : 'Ürün alınamadı: ' + error.message,
        error.code === 'PGRST116' ? 404 : 500
      ));
    }
    
    // Sadece aktif ürünleri göster (admin değilse)
    if (!data.is_active && (!req.user || req.user.role !== 'admin')) {
      return next(new AppError('Ürün bulunamadı', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        product: data
      }
    });
  } catch (error) {
    logger.error('Ürün getirme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

// Ürün oluştur (sadece admin)
router.post('/', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { 
      name, description, price, stock, category_id, 
      images, is_active, features, specifications, 
      sku, barcode, weight, dimensions
    } = req.body;
    
    // Zorunlu alanları kontrol et
    if (!name || !price || !category_id) {
      return next(new AppError('Ürün adı, fiyat ve kategori zorunludur', 400));
    }
    
    // Kategori var mı kontrol et
    const { data: categoryExists, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .single();
    
    if (categoryError || !categoryExists) {
      return next(new AppError('Geçersiz kategori', 400));
    }
    
    // Yeni ürün oluştur
    const productData = {
      name,
      description,
      price: parseFloat(price),
      stock: stock || 0,
      category_id,
      images: images || [],
      is_active: is_active !== undefined ? is_active : true,
      features: features || [],
      specifications: specifications || {},
      sku: sku || null,
      barcode: barcode || null,
      weight: weight || null,
      dimensions: dimensions || null,
      created_at: new Date().toISOString(),
      created_by: req.user.id
    };
    
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select();
    
    if (error) {
      logger.error('Ürün oluşturma hatası:', { error: error.message, product: productData });
      return next(new AppError('Ürün oluşturulamadı: ' + error.message, 500));
    }
    
    logger.info('Yeni ürün oluşturuldu:', { id: data[0].id, name: data[0].name });
    
    res.status(201).json({
      status: 'success',
      data: {
        product: data[0]
      }
    });
  } catch (error) {
    logger.error('Ürün oluşturma hatası:', { error: error.message });
    next(error);
  }
});

// Ürün güncelle (sadece admin)
router.put('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, description, price, stock, category_id, 
      images, is_active, features, specifications, 
      sku, barcode, weight, dimensions
    } = req.body;
    
    // Ürün var mı kontrol et
    const { data: existingProduct, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (findError || !existingProduct) {
      return next(new AppError('Ürün bulunamadı', 404));
    }
    
    // Eğer kategori değiştiyse, yeni kategori var mı kontrol et
    if (category_id && category_id !== existingProduct.category_id) {
      const { data: categoryExists, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', category_id)
        .single();
      
      if (categoryError || !categoryExists) {
        return next(new AppError('Geçersiz kategori', 400));
      }
    }
    
    // Güncellenecek alanları topla
    const updateData = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(stock !== undefined && { stock }),
      ...(category_id && { category_id }),
      ...(images && { images }),
      ...(is_active !== undefined && { is_active }),
      ...(features && { features }),
      ...(specifications && { specifications }),
      ...(sku !== undefined && { sku }),
      ...(barcode !== undefined && { barcode }),
      ...(weight !== undefined && { weight }),
      ...(dimensions !== undefined && { dimensions }),
      updated_at: new Date().toISOString(),
      updated_by: req.user.id
    };
    
    // Güncellemeyi yap
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) {
      logger.error('Ürün güncelleme hatası:', { error: error.message, id, updateData });
      return next(new AppError('Ürün güncellenemedi: ' + error.message, 500));
    }
    
    logger.info('Ürün güncellendi:', { id, name: updateData.name || existingProduct.name });
    
    res.status(200).json({
      status: 'success',
      data: {
        product: data[0]
      }
    });
  } catch (error) {
    logger.error('Ürün güncelleme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

// Ürün sil (sadece admin)
router.delete('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Ürün var mı kontrol et
    const { data: existingProduct, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (findError || !existingProduct) {
      return next(new AppError('Ürün bulunamadı', 404));
    }
    
    // Sepette veya siparişlerde ürün var mı kontrol et
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('id')
      .eq('product_id', id);
    
    if (!cartError && cartItems && cartItems.length > 0) {
      return next(new AppError('Bu ürün bazı kullanıcıların sepetinde. Önce sepetlerden kaldırılmalı.', 400));
    }
    
    // Siparişlerde kontrol
    const { data: orderItems, error: orderError } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', id);
    
    if (!orderError && orderItems && orderItems.length > 0) {
      return next(new AppError('Bu ürün bazı siparişlerde var. Silinemez, ancak pasif duruma geçirilebilir.', 400));
    }
    
    // Ürünü sil
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Ürün silme hatası:', { error: error.message, id });
      return next(new AppError('Ürün silinemedi: ' + error.message, 500));
    }
    
    logger.info('Ürün silindi:', { id, name: existingProduct.name });
    
    res.status(204).send();
  } catch (error) {
    logger.error('Ürün silme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

// Ürün fotoğraflarını güncelle (sadece admin)
router.put('/:id/images', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { images } = req.body;
    
    if (!images || !Array.isArray(images)) {
      return next(new AppError('Geçerli resim dizisi gerekli', 400));
    }
    
    // Ürün var mı kontrol et
    const { data: existingProduct, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (findError || !existingProduct) {
      return next(new AppError('Ürün bulunamadı', 404));
    }
    
    // Resimleri güncelle
    const { data, error } = await supabase
      .from('products')
      .update({
        images,
        updated_at: new Date().toISOString(),
        updated_by: req.user.id
      })
      .eq('id', id)
      .select();
    
    if (error) {
      logger.error('Ürün resimleri güncelleme hatası:', { error: error.message, id });
      return next(new AppError('Ürün resimleri güncellenemedi: ' + error.message, 500));
    }
    
    logger.info('Ürün resimleri güncellendi:', { id, imageCount: images.length });
    
    res.status(200).json({
      status: 'success',
      data: {
        product: data[0]
      }
    });
  } catch (error) {
    logger.error('Ürün resimleri güncelleme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

// Ürün stok güncelleme (sadece admin)
router.patch('/:id/stock', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    
    if (stock === undefined || isNaN(parseInt(stock))) {
      return next(new AppError('Geçerli stok değeri gerekli', 400));
    }
    
    // Ürün var mı kontrol et
    const { data: existingProduct, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (findError || !existingProduct) {
      return next(new AppError('Ürün bulunamadı', 404));
    }
    
    // Stok güncelle
    const { data, error } = await supabase
      .from('products')
      .update({
        stock: parseInt(stock),
        updated_at: new Date().toISOString(),
        updated_by: req.user.id
      })
      .eq('id', id)
      .select();
    
    if (error) {
      logger.error('Ürün stok güncelleme hatası:', { error: error.message, id });
      return next(new AppError('Ürün stok bilgisi güncellenemedi: ' + error.message, 500));
    }
    
    logger.info('Ürün stok güncellendi:', { id, previousStock: existingProduct.stock, newStock: stock });
    
    res.status(200).json({
      status: 'success',
      data: {
        product: data[0]
      }
    });
  } catch (error) {
    logger.error('Ürün stok güncelleme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

logger.info('product.routes.js başarıyla yüklendi');

module.exports = router;