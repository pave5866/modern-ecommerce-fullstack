import { supabase } from '../../lib/supabase';
import logger from '../../utils/logger';

/**
 * Kupon kodu doğrulama
 * @param {string} code - Kupon kodu
 * @param {number} cartTotal - Sepet toplam tutarı
 */
export const validateCoupon = async (code, cartTotal) => {
  try {
    logger.info('Kupon doğrulanıyor', { code, cartTotal });
    
    const currentDate = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', true)
      .lt('valid_from', currentDate)
      .gt('valid_until', currentDate)
      .single();
    
    if (error) {
      logger.warn('Kupon bulunamadı', { code });
      return { 
        success: false, 
        error: 'Geçersiz kupon kodu veya kupon süresi dolmuş' 
      };
    }
    
    // Minimum tutar kontrolü
    if (data.min_order_amount && cartTotal < data.min_order_amount) {
      logger.warn('Kupon için minimum sepet tutarı şartı sağlanmıyor', { 
        minAmount: data.min_order_amount, 
        cartTotal
      });
      
      return { 
        success: false, 
        error: `Bu kupon en az ${data.min_order_amount}₺ alışverişlerde geçerlidir` 
      };
    }
    
    // Kullanım limiti kontrolü
    if (data.usage_limit && data.usage_count >= data.usage_limit) {
      logger.warn('Kupon kullanım limiti dolmuş', { 
        usageCount: data.usage_count, 
        usageLimit: data.usage_limit
      });
      
      return { 
        success: false, 
        error: 'Bu kupon maksimum kullanım sayısına ulaşmış' 
      };
    }
    
    logger.info('Kupon doğrulama başarılı', { 
      couponId: data.id, 
      code, 
      discountType: data.discount_type, 
      discountAmount: data.discount_amount 
    });
    
    return { 
      success: true, 
      data: {
        id: data.id,
        code: data.code,
        discount_type: data.discount_type,
        discount_amount: data.discount_amount,
        min_order_amount: data.min_order_amount
      }
    };
  } catch (error) {
    logger.error('Kupon doğrulama hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Kupon doğrulanırken bir hata oluştu' 
    };
  }
};

/**
 * Kupon kullanım sayısını artırma
 * @param {string} id - Kupon ID
 */
export const incrementCouponUsage = async (id) => {
  try {
    logger.info('Kupon kullanım sayısı artırılıyor', { id });
    
    const { data, error } = await supabase
      .from('coupons')
      .update({
        usage_count: supabase.rpc('increment', { amount: 1, increment_field: 'usage_count' })
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Kupon kullanım sayısı artırılamadı', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info('Kupon kullanım sayısı artırıldı', { 
      id, 
      newCount: data.usage_count 
    });
    
    return { success: true };
  } catch (error) {
    logger.error('Kupon kullanım sayısı artırma hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Kupon kullanım sayısı artırılırken bir hata oluştu' 
    };
  }
};

/**
 * Tüm kuponları getirme (admin)
 */
export const getAllCoupons = async () => {
  try {
    logger.info('Tüm kuponlar getiriliyor');
    
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Kuponlar getirilemedi', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info(`${data.length} adet kupon başarıyla getirildi`);
    return { success: true, data };
  } catch (error) {
    logger.error('Kuponlar getirme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Kuponlar getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Kupon ekleme (admin)
 * @param {object} couponData - Eklenecek kupon bilgileri
 */
export const addCoupon = async (couponData) => {
  try {
    // Kupon kodunu büyük harfe çevir
    if (couponData.code) {
      couponData.code = couponData.code.trim().toUpperCase();
    }
    
    // Son kullanım tarihi belirtilmemişse bir yıl sonrasını ata
    if (!couponData.valid_until) {
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      couponData.valid_until = oneYearLater.toISOString();
    }
    
    // Kullanım sayısını sıfırla
    couponData.usage_count = 0;
    
    logger.info('Kupon ekleniyor', { code: couponData.code });
    
    const { data, error } = await supabase
      .from('coupons')
      .insert(couponData)
      .select()
      .single();
    
    if (error) {
      logger.error('Kupon eklenemedi', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info('Kupon başarıyla eklendi', { id: data.id, code: data.code });
    return { success: true, data };
  } catch (error) {
    logger.error('Kupon ekleme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Kupon eklenirken bir hata oluştu' 
    };
  }
};

/**
 * Kupon güncelleme (admin)
 * @param {string} id - Kupon ID
 * @param {object} couponData - Güncellenecek kupon bilgileri
 */
export const updateCoupon = async (id, couponData) => {
  try {
    // Kupon kodunu büyük harfe çevir
    if (couponData.code) {
      couponData.code = couponData.code.trim().toUpperCase();
    }
    
    logger.info('Kupon güncelleniyor', { id });
    
    const { data, error } = await supabase
      .from('coupons')
      .update(couponData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Kupon güncellenemedi', { error: error.message, id });
      return { success: false, error: error.message };
    }
    
    logger.info('Kupon başarıyla güncellendi', { id, code: data.code });
    return { success: true, data };
  } catch (error) {
    logger.error('Kupon güncelleme hatası', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Kupon güncellenirken bir hata oluştu' 
    };
  }
};

/**
 * Kupon silme (admin)
 * @param {string} id - Kupon ID
 */
export const deleteCoupon = async (id) => {
  try {
    logger.info('Kupon siliniyor', { id });
    
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Kupon silinemedi', { error: error.message, id });
      return { success: false, error: error.message };
    }
    
    logger.info('Kupon başarıyla silindi', { id });
    return { success: true };
  } catch (error) {
    logger.error('Kupon silme hatası', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Kupon silinirken bir hata oluştu' 
    };
  }
}; 