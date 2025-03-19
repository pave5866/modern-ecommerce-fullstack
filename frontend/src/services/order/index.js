import { supabase } from '../../lib/supabase';
import logger from '../../utils/logger';

/**
 * Yeni sipariş oluşturma
 * @param {object} orderData - Sipariş bilgileri
 * @param {array} orderItems - Sipariş içindeki ürünler
 */
export const createOrder = async (orderData, orderItems) => {
  try {
    logger.info('Sipariş oluşturuluyor', { orderData });
    
    // Sipariş kaydını oluştur
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: orderData.user_id,
        total_amount: orderData.total_amount,
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address || orderData.shipping_address,
        payment_method: orderData.payment_method,
        payment_status: orderData.payment_status || 'pending',
        order_status: orderData.order_status || 'processing',
        notes: orderData.notes,
        coupon_code: orderData.coupon_code,
        discount_amount: orderData.discount_amount || 0,
        shipping_fee: orderData.shipping_fee || 0,
        tax_amount: orderData.tax_amount || 0,
        phone: orderData.phone,
        email: orderData.email
      })
      .select()
      .single();
    
    if (orderError) {
      logger.error('Sipariş oluşturma hatası', { error: orderError.message });
      return { success: false, error: orderError.message };
    }
    
    // Sipariş ürünlerini ekle
    const orderItemsToInsert = orderItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
      product_name: item.product_name,
      product_image: item.product_image
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);
    
    if (itemsError) {
      logger.error('Sipariş ürünleri ekleme hatası', { error: itemsError.message });
      return { success: false, error: itemsError.message };
    }
    
    // Ürün stoğunu güncelle
    for (const item of orderItems) {
      const { error: stockError } = await supabase.rpc('update_product_stock', {
        product_id: item.product_id,
        quantity: item.quantity
      });
      
      if (stockError) {
        logger.warn('Stok güncelleme hatası', { 
          error: stockError.message, 
          productId: item.product_id 
        });
      }
    }
    
    logger.info('Sipariş başarıyla oluşturuldu', { orderId: order.id });
    return { success: true, data: order };
  } catch (error) {
    logger.error('Sipariş oluşturma genel hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Sipariş oluşturulurken bir hata oluştu' 
    };
  }
};

/**
 * Kullanıcının siparişlerini getirme
 * @param {string} userId - Kullanıcı ID
 */
export const getUserOrders = async (userId) => {
  try {
    logger.info('Kullanıcı siparişleri getiriliyor', { userId });
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Kullanıcı siparişleri getirme hatası', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info(`${data.length} adet sipariş başarıyla getirildi`, { userId });
    return { success: true, data };
  } catch (error) {
    logger.error('Kullanıcı siparişleri getirme genel hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Siparişler getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Sipariş detaylarını getirme
 * @param {string} orderId - Sipariş ID
 */
export const getOrderDetails = async (orderId) => {
  try {
    logger.info('Sipariş detayları getiriliyor', { orderId });
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        )
      `)
      .eq('id', orderId)
      .single();
    
    if (error) {
      logger.error('Sipariş detayları getirme hatası', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info('Sipariş detayları başarıyla getirildi', { orderId });
    return { success: true, data };
  } catch (error) {
    logger.error('Sipariş detayları getirme genel hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Sipariş detayları getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Sipariş durumunu güncelleme (admin)
 * @param {string} orderId - Sipariş ID
 * @param {string} status - Yeni sipariş durumu
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    logger.info('Sipariş durumu güncelleniyor', { orderId, status });
    
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) {
      logger.error('Sipariş durumu güncelleme hatası', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info('Sipariş durumu başarıyla güncellendi', { orderId, status });
    return { success: true, data };
  } catch (error) {
    logger.error('Sipariş durumu güncelleme genel hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Sipariş durumu güncellenirken bir hata oluştu' 
    };
  }
};

/**
 * Ödeme durumunu güncelleme (admin)
 * @param {string} orderId - Sipariş ID
 * @param {string} status - Yeni ödeme durumu
 */
export const updatePaymentStatus = async (orderId, status) => {
  try {
    logger.info('Ödeme durumu güncelleniyor', { orderId, status });
    
    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status: status })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) {
      logger.error('Ödeme durumu güncelleme hatası', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info('Ödeme durumu başarıyla güncellendi', { orderId, status });
    return { success: true, data };
  } catch (error) {
    logger.error('Ödeme durumu güncelleme genel hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Ödeme durumu güncellenirken bir hata oluştu' 
    };
  }
};

/**
 * Tüm siparişleri getirme (admin)
 * @param {object} options - Filtreleme ve sayfalama seçenekleri
 */
export const getAllOrders = async (options = {}) => {
  try {
    logger.info('Tüm siparişler getiriliyor', options);
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        ),
        user:profiles (
          id, 
          email, 
          full_name
        )
      `);
    
    // Durum filtreleme
    if (options.status) {
      query = query.eq('order_status', options.status);
    }
    
    // Tarih aralığı
    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }
    
    // Sayfalama
    if (options.page && options.limit) {
      const from = (options.page - 1) * options.limit;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }
    
    // Sıralama
    if (options.sort) {
      const { field, direction } = options.sort;
      query = query.order(field, { ascending: direction === 'asc' });
    } else {
      // Varsayılan sıralama
      query = query.order('created_at', { ascending: false });
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      logger.error('Tüm siparişler getirme hatası', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info(`${data.length} adet sipariş başarıyla getirildi`);
    return { 
      success: true, 
      data, 
      meta: { 
        total: count || data.length 
      } 
    };
  } catch (error) {
    logger.error('Tüm siparişler getirme genel hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Siparişler getirilirken bir hata oluştu' 
    };
  }
}; 