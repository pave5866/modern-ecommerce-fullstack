const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Kullanıcının siparişlerini getir
router.get('/', protect, async (req, res, next) => {
  try {
    // Supabase'den kullanıcının siparişlerini getir
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        created_at,
        updated_at
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Sipariş getirme hatası: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Siparişler alınamadı'
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error(`Sipariş getirme işleminde hata: ${error.message}`);
    next(error);
  }
});

// Belirli bir siparişin detaylarını getir
router.get('/:id', protect, async (req, res, next) => {
  try {
    const orderId = req.params.id;

    // Siparişin kullanıcıya ait olup olmadığını kontrol et (admin tüm siparişleri görebilir)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    // Kullanıcının kendisine ait olmayan siparişleri görmesini engelle (admin hariç)
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu siparişi görüntüleme yetkiniz yok'
      });
    }

    // Sipariş detaylarını getir
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        quantity,
        price,
        product_id,
        products (
          id,
          name,
          image_url
        )
      `)
      .eq('order_id', orderId);

    if (itemsError) {
      logger.error(`Sipariş detayları getirme hatası: ${itemsError.message}`);
      return res.status(500).json({
        success: false,
        message: 'Sipariş detayları alınamadı'
      });
    }

    // Adres bilgilerini getir
    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', order.address_id)
      .single();

    if (addressError && addressError.code !== 'PGRST116') {
      logger.error(`Adres bilgisi getirme hatası: ${addressError.message}`);
    }

    res.status(200).json({
      success: true,
      data: {
        ...order,
        items: orderItems,
        address: address || null
      }
    });
  } catch (error) {
    logger.error(`Sipariş detayı getirme işleminde hata: ${error.message}`);
    next(error);
  }
});

// Yeni sipariş oluştur
router.post('/', protect, async (req, res, next) => {
  try {
    const { address_id, payment_method } = req.body;

    if (!address_id || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Adres ve ödeme yöntemi gereklidir'
      });
    }

    // Kullanıcının sepetini getir
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        product_id,
        products (
          id,
          name,
          price,
          stock
        )
      `)
      .eq('user_id', req.user.id);

    if (cartError) {
      logger.error(`Sepet getirme hatası: ${cartError.message}`);
      return res.status(500).json({
        success: false,
        message: 'Sepet bilgileri alınamadı'
      });
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sepetiniz boş'
      });
    }

    // Stok kontrolü
    for (const item of cartItems) {
      if (item.quantity > item.products.stock) {
        return res.status(400).json({
          success: false,
          message: `${item.products.name} için yeterli stok yok`
        });
      }
    }

    // Toplam tutarı hesapla
    let totalAmount = 0;
    cartItems.forEach(item => {
      totalAmount += item.quantity * item.products.price;
    });

    // Supabase'de yeni sipariş oluştur
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          id: uuidv4(),
          user_id: req.user.id,
          total_amount: totalAmount,
          status: 'pending',
          payment_method,
          address_id
        }
      ])
      .select()
      .single();

    if (orderError) {
      logger.error(`Sipariş oluşturma hatası: ${orderError.message}`);
      return res.status(500).json({
        success: false,
        message: 'Sipariş oluşturulamadı'
      });
    }

    // Sipariş öğelerini ekle
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.products.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      logger.error(`Sipariş öğeleri ekleme hatası: ${itemsError.message}`);
      // Sipariş oluşturuldu ama öğeler eklenemedi, siparişi iptal et
      await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);

      return res.status(500).json({
        success: false,
        message: 'Sipariş öğeleri eklenemedi'
      });
    }

    // Stokları güncelle
    for (const item of cartItems) {
      await supabase
        .from('products')
        .update({ stock: item.products.stock - item.quantity })
        .eq('id', item.product_id);
    }

    // Sepeti temizle
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', req.user.id);

    logger.info(`Yeni sipariş oluşturuldu: ${order.id} - Kullanıcı: ${req.user.id}`);
    res.status(201).json({
      success: true,
      message: 'Sipariş başarıyla oluşturuldu',
      data: order
    });
  } catch (error) {
    logger.error(`Sipariş oluşturma işleminde hata: ${error.message}`);
    next(error);
  }
});

// Sipariş durumunu güncelle (admin yetkisi gerekli)
router.patch('/:id/status', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Durum değeri gereklidir'
      });
    }

    // Geçerli statü değerleri
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum değeri'
      });
    }

    // Siparişi güncelle
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      logger.error(`Sipariş durumu güncelleme hatası: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Sipariş durumu güncellenemedi'
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    logger.info(`Sipariş durumu güncellendi: ${orderId} - Yeni durum: ${status}`);
    res.status(200).json({
      success: true,
      message: 'Sipariş durumu başarıyla güncellendi',
      data
    });
  } catch (error) {
    logger.error(`Sipariş durumu güncelleme işleminde hata: ${error.message}`);
    next(error);
  }
});

// Tüm siparişleri getir (admin yetkisi gerekli)
router.get('/admin/all', protect, authorize('admin'), async (req, res, next) => {
  try {
    // Sayfalama parametreleri
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    // Supabase'den tüm siparişleri getir
    const { data, error, count } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        created_at,
        updated_at,
        user_id,
        users (
          name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(startIndex, startIndex + limit - 1);

    if (error) {
      logger.error(`Sipariş getirme hatası: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Siparişler alınamadı'
      });
    }

    res.status(200).json({
      success: true,
      count,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      },
      data
    });
  } catch (error) {
    logger.error(`Sipariş getirme işleminde hata: ${error.message}`);
    next(error);
  }
});

module.exports = router;