import api from '../api';
import logger from '../logger';

/**
 * Upload API servisi - Resim yükleme işlemleri için
 */
const uploadAPI = {
  /**
   * Tekli resim yükleme
   * @param {File} file - Yüklenecek resim dosyası
   * @returns {Promise<Object>} - Yüklenen resmin bilgileri
   */
  uploadImage: async (file) => {
    try {
      logger.info(`Resim yükleniyor: ${file.name}`);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post('/api/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      logger.info('Resim başarıyla yüklendi');
      return response.data;
    } catch (error) {
      logger.error('Resim yükleme hatası:', error);
      throw error;
    }
  },

  /**
   * Çoklu resim yükleme
   * @param {Array<File>} files - Yüklenecek resim dosyaları
   * @returns {Promise<Object>} - Yüklenen resimlerin bilgileri
   */
  uploadImages: async (files) => {
    try {
      logger.info(`${files.length} adet resim yükleniyor`);
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      
      const response = await api.post('/api/uploads/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      logger.info(`${response.data.images.length} adet resim başarıyla yüklendi`);
      return response.data;
    } catch (error) {
      logger.error('Çoklu resim yükleme hatası:', error);
      throw error;
    }
  },

  /**
   * Base64 formatında resim yükleme
   * @param {string} base64Image - Base64 formatında resim verisi
   * @returns {Promise<Object>} - Yüklenen resmin bilgileri
   */
  uploadBase64Image: async (base64Image) => {
    try {
      logger.info('Base64 formatında resim yükleniyor');
      
      const response = await api.post('/api/uploads/base64', { image: base64Image });
      
      logger.info('Base64 resim başarıyla yüklendi');
      return response.data;
    } catch (error) {
      logger.error('Base64 resim yükleme hatası:', error);
      throw error;
    }
  },

  /**
   * URL'den resim yükleme
   * @param {string} imageUrl - Resim URL'si
   * @returns {Promise<Object>} - Yüklenen resmin bilgileri
   */
  uploadImageFromUrl: async (imageUrl) => {
    try {
      logger.info(`URL'den resim yükleniyor: ${imageUrl}`);
      
      const response = await api.post('/api/uploads/url', { url: imageUrl });
      
      logger.info('URL resmi başarıyla yüklendi');
      return response.data;
    } catch (error) {
      logger.error('URL resim yükleme hatası:', error);
      throw error;
    }
  },

  /**
   * Resim silme
   * @param {string} publicId - Silinecek resmin Cloudinary public ID'si
   * @returns {Promise<Object>} - Silme işlemi sonucu
   */
  deleteImage: async (publicId) => {
    try {
      logger.info(`Resim siliniyor: ${publicId}`);
      
      const response = await api.delete(`/api/uploads/image/${publicId}`);
      
      logger.info('Resim başarıyla silindi');
      return response.data;
    } catch (error) {
      logger.error('Resim silme hatası:', error);
      throw error;
    }
  }
};

export default uploadAPI;