import { supabase } from '../../lib/supabase';
import logger from '../../utils/logger';

/**
 * Ürüne ait değerlendirmeleri getirme
 * @param {string} productId - Ürün ID
 */
export const getProductReviews = async (productId) => {
  try {
    logger.info('Ürün değerlendirmeleri getiriliyor', { productId });
    
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url)
      `)
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Değerlendirmeler getirilemedi', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info(`${data.length} adet değerlendirme başarıyla getirildi`, { productId });
    return { success: true, data };
  } catch (error) {
    logger.error('Değerlendirme getirme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Değerlendirmeler getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Kullanıcıya ait değerlendirmeleri getirme
 * @param {string} userId - Kullanıcı ID (belirtilmezse mevcut oturum açmış kullanıcı)
 */
export const getUserReviews = async (userId) => {
  try {
    // ID belirtilmemişse mevcut kullanıcıyı kontrol et
    if (!userId) {
      const { data: authData } = await supabase.auth.getUser();
      userId = authData?.user?.id;
      
      if (!userId) {
        return { 
          success: false, 
          error: 'Oturum açmış kullanıcı bulunamadı' 
        };
      }
    }
    
    logger.info('Kullanıcı değerlendirmeleri getiriliyor', { userId });
    
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        product:products(id, name, slug, thumbnail)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Değerlendirmeler getirilemedi', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info(`${data.length} adet değerlendirme başarıyla getirildi`, { userId });
    return { success: true, data };
  } catch (error) {
    logger.error('Değerlendirme getirme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Değerlendirmeler getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Yeni değerlendirme ekleme
 * @param {object} reviewData - Eklenecek değerlendirme bilgileri
 */
export const addReview = async (reviewData) => {
  try {
    // Kullanıcı ID kontrol et
    if (!reviewData.user_id) {
      const { data: authData } = await supabase.auth.getUser();
      reviewData.user_id = authData?.user?.id;
      
      if (!reviewData.user_id) {
        return { 
          success: false, 
          error: 'Oturum açmış kullanıcı bulunamadı' 
        };
      }
    }
    
    logger.info('Yeni değerlendirme ekleniyor', { 
      productId: reviewData.product_id, 
      userId: reviewData.user_id 
    });
    
    // Kullanıcının aynı ürün için daha önce değerlendirme yapıp yapmadığını kontrol et
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', reviewData.user_id)
      .eq('product_id', reviewData.product_id)
      .maybeSingle();
    
    if (checkError) {
      logger.error('Mevcut değerlendirme kontrolü hatası', { error: checkError.message });
      return { success: false, error: checkError.message };
    }
    
    if (existingReview) {
      return { 
        success: false, 
        error: 'Bu ürün için daha önce değerlendirme yapmışsınız' 
      };
    }
    
    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .single();
    
    if (error) {
      logger.error('Değerlendirme eklenemedi', { error: error.message });
      return { success: false, error: error.message };
    }
    
    // Ürünün ortalama puanını güncelle
    await updateProductAverageRating(reviewData.product_id);
    
    logger.info('Değerlendirme başarıyla eklendi', { reviewId: data.id });
    return { success: true, data };
  } catch (error) {
    logger.error('Değerlendirme ekleme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Değerlendirme eklenirken bir hata oluştu' 
    };
  }
};

/**
 * Değerlendirme güncelleme
 * @param {string} id - Değerlendirme ID
 * @param {object} reviewData - Güncellenecek değerlendirme bilgileri
 */
export const updateReview = async (id, reviewData) => {
  try {
    logger.info('Değerlendirme güncelleniyor', { id });
    
    const { data, error } = await supabase
      .from('reviews')
      .update(reviewData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Değerlendirme güncellenemedi', { error: error.message, id });
      return { success: false, error: error.message };
    }
    
    // Ürünün ortalama puanını güncelle
    await updateProductAverageRating(data.product_id);
    
    logger.info('Değerlendirme başarıyla güncellendi', { id });
    return { success: true, data };
  } catch (error) {
    logger.error('Değerlendirme güncelleme hatası', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Değerlendirme güncellenirken bir hata oluştu' 
    };
  }
};

/**
 * Değerlendirme silme
 * @param {string} id - Değerlendirme ID
 */
export const deleteReview = async (id) => {
  try {
    logger.info('Değerlendirme siliniyor', { id });
    
    // Önce ürün ID'yi al
    const { data: review } = await supabase
      .from('reviews')
      .select('product_id')
      .eq('id', id)
      .single();
    
    const productId = review?.product_id;
    
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Değerlendirme silinemedi', { error: error.message, id });
      return { success: false, error: error.message };
    }
    
    // Ürünün ortalama puanını güncelle
    if (productId) {
      await updateProductAverageRating(productId);
    }
    
    logger.info('Değerlendirme başarıyla silindi', { id });
    return { success: true };
  } catch (error) {
    logger.error('Değerlendirme silme hatası', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Değerlendirme silinirken bir hata oluştu' 
    };
  }
};

/**
 * Ürünün ortalama değerlendirme puanını güncelleme
 * @param {string} productId - Ürün ID
 */
export const updateProductAverageRating = async (productId) => {
  try {
    logger.info('Ürün ortalama puanı güncelleniyor', { productId });
    
    // Ürünün tüm değerlendirmelerini getir
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_approved', true);
    
    if (error) {
      logger.error('Ürün değerlendirmeleri getirilemedi', { error: error.message });
      throw error;
    }
    
    // Ortalama puan ve değerlendirme sayısı
    let averageRating = 0;
    const reviewCount = reviews.length;
    
    if (reviewCount > 0) {
      const sum = reviews.reduce((total, review) => total + review.rating, 0);
      averageRating = sum / reviewCount;
    }
    
    // Ürünü güncelle
    const { error: updateError } = await supabase
      .from('products')
      .update({
        average_rating: parseFloat(averageRating.toFixed(1)),
        review_count: reviewCount
      })
      .eq('id', productId);
    
    if (updateError) {
      logger.error('Ürün ortalama puanı güncellenemedi', { error: updateError.message });
      throw updateError;
    }
    
    logger.info('Ürün ortalama puanı başarıyla güncellendi', { 
      productId, 
      averageRating: parseFloat(averageRating.toFixed(1)), 
      reviewCount 
    });
    
    return true;
  } catch (error) {
    logger.error('Ürün ortalama puanı güncelleme hatası', { error: error.message });
    return false;
  }
}; 