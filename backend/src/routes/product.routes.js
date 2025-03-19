const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');
const AppError = require('../utils/appError');

// Tüm ürünleri getir (filtreleme, sıralama ve sayfalama ile)
router.get('/', async (req, res, next) => {
  try {
    const {
      category,
      min_price,
      max_price,
      sort_by = 'created_at',
      sort_order = 'desc',
      page = 1,
      limit = 20,
      search,
      featured,
      discount,
      is_active
    } = req.query;

    let query = supabase
      .from('products')
      .select('*, categories(*)', { count: 'exact' });

    // Kategoriye göre filtreleme
    if (category) {
      query = query.eq('category_id', category);
    }

    // Fiyat aralığına göre filtreleme
    if (min_price) {
      query = query.gte('price', min_price);
    }
    if (max_price) {
      query = query.lte('price', max_price);
    }

    // Öne çıkan ürünlere göre filtreleme
    if (featured !== undefined) {
      query = query.eq('is_featured', featured === 'true');
    }

    // İndirimli ürünlere göre filtreleme
    if (discount === 'true') {
      query = query.gt('discount_percent', 0);
    }

    // Aktif/Pasif ürünlere göre filtreleme
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    // Arama sorgusu
    if (search) {
      query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`);
    }

    // Sıralama
    if (sort_by && sort_order) {
      query = query.order(sort_by, { ascending: sort_order === 'asc' });
    }

    // Sayfalama
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Ürün listeleme hatası:', { error: error.message });
      return next(new AppError('Ürünler alınamadı: ' + error.message, 500));
    }

    res.status(200).json({
      status: 'success',
      results: data.length,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(count / limit),
      data: {
        products: data
      }
    });
  } catch (error) {
    logger.error('Ürün listeleme hatası:', { error: error.message });
    next(error);
  }
});

// Belirli bir ürünü getir
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Ürün getirme hatası:', { error: error.message, id });
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

// Yeni ürün oluştur
router.post('/', protect, restrictTo('admin', 'manager'), async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      category_id,
      images,
      sku,
      discount_percent,
      is_featured,
      is_active,
      specifications,
      slug
    } = req.body;

    // Zorunlu alanları kontrol et
    if (!name || !price) {
      return next(new AppError('Ürün adı ve fiyatı zorunludur', 400));
    }

    // Ürün verisini hazırla
    const productData = {
      name,
      description,
      price: parseFloat(price),
      stock: stock || 0,
      category_id,
      images: images || [],
      sku: sku || `PROD-${Date.now()}`,
      discount_percent: discount_percent || 0,
      is_featured: is_featured || false,
      is_active: is_active !== undefined ? is_active : true,
      specifications: specifications || {},
      slug: slug || name.toLowerCase().replace(/\\s+/g, '-'),
      created_at: new Date().toISOString(),
      created_by: req.user.id
    };

    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select();

    if (error) {
      logger.error('Ürün oluşturma hatası:', { error: error.message });
      return next(new AppError('Ürün oluşturulamadı: ' + error.message, 500));
    }

    logger.info('Yeni ürün oluşturuldu', { id: data[0].id });

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

// Ürünü güncelle
router.put('/:id', protect, restrictTo('admin', 'manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
      updated_by: req.user.id
    };

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      logger.error('Ürün güncelleme hatası:', { error: error.message, id });
      return next(new AppError('Ürün güncellenemedi: ' + error.message, 500));
    }

    if (!data || data.length === 0) {
      return next(new AppError('Ürün bulunamadı', 404));
    }

    logger.info('Ürün güncellendi', { id });

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

// Ürünü sil
router.delete('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Ürün silme hatası:', { error: error.message, id });
      return next(new AppError('Ürün silinemedi: ' + error.message, 500));
    }

    logger.info('Ürün silindi', { id });

    res.status(204).send();
  } catch (error) {
    logger.error('Ürün silme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

logger.info('product.routes.js başarıyla yüklendi');

module.exports = router;