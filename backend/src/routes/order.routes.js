const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');
const AppError = require('../utils/appError');

// Sipariş oluştur
router.post('/', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      items, shipping_address_id, billing_address_id,
      payment_method, shipping_method
    } = req.body;
    
    // Gerekli alanları kontrol et
    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('Geçerli sipariş ürünleri gerekli', 400));
    }
    
    if (!shipping_address_id) {
      return next(new AppError('Gönderim adresi gerekli', 400));
    }
    
    if (!payment_method) {
      return next(new AppError('Ödeme yöntemi gerekli', 400));
    }
    
    if (!shipping_method) {
      return next(new AppError('Teslimat yöntemi gerekli', 400));
    }
    
    // Adres kontrolü
    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', shipping_address_id)
      .eq('user_id', userId)
      .single();
    
    if (addressError || !address) {
      return next(new AppError('Geçersiz gönderim adresi', 400));
    }
    
    // Fatura adresi kontrolü
    if (billing_address_id && billing_address_id !== shipping_address_id) {
      const { data: billingAddress, error: billingAddressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', billing_address_id)
        .eq('user_id', userId)
        .single();
      
      if (billingAddressError || !billingAddress) {
        return next(new AppError('Geçersiz fatura adresi', 400));
      }
    }
    
    // Ürünleri kontrol et ve sipariş toplamını hesapla
    let total = 0;
    let orderItems = [];
    
    for (const item of items) {
      const { product_id, quantity } = item;
      
      if (!product_id || !quantity || quantity <= 0) {
        return next(new AppError('Geçersiz ürün veya miktar', 400));
      }
      
      // Ürün detaylarını al
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', product_id)
        .eq('is_active', true)
        .single();
      
      if (productError || !product) {
        return next(new AppError(`Ürün bulunamadı veya aktif değil: ${product_id}`, 400));
      }
      
      // Stok kontrolü
      if (product.stock < quantity) {
        return next(new AppError(`Yetersiz stok: ${product.name}`, 400));
      }
      
      // Ürün tutarını hesapla
      const itemTotal = product.price * quantity;
      
      // Sipariş ürünü ekle
      orderItems.push({
        product_id,
        product_name: product.name,
        product_image: product.images && product.images.length > 0 ? product.images[0] : null,
        quantity,
        price: product.price,
        total: itemTotal
      });
      
      // Toplama ekle
      total += itemTotal;
    }
    
    // Kargo bedeli (örnek)
    const shipping_cost = shipping_method === 'express' ? 50 : 25;
    total += shipping_cost;
    
    // Sipariş oluştur
    const orderData = {
      user_id: userId,
      shipping_address_id,
      billing_address_id: billing_address_id || shipping_address_id,
      payment_method,
      shipping_method,
      shipping_cost,
      total_amount: total,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    // Supabase transaction ile işlemleri yap
    
    // 1. Siparişi oluştur
    const { data: orderData1, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select();
    
    if (orderError) {
      logger.error('Sipariş oluşturma hatası:', { error: orderError.message, userId });
      return next(new AppError('Sipariş oluşturulamadı: ' + orderError.message, 500));
    }
    
    const orderId = orderData1[0].id;
    
    // 2. Sipariş ürünlerini ekle
    for (const item of orderItems) {
      item.order_id = orderId;
      
      const { error: itemError } = await supabase
        .from('order_items')
        .insert([item]);
      
      if (itemError) {
        logger.error('Sipariş ürünü ekleme hatası:', { error: itemError.message, orderId, item });
        // İdeal olarak burada işlem geri alınmalı, ama Supabase'de transaction yok.
        // Sipariş ve eklenen ürünler elle temizlenebilir veya servis hook kullanarak ileride temizlenebilir.
        return next(new AppError('Sipariş ürünleri eklenirken hata oluştu: ' + itemError.message, 500));
      }
      
      // 3. Ürün stoğunu güncelle
      const { error: stockError } = await supabase
        .from('products')
        .update({ 
          stock: supabase.raw(`stock - ${item.quantity}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product_id);
      
      if (stockError) {
        logger.error('Stok güncelleme hatası:', { error: stockError.message, productId: item.product_id });
        // İdeal olarak burada işlem geri alınmalı
        return next(new AppError('Stok güncellenirken hata oluştu: ' + stockError.message, 500));
      }
    }
    
    // 4. Sepeti temizle
    const { error: cartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
    
    if (cartError) {
      logger.error('Sepet temizleme hatası:', { error: cartError.message, userId });
      // Bu kritik değil, sipariş yine de oluşturuldu
      logger.warn('Sepet temizlenemedi ama sipariş oluşturuldu', { userId, orderId });
    }
    
    // Siparişi ek detayları ile getir
    const { data: completeOrder, error: getOrderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        shipping_address:shipping_address_id(*)
      `)
      .eq('id', orderId)
      .single();
    
    if (getOrderError) {
      logger.error('Sipariş detayları getirme hatası:', { error: getOrderError.message, orderId });
      // Sipariş yine de oluşturuldu, sadece detayları getirilemedi
    }
    
    logger.info('Yeni sipariş oluşturuldu:', { 
      orderId, 
      userId,
      total, 
      itemCount: orderItems.length 
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        order: completeOrder || {
          id: orderId,
          ...orderData,
          order_items: orderItems
        }
      }
    });
  } catch (error) {
    logger.error('Sipariş oluşturma hatası:', { error: error.message });
    next(error);
  }
});

// Kendi siparişlerini getir (kullanıcı)
router.get('/my', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Query parametreleri
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    // Offset hesapla
    const offset = (page - 1) * limit;
    
    // Query oluştur
    let query = supabase
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Durum filtresi
    if (status) {
      query = query.eq('status', status);
    }
    
    // Pagination
    query = query.range(offset, offset + limit - 1);
    
    // Çalıştır
    const { data, error, count } = await query;
    
    if (error) {
      logger.error('Sipariş listeleme hatası:', { error: error.message, userId });
      return next(new AppError('Siparişler alınamadı: ' + error.message, 500));
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
        orders: data || []
      }
    });
  } catch (error) {
    logger.error('Sipariş listeleme hatası:', { error: error.message });
    next(error);
  }
});

// Tek sipariş detayı getir (kullanıcı kendi siparişi)
router.get('/my/:id', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        shipping_address:shipping_address_id(*),
        billing_address:billing_address_id(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      logger.error('Sipariş detayı getirme hatası:', { error: error.message, id, userId });
      return next(new AppError(
        error.code === 'PGRST116' ? 'Sipariş bulunamadı' : 'Sipariş alınamadı: ' + error.message,
        error.code === 'PGRST116' ? 404 : 500
      ));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        order: data
      }
    });
  } catch (error) {
    logger.error('Sipariş detayı getirme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

// Tüm siparişleri getir (sadece admin)
router.get('/', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    // Query parametreleri
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const userId = req.query.user;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    // Offset hesapla
    const offset = (page - 1) * limit;
    
    // Query oluştur
    let query = supabase
      .from('orders')
      .select('*, users(email, full_name), order_items(*)', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // Filtreler
    if (status) {
      query = query.eq('status', status);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    // Pagination
    query = query.range(offset, offset + limit - 1);
    
    // Çalıştır
    const { data, error, count } = await query;
    
    if (error) {
      logger.error('Admin sipariş listeleme hatası:', { error: error.message });
      return next(new AppError('Siparişler alınamadı: ' + error.message, 500));
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
        orders: data || []
      }
    });
  } catch (error) {
    logger.error('Admin sipariş listeleme hatası:', { error: error.message });
    next(error);
  }
});

// Tek sipariş detayı getir (admin)
router.get('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        users(id, email, full_name, phone),
        order_items(*),
        shipping_address:shipping_address_id(*),
        billing_address:billing_address_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error('Admin sipariş detayı getirme hatası:', { error: error.message, id });
      return next(new AppError(
        error.code === 'PGRST116' ? 'Sipariş bulunamadı' : 'Sipariş alınamadı: ' + error.message,
        error.code === 'PGRST116' ? 404 : 500
      ));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        order: data
      }
    });
  } catch (error) {
    logger.error('Admin sipariş detayı getirme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

// Sipariş durumunu güncelle (admin)
router.patch('/:id/status', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    
    if (!status) {
      return next(new AppError('Sipariş durumu gerekli', 400));
    }
    
    // Geçerli durumlar
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      return next(new AppError('Geçersiz sipariş durumu', 400));
    }
    
    // Siparişi kontrol et
    const { data: existingOrder, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (findError || !existingOrder) {
      return next(new AppError('Sipariş bulunamadı', 404));
    }
    
    // İptal veya iade durumunda stoğa geri ekleme (sadece teslimat öncesi durumlar)
    const prevStatus = existingOrder.status;
    const needStockAdjustment = (status === 'cancelled' || status === 'refunded') && 
                               ['pending', 'processing'].includes(prevStatus);
    
    if (needStockAdjustment) {
      // Sipariş ürünlerini al
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);
      
      if (!itemsError && orderItems) {
        // Her ürün için stok güncelle
        for (const item of orderItems) {
          await supabase
            .from('products')
            .update({ 
              stock: supabase.raw(`stock + ${item.quantity}`),
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_id);
        }
      }
    }
    
    // Durumu güncelle
    const updateData = {
      status,
      ...(note && { notes: (existingOrder.notes || '') + `\\n${new Date().toISOString()}: ${note}` }),
      updated_at: new Date().toISOString(),
      updated_by: req.user.id
    };
    
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) {
      logger.error('Sipariş durumu güncelleme hatası:', { error: error.message, id, status });
      return next(new AppError('Sipariş durumu güncellenemedi: ' + error.message, 500));
    }
    
    logger.info('Sipariş durumu güncellendi:', { 
      id, 
      previousStatus: existingOrder.status, 
      newStatus: status,
      updatedBy: req.user.id 
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        order: data[0]
      }
    });
  } catch (error) {
    logger.error('Sipariş durumu güncelleme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

logger.info('order.routes.js başarıyla yüklendi');

module.exports = router;