import { supabase } from '../../lib/supabase';
import logger from '../../utils/logger';

// Rastgele dosya adı oluşturma fonksiyonu
const generateFileName = (originalName) => {
  const extension = originalName.split('.').pop();
  const randomString = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();
  return `${randomString}_${timestamp}.${extension}`;
};

/**
 * Tek dosya yükleme
 * @param {File} file - Yüklenecek dosya
 * @param {string} folder - Depolama klasörü
 */
export const uploadImage = async (file, folder = 'products') => {
  try {
    logger.info('Resim yükleme başlatıldı', { 
      fileName: file.name, 
      size: file.size, 
      type: file.type,
      folder
    });

    // Dosya adını oluştur
    const fileName = generateFileName(file.name);
    const filePath = `${folder}/${fileName}`;
    
    // Dosyayı yükle
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      logger.error('Resim yükleme hatası', { error: error.message });
      return { success: false, error: error.message };
    }
    
    // Public URL oluştur
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);
    
    logger.info('Resim yükleme başarılı', { path: filePath });
    
    return { 
      success: true, 
      data: {
        publicUrl: urlData.publicUrl,
        path: filePath,
        fileName
      }
    };
  } catch (error) {
    logger.error('Resim yükleme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Resim yüklenirken bir hata oluştu' 
    };
  }
};

/**
 * Çoklu dosya yükleme
 * @param {Array<File>} files - Yüklenecek dosyalar
 * @param {string} folder - Depolama klasörü
 */
export const uploadMultipleImages = async (files, folder = 'products') => {
  try {
    logger.info('Çoklu resim yükleme başlatıldı', { fileCount: files.length, folder });
    
    const uploadPromises = Array.from(files).map(file => uploadImage(file, folder));
    const results = await Promise.all(uploadPromises);
    
    const successResults = results.filter(result => result.success);
    const errorResults = results.filter(result => !result.success);
    
    logger.info('Çoklu resim yükleme tamamlandı', { 
      success: successResults.length, 
      failed: errorResults.length 
    });
    
    return {
      success: errorResults.length === 0,
      data: {
        images: successResults.map(r => r.data),
        urls: successResults.map(r => r.data.publicUrl),
        errors: errorResults.map(r => r.error)
      }
    };
  } catch (error) {
    logger.error('Çoklu resim yükleme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Resimler yüklenirken bir hata oluştu' 
    };
  }
};

/**
 * Base64 resim yükleme
 * @param {string} base64String - Base64 formatında resim
 * @param {string} fileName - Dosya adı
 * @param {string} folder - Depolama klasörü
 */
export const uploadBase64Image = async (base64String, fileName = null, folder = 'products') => {
  try {
    logger.info('Base64 resim yükleme başlatıldı', { folder });
    
    // Base64 formatını kontrol et
    if (!base64String.startsWith('data:image')) {
      throw new Error('Geçersiz base64 formatı');
    }
    
    // Base64'ü blob'a çevir
    const res = await fetch(base64String);
    const blob = await res.blob();
    
    // Dosya adını oluştur
    const name = fileName || 'base64_image_' + Date.now();
    const fileExt = base64String.substring(
      base64String.indexOf('/') + 1, 
      base64String.indexOf(';')
    );
    const fullFileName = `${name}.${fileExt}`;
    
    // File nesnesine dönüştür
    const file = new File([blob], fullFileName, { type: `image/${fileExt}` });
    
    // Normal yükleme fonksiyonunu kullan
    return await uploadImage(file, folder);
  } catch (error) {
    logger.error('Base64 resim yükleme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Base64 resim yüklenirken bir hata oluştu' 
    };
  }
};

/**
 * URL'den resim yükleme
 * @param {string} url - Resim URL'i
 * @param {string} folder - Depolama klasörü
 */
export const uploadImageFromUrl = async (url, folder = 'products') => {
  try {
    logger.info('URL\'den resim yükleme başlatıldı', { url, folder });
    
    // URL'den resmi fetch et
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`URL'den resim yüklenemedi: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('URL bir resme ait değil');
    }
    
    const blob = await response.blob();
    
    // Dosya adını oluştur
    const fileName = `url_image_${Date.now()}.${contentType.split('/')[1]}`;
    
    // File nesnesine dönüştür
    const file = new File([blob], fileName, { type: contentType });
    
    // Normal yükleme fonksiyonunu kullan
    return await uploadImage(file, folder);
  } catch (error) {
    logger.error('URL\'den resim yükleme hatası', { error: error.message, url });
    return { 
      success: false, 
      error: error.message || 'URL\'den resim yüklenirken bir hata oluştu' 
    };
  }
};

/**
 * Resim silme
 * @param {string} path - Silinecek resim yolu
 */
export const deleteImage = async (path) => {
  try {
    logger.info('Resim silme işlemi başlatıldı', { path });
    
    // Tam path verilmediyse, 'products/' önekini ekle
    if (!path.includes('/')) {
      path = `products/${path}`;
    }
    
    const { error } = await supabase.storage
      .from('products')
      .remove([path]);
    
    if (error) {
      logger.error('Resim silme hatası', { error: error.message, path });
      return { success: false, error: error.message };
    }
    
    logger.info('Resim başarıyla silindi', { path });
    return { success: true };
  } catch (error) {
    logger.error('Resim silme hatası', { error: error.message, path });
    return { 
      success: false, 
      error: error.message || 'Resim silinirken bir hata oluştu' 
    };
  }
};

/**
 * Ürün resmi yükler
 * @param {File} file - Yüklenecek dosya
 * @returns {Promise<object>} Yükleme sonucu
 */
export const uploadProductImage = async (file) => {
  try {
    if (!file) {
      throw new Error('Dosya bulunamadı');
    }
    
    logger.info('Ürün resmi yükleniyor', { fileName: file.name, fileSize: file.size });
    
    // Dosya adını oluştur
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `products/${fileName}`;
    
    // Dosyayı yükle
    const { data, error } = await supabase
      .storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    // Dosya URL'ini al
    const publicUrl = supabase
      .storage
      .from('products')
      .getPublicUrl(data.path).data.publicUrl;
    
    logger.info('Ürün resmi başarıyla yüklendi', { path: data.path, url: publicUrl });
    
    return { 
      success: true, 
      data: {
        fileName: data.path,
        filePath: data.path,
        fileUrl: publicUrl,
        fileSize: file.size
      }
    };
  } catch (error) {
    logger.error('Ürün resmi yüklenirken hata oluştu', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Dosya yüklenirken bir hata oluştu' 
    };
  }
};

/**
 * Birden fazla ürün resmi yükler
 * @param {Array<File>} files - Yüklenecek dosyalar
 * @returns {Promise<object>} Yükleme sonucu
 */
export const uploadMultipleProductImages = async (files) => {
  try {
    if (!files || files.length === 0) {
      throw new Error('Dosya bulunamadı');
    }
    
    logger.info('Çoklu ürün resimleri yükleniyor', { fileCount: files.length });
    
    const uploadPromises = Array.from(files).map(file => uploadProductImage(file));
    const results = await Promise.all(uploadPromises);
    
    const failedUploads = results.filter(result => !result.success);
    if (failedUploads.length > 0) {
      logger.warn('Bazı dosyalar yüklenemedi', { failedCount: failedUploads.length });
    }
    
    const uploadedFiles = results
      .filter(result => result.success)
      .map(result => result.data);
    
    logger.info('Çoklu ürün resimleri başarıyla yüklendi', { 
      successCount: uploadedFiles.length,
      failCount: failedUploads.length
    });
    
    return { 
      success: true, 
      data: uploadedFiles,
      failedCount: failedUploads.length
    };
  } catch (error) {
    logger.error('Çoklu ürün resimleri yüklenirken hata oluştu', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Dosyalar yüklenirken bir hata oluştu' 
    };
  }
};

/**
 * Kullanıcı profil resmi yükler
 * @param {File} file - Yüklenecek dosya
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<object>} Yükleme sonucu
 */
export const uploadProfileImage = async (file, userId) => {
  try {
    if (!file) {
      throw new Error('Dosya bulunamadı');
    }
    
    if (!userId) {
      throw new Error('Kullanıcı ID bulunamadı');
    }
    
    logger.info('Profil resmi yükleniyor', { userId, fileName: file.name });
    
    // Dosya adını oluştur
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${userId}.${fileExt}`;
    const filePath = `profiles/${fileName}`;
    
    // Dosyayı yükle
    const { data, error } = await supabase
      .storage
      .from('profiles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Varolan dosyanın üzerine yaz
      });
    
    if (error) {
      throw error;
    }
    
    // Dosya URL'ini al
    const publicUrl = supabase
      .storage
      .from('profiles')
      .getPublicUrl(data.path).data.publicUrl;
    
    logger.info('Profil resmi başarıyla yüklendi', { userId, path: data.path });
    
    return { 
      success: true, 
      data: {
        fileName,
        filePath: data.path,
        fileUrl: publicUrl,
        fileSize: file.size
      }
    };
  } catch (error) {
    logger.error('Profil resmi yüklenirken hata oluştu', { error: error.message, userId });
    return { 
      success: false, 
      error: error.message || 'Profil resmi yüklenirken bir hata oluştu' 
    };
  }
};

/**
 * Dosya siler
 * @param {string} path - Dosya yolu
 * @param {string} bucketName - Bucket adı
 * @returns {Promise<object>} Silme sonucu
 */
export const deleteFile = async (path, bucketName = 'products') => {
  try {
    if (!path) {
      throw new Error('Dosya yolu bulunamadı');
    }
    
    logger.info('Dosya siliniyor', { path, bucket: bucketName });
    
    // Dosya adını çıkar (tam yol verilmişse)
    const fileName = path.includes('/') ? path.split('/').pop() : path;
    
    // Dosyayı sil
    const { error } = await supabase
      .storage
      .from(bucketName)
      .remove([fileName]);
    
    if (error) {
      throw error;
    }
    
    logger.info('Dosya başarıyla silindi', { path, bucket: bucketName });
    
    return { success: true };
  } catch (error) {
    logger.error('Dosya silinirken hata oluştu', { error: error.message, path });
    return { 
      success: false, 
      error: error.message || 'Dosya silinirken bir hata oluştu' 
    };
  }
}; 