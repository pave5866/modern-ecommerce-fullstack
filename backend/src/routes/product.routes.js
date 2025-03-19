const router = require('express').Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

// Middleware tanımlaması
const authenticateToken = async (req, res, next) => {
  try {
    // Token kontrolü
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ status: 'error', message: 'Yetkilendirme başlığı eksik' });
    }

    // Supabase token kontrolü
    // NOT: Gerçek uygulamada JWT doğrulaması kullanılmalıdır
    req.user = { id: 'temp-user-id', role: 'user' };
    next();
  } catch (error) {
    logger.error(`Token doğrulama hatası: ${error.message}`);
    return res.status(401).json({ status: 'error', message: 'Geçersiz veya süresi dolmuş token' });
  }
};

// Ürün listesini getir
router.get('/', async (req, res) => {
  try {
    // Sorgu parametrelerini al
    const { page = 1, limit = 10, sort, category, minPrice, maxPrice, search } = req.query;
    const offset = (page - 1) * limit;
    
    // Temel sorgu
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });
    
    // Sadece aktif ürünleri göster
    query = query.eq('is_active', true);
    
    // Filtreler
    if (category) {
      query = query.eq('category_id', category);
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
        products: products || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
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
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error(`Ürün getirme hatası: ${error.message}`);
      return res.status(404).json({ status: 'error', message: 'Ürün bulunamadı', details: error.message });
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
    // Ürün bilgilerini al
    const { name, description, price, stock, is_active = true } = req.body;
    
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
    const { name, description, price, stock, is_active } = req.body;
    
    // Ürünün mevcut olup olmadığını kontrol et
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      logger.error(`Ürün kontrol hatası: ${fetchError.message}`);
      return res.status(404).json({ status: 'error', message: 'Ürün bulunamadı', details: fetchError.message });
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
    
    // Ürünün mevcut olup olmadığını kontrol et
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      logger.error(`Ürün kontrol hatası: ${fetchError.message}`);
      return res.status(404).json({ status: 'error', message: 'Ürün bulunamadı', details: fetchError.message });
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