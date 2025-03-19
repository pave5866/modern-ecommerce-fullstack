const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');

// Kullanıcının sepetini getir
router.get('/', protect, async (req, res, next) => {
  try {
    // Supabase'den kullanıcının sepetini getir
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        product_id,
        products (
          id,
          name,
          price,
          image_url,
          stock
        )
      `)
      .eq('user_id', req.user.id);

    if (error) {
      logger.error(`Sepet getirme hatası: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Sepet bilgileri alınamadı'
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error(`Sepet getirme işleminde hata: ${error.message}`);
    next(error);
  }
});

// Sepete ürün ekle
router.post('/', protect, async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Ürün ID ve miktar gereklidir'
      });
    }

    // Önce ürünün mevcut olup olmadığını kontrol et
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      logger.error(`Ürün bulunamadı: ${product_id}`);
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    // Stok kontrolü
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Yeterli stok yok'
      });
    }

    // Sepette aynı ürün var mı kontrol et
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('product_id', product_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error(`Sepet kontrolü hatası: ${checkError.message}`);
      return res.status(500).json({
        success: false,
        message: 'Sepet kontrolü yapılamadı'
      });
    }

    let result;
    if (existingItem) {
      // Mevcut ürünün miktarını güncelle
      const newQuantity = existingItem.quantity + quantity;
      result = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();
    } else {
      // Yeni sepet öğesi ekle
      result = await supabase
        .from('cart_items')
        .insert([
          {
            user_id: req.user.id,
            product_id,
            quantity
          }
        ])
        .select()
        .single();
    }

    if (result.error) {
      logger.error(`Sepete ekleme hatası: ${result.error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Ürün sepete eklenemedi'
      });
    }

    logger.info(`Ürün sepete eklendi: ${product_id} (${quantity} adet) - Kullanıcı: ${req.user.id}`);
    res.status(201).json({
      success: true,
      message: 'Ürün başarıyla sepete eklendi',
      data: result.data
    });
  } catch (error) {
    logger.error(`Sepete ekleme işleminde hata: ${error.message}`);
    next(error);
  }
});

// Sepetteki bir ürünün miktarını güncelle
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cartItemId = req.params.id;

    if (!quantity) {
      return res.status(400).json({
        success: false,
        message: 'Miktar gereklidir'
      });
    }

    // Sepet öğesinin kullanıcıya ait olup olmadığını kontrol et
    const { data: cartItem, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', cartItemId)
      .eq('user_id', req.user.id)
      .single();

    if (checkError || !cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Sepet öğesi bulunamadı'
      });
    }

    // Stok kontrolü
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', cartItem.product_id)
      .single();

    if (productError || !product) {
      logger.error(`Ürün bulunamadı: ${cartItem.product_id}`);
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Yeterli stok yok'
      });
    }

    // Miktarı güncelle
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) {
      logger.error(`Sepet güncelleme hatası: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Sepet güncellenemedi'
      });
    }

    logger.info(`Sepet öğesi güncellendi: ${cartItemId} - Yeni miktar: ${quantity}`);
    res.status(200).json({
      success: true,
      message: 'Sepet başarıyla güncellendi',
      data
    });
  } catch (error) {
    logger.error(`Sepet güncelleme işleminde hata: ${error.message}`);
    next(error);
  }
});

// Sepetten ürün kaldır
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const cartItemId = req.params.id;

    // Sepet öğesinin kullanıcıya ait olup olmadığını kontrol et
    const { data: cartItem, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', cartItemId)
      .eq('user_id', req.user.id)
      .single();

    if (checkError || !cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Sepet öğesi bulunamadı'
      });
    }

    // Sepet öğesini sil
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) {
      logger.error(`Sepetten öğe silme hatası: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Sepetten ürün kaldırılamadı'
      });
    }

    logger.info(`Sepet öğesi silindi: ${cartItemId}`);
    res.status(200).json({
      success: true,
      message: 'Ürün sepetten kaldırıldı'
    });
  } catch (error) {
    logger.error(`Sepetten öğe kaldırma işleminde hata: ${error.message}`);
    next(error);
  }
});

// Sepeti boşalt
router.delete('/', protect, async (req, res, next) => {
  try {
    // Kullanıcının tüm sepet öğelerini sil
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', req.user.id);

    if (error) {
      logger.error(`Sepet boşaltma hatası: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Sepet boşaltılamadı'
      });
    }

    logger.info(`Kullanıcı sepeti boşaltıldı: ${req.user.id}`);
    res.status(200).json({
      success: true,
      message: 'Sepet başarıyla boşaltıldı'
    });
  } catch (error) {
    logger.error(`Sepet boşaltma işleminde hata: ${error.message}`);
    next(error);
  }
});

module.exports = router;