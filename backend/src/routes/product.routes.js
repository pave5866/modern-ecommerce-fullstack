const router = require('express').Router();
const { supabase, supabaseAdmin, checkSupabaseConnection } = require('../config/supabase');
const { authenticateToken } = require('../middlewares/auth.middleware');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

// Ürün listesini getir
router.get('/', async (req, res) => {
  try {
    // Supabase bağlantı durumunu kontrol et
    const connectionStatus = await checkSupabaseConnection();
    
    if (!connectionStatus.connected) {
      logger.error(`Supabase bağlantı hatası: ${connectionStatus.message}`);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.',
        details: connectionStatus.message
      });
    }

    // Sorgu parametrelerini al
    const { page = 1, limit = 10, sort, category, minPrice, maxPrice, search } = req.query;
    const offset = (page - 1) * limit;
    
    // Temel sorgu
    let query = supabase
      .from('products')
      .select(`
        *,
        categories(*),
        images(*)
      `, { count: 'exact' });
    
    // Sadece aktif ürünleri göster
    if (!req.user || req.user.role !== 'admin') {
      query = query.eq('is_active', true);
    }
    
    // Filtreler
    if (category) {
      query = query.eq('categories.id', category);
    }
    
    if (minPrice) {
      query = query.gte('price', minPrice);
    }
    
    if (maxPrice) {
      query = query.lte('price', maxPrice);
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    // Sıralama
    if (sort) {
      const [field, order] = sort.split(':');
      if (field && order) {
        query = query.order(field, { ascending: order === 'asc' });
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    // Sayfalama
    query = query.range(offset, offset + limit - 1);
    
    // Sorguyu çalıştır
    const { data: products, error, count } = await query;
    
    if (error) {
      logger.error(`Ürünleri getirme hatası: ${error.message}`);
      return res.status(500).json({ status: 'error', message: error.message });
    }
    
    // Sonuçları gönder
    return res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`Ürün listesi getirme hatası: ${error.message}`);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Ürün listesi getirilirken bir hata oluştu.',
      details: error.message
    });
  }
});

// Tek bir ürünü getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(*),
        images(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error(`Ürün getirme hatası: ${error.message}`);
      return res.status(404).json({ status: 'error', message: 'Ürün bulunamadı', details: error.message });
    }
    
    // Sadece aktif ürünleri göster (admin değilse)
    if (!product.is_active && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({ status: 'error', message: 'Ürün bulunamadı' });
    }
    
    return res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    logger.error(`Tek ürün getirme hatası: ${error.message}`);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Ürün getirilirken bir hata oluştu.',
      details: error.message
    });
  }
});

// Yeni ürün ekle
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Sadece admin ve satıcılar ürün ekleyebilir
    if (req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({ status: 'error', message: 'Bu işlem için yetkiniz yok' });
    }
    
    const { name, description, price, stock, is_active = true, images = [], categories = [] } = req.body;
    
    // Gerekli alanları kontrol et
    if (!name || !price) {
      return res.status(400).json({ status: 'error', message: 'Ürün adı ve fiyatı gereklidir' });
    }
    
    // Ürünü ekle
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert([
        { 
          name, 
          description, 
          price, 
          stock: stock || 0, 
          is_active,
          seller_id: req.user.id
        }
      ])
      .select()
      .single();
    
    if (error) {
      logger.error(`Ürün ekleme hatası: ${error.message}`);
      return res.status(500).json({ status: 'error', message: error.message });
    }
    
    // Ürün kategorilerini ekle
    if (categories.length > 0) {
      const productCategories = categories.map(category_id => ({
        product_id: product.id,
        category_id
      }));
      
      const { error: categoryError } = await supabaseAdmin
        .from('product_categories')
        .insert(productCategories);
      
      if (categoryError) {
        logger.error(`Ürün kategorilerini ekleme hatası: ${categoryError.message}`);
      }
    }
    
    // Ürün resimlerini ekle
    if (images.length > 0) {
      const productImages = images.map((url, index) => ({
        product_id: product.id,
        url,
        order: index
      }));
      
      const { error: imageError } = await supabaseAdmin
        .from('product_images')
        .insert(productImages);
      
      if (imageError) {
        logger.error(`Ürün resimlerini ekleme hatası: ${imageError.message}`);
      }
    }
    
    // Ürün verileriyle birlikte başarı mesajı döndür
    return res.status(201).json({ status: 'success', data: product });
  } catch (error) {
    logger.error(`Ürün ekleme hatası: ${error.message}`);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Ürün eklenirken bir hata oluştu.',
      details: error.message
    });
  }
});

// Ürün güncelle
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, is_active, images, categories } = req.body;
    
    // Ürünün mevcut olup olmadığını ve kullanıcının yetkisini kontrol et
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      logger.error(`Ürün kontrol hatası: ${fetchError.message}`);
      return res.status(404).json({ status: 'error', message: 'Ürün bulunamadı', details: fetchError.message });
    }
    
    // Sadece admin veya ürünün sahibi güncelleyebilir
    if (req.user.role !== 'admin' && existingProduct.seller_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Bu ürünü güncelleme yetkiniz yok' });
    }
    
    // Ürünü güncelle
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update({ 
        name, 
        description, 
        price, 
        stock, 
        is_active,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error(`Ürün güncelleme hatası: ${error.message}`);
      return res.status(500).json({ status: 'error', message: error.message });
    }
    
    // Kategorileri güncelle (varsa)
    if (categories) {
      // Önce mevcut kategorileri sil
      const { error: deleteError } = await supabaseAdmin
        .from('product_categories')
        .delete()
        .eq('product_id', id);
      
      if (deleteError) {
        logger.error(`Ürün kategorilerini silme hatası: ${deleteError.message}`);
      }
      
      // Yeni kategorileri ekle
      if (categories.length > 0) {
        const productCategories = categories.map(category_id => ({
          product_id: id,
          category_id
        }));
        
        const { error: categoryError } = await supabaseAdmin
          .from('product_categories')
          .insert(productCategories);
        
        if (categoryError) {
          logger.error(`Ürün kategorilerini güncelleme hatası: ${categoryError.message}`);
        }
      }
    }
    
    // Resimleri güncelle (varsa)
    if (images) {
      // Önce mevcut resimleri sil
      const { error: deleteError } = await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('product_id', id);
      
      if (deleteError) {
        logger.error(`Ürün resimlerini silme hatası: ${deleteError.message}`);
      }
      
      // Yeni resimleri ekle
      if (images.length > 0) {
        const productImages = images.map((url, index) => ({
          product_id: id,
          url,
          order: index
        }));
        
        const { error: imageError } = await supabaseAdmin
          .from('product_images')
          .insert(productImages);
        
        if (imageError) {
          logger.error(`Ürün resimlerini güncelleme hatası: ${imageError.message}`);
        }
      }
    }
    
    return res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    logger.error(`Ürün güncelleme hatası: ${error.message}`);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Ürün güncellenirken bir hata oluştu.',
      details: error.message
    });
  }
});

// Ürün sil
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ürünün mevcut olup olmadığını ve kullanıcının yetkisini kontrol et
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      logger.error(`Ürün kontrol hatası: ${fetchError.message}`);
      return res.status(404).json({ status: 'error', message: 'Ürün bulunamadı', details: fetchError.message });
    }
    
    // Sadece admin veya ürünün sahibi silebilir
    if (req.user.role !== 'admin' && existingProduct.seller_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Bu ürünü silme yetkiniz yok' });
    }
    
    // İlişkili kayıtları sil
    const { error: categoriesError } = await supabaseAdmin
      .from('product_categories')
      .delete()
      .eq('product_id', id);
    
    if (categoriesError) {
      logger.error(`Ürün kategorilerini silme hatası: ${categoriesError.message}`);
    }
    
    const { error: imagesError } = await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('product_id', id);
    
    if (imagesError) {
      logger.error(`Ürün resimlerini silme hatası: ${imagesError.message}`);
    }
    
    // Ürünü sil
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error(`Ürün silme hatası: ${error.message}`);
      return res.status(500).json({ status: 'error', message: error.message });
    }
    
    return res.status(200).json({ status: 'success', message: 'Ürün başarıyla silindi' });
  } catch (error) {
    logger.error(`Ürün silme hatası: ${error.message}`);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Ürün silinirken bir hata oluştu.',
      details: error.message
    });
  }
});

module.exports = router;