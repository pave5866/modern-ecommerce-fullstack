import api from '../api';
import logger from '../logger';

const authAPI = {
  /**
   * Kullanıcı girişi yapar
   * @param {string} email - Kullanıcı e-posta adresi
   * @param {string} password - Kullanıcı şifresi
   * @returns {Promise} - Başarılı giriş sonrası kullanıcı bilgileri ve token
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      // Başarılı giriş, token'ı localStorage'a kaydet
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      logger.error('Giriş hatası:', error);
      throw error;
    }
  },

  /**
   * Kullanıcı kaydı yapar
   * @param {Object} userData - Kullanıcı kayıt bilgileri
   * @returns {Promise} - Başarılı kayıt sonrası kullanıcı bilgileri
   */
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      logger.error('Kayıt hatası:', error);
      throw error;
    }
  },

  /**
   * Şifre sıfırlama e-postası gönderir
   * @param {string} email - Kullanıcı e-posta adresi
   * @returns {Promise} - Başarılı istek sonrası onay mesajı
   */
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      logger.error('Şifre sıfırlama hatası:', error);
      throw error;
    }
  },

  /**
   * Şifre sıfırlama işlemini tamamlar
   * @param {string} token - Şifre sıfırlama token'ı
   * @param {string} password - Yeni şifre
   * @returns {Promise} - Başarılı sıfırlama sonrası onay mesajı
   */
  resetPassword: async (token, password) => {
    try {
      const response = await api.post(`/api/auth/reset-password/${token}`, { password });
      return response.data;
    } catch (error) {
      logger.error('Şifre sıfırlama tamamlama hatası:', error);
      throw error;
    }
  },

  /**
   * Kullanıcıyı sistemden çıkarır
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Mevcut oturumun durumunu kontrol eder ve kullanıcı bilgisini sağlar
   * @returns {Object|null} - Oturum açılmışsa kullanıcı bilgisi, değilse null
   */
  getCurrentUser: () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        return null;
      }
      
      return JSON.parse(user);
    } catch (error) {
      logger.error('Kullanıcı bilgisi alınamadı:', error);
      return null;
    }
  },

  /**
   * JWT token'ının geçerli olup olmadığını API'ye sorarak kontrol eder
   * @returns {Promise<boolean>} - Token geçerliyse true, değilse false
   */
  verifyToken: async () => {
    try {
      const response = await api.get('/api/auth/verify');
      return response.data.valid === true;
    } catch (error) {
      logger.error('Token doğrulama hatası:', error);
      return false;
    }
  }
};

export default authAPI;