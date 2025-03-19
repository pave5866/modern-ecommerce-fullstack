import { supabase } from '../../lib/supabase';
import logger from '../../utils/logger';

/**
 * Tüm ürünleri alma
 * @param {object} options - Sayfalama, sıralama vb. seçenekler
 */
export const getAllProducts = async (options = {}) => {
  try {
    logger.info('Tüm ürünler getiriliyor', options);
    
    let query = supabase
      .from('products')
      .select('*, categories(*)')
      .eq('is_active', true);
    
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
    
    // Filtreleme
    if (options.filters) {
      // Fiyat aralığı
      if (options.filters.priceMin) {
        query = query.gte('price', options.filters.priceMin);
      }
      if (options.filters.priceMax) {
        query = query.lte('price', options.filters.priceMax);
      }
      
      // Kategoriye göre filtreleme
      if (options.filters.category) {
        query = query.eq('category_id', options.filters.category);
      }
      
      // Stok durumuna göre filtreleme
      if (options.filters.inStock === true) {
        query = query.gt('stock', 0);
      }
      
      // Arama
      if (options.filters.search) {
        query = query.ilike('name', `%${options.filters.search}%`);
      }
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      logger.error('Ürünler getirilemedi', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info(`${data.length} ürün başarıyla getirildi`);
    return { 
      success: true, 
      data, 
      meta: { 
        total: count || data.length 
      } 
    };
  } catch (error) {
    logger.error('Ürünleri getirme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Ürünler getirilirken bir hata oluştu' 
    };
  }
};

/**
 * ID'ye göre ürün detayı alma
 * @param {string} id - Ürün ID'si
 */
export const getProductById = async (id) => {
  try {
    logger.info('Ürün detayı getiriliyor', { id });
    
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*), reviews(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error('Ürün detayı getirilemedi', { error: error.message, id });
      return { success: false, error: error.message };
    }
    
    logger.info('Ürün detayı başarıyla getirildi', { id });
    return { success: true, data };
  } catch (error) {
    logger.error('Ürün detayı getirme hatası', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Ürün detayı getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Slug'a göre ürün detayı alma
 * @param {string} slug - Ürün slug'ı
 */
export const getProductBySlug = async (slug) => {
  try {
    logger.info('Ürün detayı slug ile getiriliyor', { slug });
    
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*), reviews(*)')
      .eq('slug', slug)
      .single();
    
    if (error) {
      logger.error('Ürün detayı getirilemedi', { error: error.message, slug });
      return { success: false, error: error.message };
    }
    
    logger.info('Ürün detayı başarıyla getirildi', { slug });
    return { success: true, data };
  } catch (error) {
    logger.error('Ürün detayı getirme hatası', { error: error.message, slug });
    return { 
      success: false, 
      error: error.message || 'Ürün detayı getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Kategoriye göre ürünleri alma
 * @param {string} categoryId - Kategori ID'si
 * @param {object} options - Sayfalama, sıralama vb. seçenekler
 */
export const getProductsByCategory = async (categoryId, options = {}) => {
  try {
    logger.info('Kategoriye göre ürünler getiriliyor', { categoryId, ...options });
    
    let query = supabase
      .from('products')
      .select('*, categories(*)')
      .eq('category_id', categoryId)
      .eq('is_active', true);
    
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
      logger.error('Kategoriye göre ürünler getirilemedi', { error: error.message, categoryId });
      return { success: false, error: error.message };
    }
    
    logger.info(`${data.length} ürün başarıyla getirildi`, { categoryId });
    return { 
      success: true, 
      data, 
      meta: { 
        total: count || data.length 
      } 
    };
  } catch (error) {
    logger.error('Kategoriye göre ürünleri getirme hatası', { error: error.message, categoryId });
    return { 
      success: false, 
      error: error.message || 'Ürünler getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Ürün ekleme (admin)
 * @param {object} productData - Eklenecek ürün bilgileri
 */
export const addProduct = async (productData) => {
  try {
    logger.info('Ürün ekleniyor', { name: productData.name });
    
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    
    if (error) {
      logger.error('Ürün eklenemedi', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info('Ürün başarıyla eklendi', { id: data.id, name: data.name });
    return { success: true, data };
  } catch (error) {
    logger.error('Ürün ekleme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Ürün eklenirken bir hata oluştu' 
    };
  }
};

/**
 * Ürün güncelleme (admin)
 * @param {string} id - Ürün ID'si
 * @param {object} productData - Güncellenecek ürün bilgileri
 */
export const updateProduct = async (id, productData) => {
  try {
    logger.info('Ürün güncelleniyor', { id, name: productData.name });
    
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Ürün güncellenemedi', { error: error.message, id });
      return { success: false, error: error.message };
    }
    
    logger.info('Ürün başarıyla güncellendi', { id, name: data.name });
    return { success: true, data };
  } catch (error) {
    logger.error('Ürün güncelleme hatası', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Ürün güncellenirken bir hata oluştu' 
    };
  }
};

/**
 * Ürün silme (admin)
 * @param {string} id - Ürün ID'si
 */
export const deleteProduct = async (id) => {
  try {
    logger.info('Ürün siliniyor', { id });
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Ürün silinemedi', { error: error.message, id });
      return { success: false, error: error.message };
    }
    
    logger.info('Ürün başarıyla silindi', { id });
    return { success: true };
  } catch (error) {
    logger.error('Ürün silme hatası', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Ürün silinirken bir hata oluştu' 
    };
  }
}; 