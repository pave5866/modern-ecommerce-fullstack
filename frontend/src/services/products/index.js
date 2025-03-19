import { supabase } from '../../lib/supabase';
import logger from '../../utils/logger';
import { slugify } from '../../utils/helper';

/**
 * Tüm ürünleri getirir
 * @param {object} options - Filtreleme ve sıralama seçenekleri
 * @returns {Promise<object>} Ürün listesi
 */
export const getAllProducts = async (options = {}) => {
  try {
    logger.info('Tüm ürünler getiriliyor', { options });
    
    const {
      page = 1,
      limit = 10,
      category = null,
      search = null,
      sort = 'created_at',
      order = 'desc',
      featured = null,
      minPrice = null,
      maxPrice = null,
    } = options;
    
    // Sayfalama için hesaplamalar
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Temel sorgu
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        reviews:reviews(id, rating)
      `, { count: 'exact' });
    
    // Filtreleme koşulları
    if (category) {
      // Kategori ID veya slug ile filtreleme
      const isId = !isNaN(parseInt(category));
      if (isId) {
        query = query.eq('category_id', parseInt(category));
      } else {
        // kategori slugı ile arama için kategori ID'sini önce bul
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', category)
          .single();
          
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }
    }
    
    // Arama filtresi
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    // Fiyat aralığı
    if (minPrice !== null) {
      query = query.gte('price', minPrice);
    }
    
    if (maxPrice !== null) {
      query = query.lte('price', maxPrice);
    }
    
    // Öne çıkan ürünler
    if (featured !== null) {
      query = query.eq('is_featured', featured);
    }
    
    // Sadece aktif/stokta olan ürünleri getir
    query = query.eq('is_active', true);
    
    // Sıralama
    query = query.order(sort, { ascending: order === 'asc' });
    
    // Sayfalama
    query = query.range(from, to);
    
    // Sorguyu çalıştır
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    // Ürünlerin formatını düzenle
    const formattedProducts = data.map(product => ({
      ...product,
      category: product.category, // Kategori bilgisi
      average_rating: calculateAverageRating(product.reviews || []),
      review_count: (product.reviews || []).length
    }));
    
    logger.info(`${count || 0} adet ürün bulundu`);
    
    return {
      success: true,
      data: formattedProducts,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: count ? Math.ceil(count / limit) : 0
      }
    };
  } catch (error) {
    logger.error('Ürünler getirilirken hata oluştu', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Ürünler getirilirken bir hata oluştu' 
    };
  }
};

/**
 * ID'ye göre ürün getirir
 * @param {string} id - Ürün ID'si
 * @returns {Promise<object>} Ürün bilgileri
 */
export const getProductById = async (id) => {
  try {
    logger.info('Ürün detayı getiriliyor', { id });
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        reviews:reviews(id, rating, content, created_at, user_id, 
          profiles:profiles(id, full_name, avatar_url))
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      logger.warn('Ürün bulunamadı', { id });
      return { success: false, error: 'Ürün bulunamadı' };
    }
    
    // Ortalama puanı hesapla
    const average_rating = calculateAverageRating(data.reviews || []);
    
    // Sadece onaylanmış yorumları al
    const approvedReviews = (data.reviews || []).filter(review => review.is_approved);
    
    logger.info('Ürün başarıyla getirildi', { id, name: data.name });
    
    return { 
      success: true, 
      data: {
        ...data,
        average_rating,
        reviews: approvedReviews,
        review_count: approvedReviews.length
      } 
    };
  } catch (error) {
    logger.error('Ürün getirilirken hata oluştu', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Ürün getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Slug'a göre ürün getirir
 * @param {string} slug - Ürün slug'ı
 * @returns {Promise<object>} Ürün bilgileri
 */
export const getProductBySlug = async (slug) => {
  try {
    logger.info('Ürün slug ile getiriliyor', { slug });
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        reviews:reviews(id, rating, content, created_at, user_id, 
          profiles:profiles(id, full_name, avatar_url))
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      logger.warn('Ürün bulunamadı', { slug });
      return { success: false, error: 'Ürün bulunamadı' };
    }
    
    // Ortalama puanı hesapla
    const average_rating = calculateAverageRating(data.reviews || []);
    
    // Sadece onaylanmış yorumları al
    const approvedReviews = (data.reviews || []).filter(review => review.is_approved);
    
    logger.info('Ürün başarıyla getirildi', { id: data.id, slug });
    
    return { 
      success: true, 
      data: {
        ...data,
        average_rating,
        reviews: approvedReviews,
        review_count: approvedReviews.length
      }
    };
  } catch (error) {
    logger.error('Ürün getirilirken hata oluştu', { error: error.message, slug });
    return { 
      success: false, 
      error: error.message || 'Ürün getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Yeni ürün ekler
 * @param {object} productData - Ürün bilgileri
 * @returns {Promise<object>} Eklenen ürün bilgileri
 */
export const addProduct = async (productData) => {
  try {
    logger.info('Yeni ürün ekleniyor', { name: productData.name });
    
    // Slug oluştur
    if (!productData.slug && productData.name) {
      productData.slug = slugify(productData.name);
    }
    
    // Ürünü ekle
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    logger.info('Ürün başarıyla eklendi', { id: data.id, name: data.name });
    return { success: true, data };
  } catch (error) {
    logger.error('Ürün eklenirken hata oluştu', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Ürün eklenirken bir hata oluştu' 
    };
  }
};

/**
 * Ürün günceller
 * @param {string} id - Ürün ID'si
 * @param {object} productData - Güncellenecek ürün bilgileri
 * @returns {Promise<object>} Güncellenen ürün bilgileri
 */
export const updateProduct = async (id, productData) => {
  try {
    logger.info('Ürün güncelleniyor', { id });
    
    // Slug güncelleme
    if (productData.name && !productData.slug) {
      productData.slug = slugify(productData.name);
    }
    
    // Ürünü güncelle
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    logger.info('Ürün başarıyla güncellendi', { id, name: data.name });
    return { success: true, data };
  } catch (error) {
    logger.error('Ürün güncellenirken hata oluştu', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Ürün güncellenirken bir hata oluştu' 
    };
  }
};

/**
 * Ürün siler
 * @param {string} id - Ürün ID'si
 * @returns {Promise<object>} İşlem sonucu
 */
export const deleteProduct = async (id) => {
  try {
    logger.info('Ürün siliniyor', { id });
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    logger.info('Ürün başarıyla silindi', { id });
    return { success: true };
  } catch (error) {
    logger.error('Ürün silinirken hata oluştu', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Ürün silinirken bir hata oluştu' 
    };
  }
};

/**
 * Ürünün aktiflik durumunu değiştirir
 * @param {string} id - Ürün ID'si
 * @param {boolean} isActive - Aktiflik durumu
 * @returns {Promise<object>} İşlem sonucu
 */
export const toggleProductActive = async (id, isActive) => {
  try {
    logger.info('Ürün durumu değiştiriliyor', { id, isActive });
    
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    logger.info('Ürün durumu başarıyla değiştirildi', { id, isActive });
    return { success: true, data };
  } catch (error) {
    logger.error('Ürün durumu değiştirilirken hata oluştu', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Ürün durumu değiştirilirken bir hata oluştu' 
    };
  }
};

/**
 * Ortalama puanı hesaplar
 * @param {Array} reviews - Yorumlar listesi
 * @returns {number} Ortalama puan
 */
const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  
  const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
  return totalRating / reviews.length;
}; 