import { supabase } from '../../lib/supabase';
import logger from '../../utils/logger';

/**
 * Tüm kategorileri getirme
 */
export const getAllCategories = async () => {
  try {
    logger.info('Tüm kategoriler getiriliyor');
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      logger.error('Kategoriler getirilemedi', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info(`${data.length} adet kategori başarıyla getirildi`);
    return { success: true, data };
  } catch (error) {
    logger.error('Kategoriler getirme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Kategoriler getirilirken bir hata oluştu' 
    };
  }
};

/**
 * ID'ye göre kategori detayı alma
 * @param {string} id - Kategori ID
 */
export const getCategoryById = async (id) => {
  try {
    logger.info('Kategori detayı getiriliyor', { id });
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error('Kategori detayı getirilemedi', { error: error.message, id });
      return { success: false, error: error.message };
    }
    
    logger.info('Kategori detayı başarıyla getirildi', { id });
    return { success: true, data };
  } catch (error) {
    logger.error('Kategori detayı getirme hatası', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Kategori detayı getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Slug'a göre kategori detayı alma
 * @param {string} slug - Kategori slug
 */
export const getCategoryBySlug = async (slug) => {
  try {
    logger.info('Kategori slug ile getiriliyor', { slug });
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      logger.error('Kategori detayı getirilemedi', { error: error.message, slug });
      return { success: false, error: error.message };
    }
    
    logger.info('Kategori detayı başarıyla getirildi', { slug });
    return { success: true, data };
  } catch (error) {
    logger.error('Kategori detayı getirme hatası', { error: error.message, slug });
    return { 
      success: false, 
      error: error.message || 'Kategori detayı getirilirken bir hata oluştu' 
    };
  }
};

/**
 * Kategori ekleme (admin)
 * @param {object} categoryData - Eklenecek kategori bilgileri
 */
export const addCategory = async (categoryData) => {
  try {
    logger.info('Kategori ekleniyor', { name: categoryData.name });
    
    // Slug oluştur
    if (!categoryData.slug) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();
    
    if (error) {
      logger.error('Kategori eklenemedi', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info('Kategori başarıyla eklendi', { id: data.id, name: data.name });
    return { success: true, data };
  } catch (error) {
    logger.error('Kategori ekleme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Kategori eklenirken bir hata oluştu' 
    };
  }
};

/**
 * Kategori güncelleme (admin)
 * @param {string} id - Kategori ID
 * @param {object} categoryData - Güncellenecek kategori bilgileri
 */
export const updateCategory = async (id, categoryData) => {
  try {
    logger.info('Kategori güncelleniyor', { id, name: categoryData.name });
    
    // Slug güncelle
    if (categoryData.name && !categoryData.slug) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Kategori güncellenemedi', { error: error.message, id });
      return { success: false, error: error.message };
    }
    
    logger.info('Kategori başarıyla güncellendi', { id, name: data.name });
    return { success: true, data };
  } catch (error) {
    logger.error('Kategori güncelleme hatası', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Kategori güncellenirken bir hata oluştu' 
    };
  }
};

/**
 * Kategori silme (admin)
 * @param {string} id - Kategori ID
 */
export const deleteCategory = async (id) => {
  try {
    logger.info('Kategori siliniyor', { id });
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Kategori silinemedi', { error: error.message, id });
      return { success: false, error: error.message };
    }
    
    logger.info('Kategori başarıyla silindi', { id });
    return { success: true };
  } catch (error) {
    logger.error('Kategori silme hatası', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Kategori silinirken bir hata oluştu' 
    };
  }
}; 