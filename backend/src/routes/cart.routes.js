const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');
const AppError = require('../utils/appError');

// Kullanıcının sepetini getir
router.get('/', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Sepet ürünlerini ve ilişkili ürün bilgilerini getir
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id, quantity, created_at,
        products:product_id(id, name, price, stock, images, is_active)
      `)
      .eq('user_id', userId);
    
    if (error) {
      logger.error('Sepet getirme hatası:', { error: error.message, userId });
      return next(new AppError('Sepet bilgileri alınamadı: ' + error.message, 500));
    }
    
    // Aktif olmayan veya stokta olmayan ürünleri filtrele ve kullanıcıya bildir
    const validItems = [];
    const invalidItems = [];
    
    data.forEach(item => {
      if (!item.products) {
        invalidItems.push({
          id: item.id,
          reason: 'Ürün bulunamadı'
        });
        return;
      }
      
      if (!item.products.is_active) {
        invalidItems.push({
          id: item.id,
          reason: 'Ürün artık satışta değil',
          product: item.products
        });
        return;
      }
      
      if (item.products.stock < item.quantity) {
        invalidItems.push({
          id: item.id,
          reason: 'Yetersiz stok',
          requested: item.quantity,
          available: item.products.stock,
          product: item.products
        });
        return;
      }
      
      validItems.push(item);
    });
    
    // Sepet toplamını hesapla
    const total = validItems.reduce((sum, item) => {
      return sum + (item.products.price * item.quantity);
    }, 0);
    
    // Sepet özeti
    const cartSummary = {
      items: validItems,
      invalidItems,
      itemCount: validItems.length,
      total
    };
    
    res.status(200).json({
      status: 'success',
      data: {
        cart: cartSummary
      }
    });
  } catch (error) {
    logger.error('Sepet getirme hatası:', { error: error.message });
    next(error);
  }
});

// Sepete ürün ekle
router.post('/items', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;
    
    // Zorunlu alanları kontrol et
    if (!product_id) {
      return next(new AppError('Ürün ID gerekli', 400));
    }
    
    if (!quantity || quantity <= 0) {
      return next(new AppError('Geçerli miktar gerekli', 400));
    }
    
    // Ürün var mı ve aktif mi kontrol et
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();
    
    if (productError || !product) {
      return next(new AppError('Ürün bulunamadı veya aktif değil', 404));
    }
    
    // Stok kontrolü
    if (product.stock < quantity) {
      return next(new AppError(`Yetersiz stok. Talep: ${quantity}, Mevcut: ${product.stock}`, 400));
    }
    
    // Sepette aynı ürün var mı kontrol et
    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', product_id)
      .single();
    
    let result;
    
    if (!existingError && existingItem) {
      // Ürün zaten sepette, miktarı güncelle
      const newQuantity = existingItem.quantity + quantity;
      
      // Güncel stok kontrolü
      if (product.stock < newQuantity) {
        return next(new AppError(`Yetersiz stok. Toplam talep: ${newQuantity}, Mevcut: ${product.stock}`, 400));
      }
      
      const { data, error } = await supabase
        .from('cart_items')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select();
      
      if (error) {
        logger.error('Sepet ürünü güncelleme hatası:', { error: error.message, userId, productId: product_id });
        return next(new AppError('Sepet güncellenemedi: ' + error.message, 500));
      }
      
      result = data[0];
      logger.info('Sepet ürünü güncellendi:', { userId, productId: product_id, quantity: newQuantity });
    } else {
      // Yeni ürün ekle
      const { data, error } = await supabase
        .from('cart_items')
        .insert([{
          user_id: userId,
          product_id,
          quantity,
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        logger.error('Sepete ürün ekleme hatası:', { error: error.message, userId, productId: product_id });
        return next(new AppError('Sepete ürün eklenemedi: ' + error.message, 500));
      }
      
      result = data[0];
      logger.info('Sepete yeni ürün eklendi:', { userId, productId: product_id, quantity });
    }
    
    // Ürün bilgisiyle birlikte yanıt döndür
    const { data: itemWithProduct, error: getError } = await supabase
      .from('cart_items')
      .select(`
        id, quantity, created_at,
        products:product_id(id, name, price, stock, images)
      `)
      .eq('id', result.id)
      .single();
    
    res.status(201).json({
      status: 'success',
      message: existingItem ? 'Ürün miktarı güncellendi' : 'Ürün sepete eklendi',
      data: {
        cartItem: getError ? result : itemWithProduct
      }
    });
  } catch (error) {
    logger.error('Sepete ürün ekleme hatası:', { error: error.message });
    next(error);
  }
});

// Sepetteki ürün miktarını güncelle
router.put('/items/:id', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      return next(new AppError('Geçerli miktar gerekli', 400));
    }
    
    // Sepet ürününü kontrol et
    const { data: cartItem, error: findError } = await supabase
      .from('cart_items')
      .select('*, products:product_id(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (findError || !cartItem) {
      return next(new AppError('Sepet ürünü bulunamadı', 404));
    }
    
    // Stok kontrolü
    if (cartItem.products.stock < quantity) {
      return next(new AppError(`Yetersiz stok. Talep: ${quantity}, Mevcut: ${cartItem.products.stock}`, 400));
    }
    
    // Güncelle
    const { data, error } = await supabase
      .from('cart_items')
      .update({ 
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select();
    
    if (error) {
      logger.error('Sepet ürünü güncelleme hatası:', { error: error.message, userId, id });
      return next(new AppError('Sepet güncellenemedi: ' + error.message, 500));
    }
    
    logger.info('Sepet ürünü güncellendi:', { userId, id, quantity });
    
    // Ürün bilgisiyle birlikte yanıt döndür
    const { data: itemWithProduct, error: getError } = await supabase
      .from('cart_items')
      .select(`
        id, quantity, created_at,
        products:product_id(id, name, price, stock, images)
      `)
      .eq('id', id)
      .single();
    
    res.status(200).json({
      status: 'success',
      data: {
        cartItem: getError ? data[0] : itemWithProduct
      }
    });
  } catch (error) {
    logger.error('Sepet ürünü güncelleme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

// Sepetten ürün sil
router.delete('/items/:id', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Sepet ürününü kontrol et
    const { data: cartItem, error: findError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (findError || !cartItem) {
      return next(new AppError('Sepet ürünü bulunamadı', 404));
    }
    
    // Sil
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      logger.error('Sepet ürünü silme hatası:', { error: error.message, userId, id });
      return next(new AppError('Sepet ürünü silinemedi: ' + error.message, 500));
    }
    
    logger.info('Sepet ürünü silindi:', { userId, id });
    
    res.status(204).send();
  } catch (error) {
    logger.error('Sepet ürünü silme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

// Sepeti tamamen temizle
router.delete('/', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Tüm sepet ürünlerini sil
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      logger.error('Sepet temizleme hatası:', { error: error.message, userId });
      return next(new AppError('Sepet temizlenemedi: ' + error.message, 500));
    }
    
    logger.info('Sepet temizlendi:', { userId });
    
    res.status(204).send();
  } catch (error) {
    logger.error('Sepet temizleme hatası:', { error: error.message });
    next(error);
  }
});

logger.info('cart.routes.js başarıyla yüklendi');

module.exports = router;