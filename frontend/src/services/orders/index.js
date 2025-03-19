import { supabase } from '../../lib/supabase';
import logger from '../../utils/logger';

/**
 * Sipariş oluşturur
 * @param {object} orderData - Sipariş bilgileri
 * @returns {Promise<object>} İşlem sonucu
 */
export const createOrder = async (orderData) => {
  try {
    logger.info('Sipariş oluşturuluyor', { userId: orderData.user_id });
    
    const orderItems = orderData.items || [];
    
    // Sipariş ana bilgilerini kaydet
    const orderToInsert = {
      user_id: orderData.user_id,
      status: orderData.status || 'pending',
      total_amount: orderData.total_amount,
      shipping_address_id: orderData.shipping_address_id,
      payment_method: orderData.payment_method,
      coupon_id: orderData.coupon_id || null,
      discount_amount: orderData.discount_amount || 0,
      shipping_fee: orderData.shipping_fee || 0,
      notes: orderData.notes || '',
    };
    
    // Siparişi oluştur
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderToInsert)
      .select()
      .single();
    
    if (orderError) {
      throw orderError;
    }
    
    // Sipariş ürünlerini kaydet
    if (orderItems.length > 0) {
      const items = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total: item.total || (item.price * item.quantity)
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(items);
      
      if (itemsError) {
        // Ürün eklemede hata olursa siparişi sil
        logger.error('Sipariş ürünleri kaydedilirken hata oluştu, sipariş iptal ediliyor', {
          error: itemsError.message,
          orderId: order.id
        });
        
        await supabase
          .from('orders')
          .delete()
          .eq('id', order.id);
        
        throw itemsError;
      }
      
      // Sipariş ürünlerini ilişkilendirerek getir
      const { data: fullOrder, error: fullOrderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(*)
        `)
        .eq('id', order.id)
        .single();
      
      if (fullOrderError) {
        logger.warn('Sipariş oluşturuldu ancak ilişkili veriler getirilemedi', { 
          error: fullOrderError.message, 
          orderId: order.id 
        });
        
        return { success: true, data: order, items };
      }
      
      logger.info('Sipariş başarıyla oluşturuldu', { 
        orderId: order.id, 
        itemCount: items.length 
      });
      
      return { success: true, data: fullOrder };
    }
    
    logger.info('Sipariş başarıyla oluşturuldu (ürünsüz)', { orderId: order.id });
    return { success: true, data: order };
  } catch (error) {
    logger.error('Sipariş oluşturulurken hata oluştu', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Sipariş oluşturulurken bir hata oluştu' 
    };
  }
};

/**
 * Kullanıcının siparişlerini getirir
 * @param {string} userId - Kullanıcı ID'si
 * @param {object} options - Filtreleme ve sıralama seçenekleri
 * @returns {Promise<object>} Sipariş listesi
 */
export const getUserOrders = async (userId, options = {}) => {
  try {
    if (!userId) {
      throw new Error('Kullanıcı ID gereklidir');
    }
    
    logger.info('Kullanıcı siparişleri getiriliyor', { userId });
    
    const {
      page = 1,
      limit = 10,
      status = null,
      sort = 'created_at',
      order = 'desc',
    } = options;
    
    // Sayfalama için hesaplamalar
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Temel sorgu
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(
          id, 
          quantity, 
          price, 
          total,
          product:products(id, name, slug, image_url)
        )
      `, { count: 'exact' })
      .eq('user_id', userId);
    
    // Durum filtresi
    if (status) {
      query = query.eq('status', status);
    }
    
    // Sıralama
    query = query.order(sort, { ascending: order === 'asc' });
    
    // Sayfalama
    query = query.range(from, to);
    
    // Sorguyu çalıştır
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    logger.info(`${count || 0} adet sipariş bulundu`, { userId });
    
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: count ? Math.ceil(count / limit) : 0
      }
    };
  } catch (error) {
    logger.error('Siparişler getirilirken hata oluştu', { error: error.message, userId });
    return { 
      success: false, 
      error: error.message || 'Siparişler getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Sipariş detayını getirir
 * @param {string} orderId - Sipariş ID'si
 * @param {string} userId - Kullanıcı ID'si (güvenlik kontrolü için)
 * @returns {Promise<object>} Sipariş detayı
 */
export const getOrderById = async (orderId, userId = null) => {
  try {
    logger.info('Sipariş detayı getiriliyor', { orderId });
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(
          id, 
          quantity, 
          price, 
          total,
          product:products(id, name, slug, image_url, description)
        ),
        shipping_address:addresses(*)
      `)
      .eq('id', orderId);
    
    // Kullanıcı ID verilmişse güvenlik kontrolü yap
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      logger.warn('Sipariş bulunamadı', { orderId, userId });
      return { success: false, error: 'Sipariş bulunamadı' };
    }
    
    logger.info('Sipariş detayı başarıyla getirildi', { orderId });
    
    return { success: true, data };
  } catch (error) {
    logger.error('Sipariş detayı getirilirken hata oluştu', { error: error.message, orderId });
    return { 
      success: false, 
      error: error.message || 'Sipariş detayı getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Sipariş durumunu günceller
 * @param {string} orderId - Sipariş ID'si
 * @param {string} status - Yeni durum
 * @returns {Promise<object>} İşlem sonucu
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    logger.info('Sipariş durumu güncelleniyor', { orderId, status });
    
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
      throw error;
    }
    
    logger.info('Sipariş durumu başarıyla güncellendi', { orderId, status });
    
    return { success: true, data };
  } catch (error) {
    logger.error('Sipariş durumu güncellenirken hata oluştu', { error: error.message, orderId });
    return { 
      success: false, 
      error: error.message || 'Sipariş durumu güncellenirken bir hata oluştu' 
    };
  }
};

/**
 * Tüm siparişleri getirir (admin)
 * @param {object} options - Filtreleme ve sıralama seçenekleri
 * @returns {Promise<object>} Sipariş listesi
 */
export const getAllOrders = async (options = {}) => {
  try {
    logger.info('Tüm siparişler getiriliyor', { options });
    
    const {
      page = 1,
      limit = 10,
      status = null,
      sort = 'created_at',
      order = 'desc',
      userId = null,
    } = options;
    
    // Sayfalama için hesaplamalar
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Temel sorgu
    let query = supabase
      .from('orders')
      .select(`
        *,
        user:profiles!user_id(id, full_name, email),
        order_items:order_items(id, quantity, price, total)
      `, { count: 'exact' });
    
    // Durum filtresi
    if (status) {
      query = query.eq('status', status);
    }
    
    // Kullanıcı filtresi
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // Sıralama
    query = query.order(sort, { ascending: order === 'asc' });
    
    // Sayfalama
    query = query.range(from, to);
    
    // Sorguyu çalıştır
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    logger.info(`${count || 0} adet sipariş bulundu`);
    
    // Sipariş ürün sayılarını ekle
    const formattedOrders = data.map(order => ({
      ...order,
      item_count: order.order_items ? order.order_items.length : 0
    }));
    
    return {
      success: true,
      data: formattedOrders,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: count ? Math.ceil(count / limit) : 0
      }
    };
  } catch (error) {
    logger.error('Siparişler getirilirken hata oluştu', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Siparişler getirilirken bir hata oluştu' 
    };
  }
}; 