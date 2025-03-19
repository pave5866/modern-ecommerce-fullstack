import axios from 'axios';
import logger from '../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

// API istemcisi oluştur
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek interceptor'ı
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logger.info('API isteği', { url: config.url, method: config.method });
    return config;
  },
  (error) => {
    logger.error('API isteği hatası', { error: error.message });
    return Promise.reject(error);
  }
);

// Yanıt interceptor'ı
apiClient.interceptors.response.use(
  (response) => {
    logger.info('API yanıtı alındı', { 
      url: response.config.url, 
      status: response.status,
      success: true 
    });
    return response;
  },
  (error) => {
    logger.error('API yanıt hatası', { 
      url: error.config?.url, 
      status: error.response?.status, 
      message: error.response?.data?.message || error.message
    });
    return Promise.reject(error);
  }
);

// Product API
export const productAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/products', { params });
      return {
        success: true,
        data: response.data.data || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        limit: response.data.limit || 10,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
  
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return {
        success: true,
        product: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
  
  getByCategory: async (category) => {
    try {
      const response = await apiClient.get('/products', { 
        params: { category } 
      });
      return {
        success: true,
        data: response.data.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
  
  create: async (productData) => {
    try {
      const response = await apiClient.post('/products', productData);
      return {
        success: true,
        product: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
  
  update: async (id, productData) => {
    try {
      const response = await apiClient.put(`/products/${id}`, productData);
      return {
        success: true,
        product: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
  
  delete: async (id) => {
    try {
      await apiClient.delete(`/products/${id}`);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
};

// Category API
export const categoryAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/categories');
      return {
        success: true,
        data: response.data.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
};

// Auth API
export const authAPI = {
  login: async (credentials) => {
    try {
      // Tüm API hata bilgilerini loglayalım
      logger.info('Giriş yapılıyor', { email: credentials.email });
      
      const response = await apiClient.post('/auth/login', credentials);
      
      logger.info('Giriş başarılı', { email: credentials.email });
      
      return {
        success: true,
        user: response.data.user,
        token: response.data.token,
      };
    } catch (error) {
      let errorMessage = 'Giriş yapılamadı';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 'E-posta veya şifre hatalı';
        
        // Detaylı hata bilgilerini logla
        logger.error('Giriş hatası detayları', { 
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
  
  register: async (userData) => {
    try {
      // Tüm API hata bilgilerini loglayalım
      logger.info('Kayıt yapılıyor', { email: userData.email });
      
      const response = await apiClient.post('/auth/register', userData);
      
      logger.info('Kayıt başarılı', { user: response.data.user?.email });
      
      return {
        success: true,
        user: response.data.user,
        token: response.data.token,
      };
    } catch (error) {
      let errorMessage = 'Kayıt yapılamadı';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 'Kayıt sırasında bir hata oluştu';
        
        // Detaylı hata bilgilerini logla
        logger.error('Kayıt hatası detayları', { 
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
  
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile');
      return {
        success: true,
        user: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
};

// Test fonksiyonu - Backend'in çalışıp çalışmadığını kontrol et
export const testAPI = async () => {
  try {
    const response = await apiClient.get('/');
    return {
      success: true,
      message: response.data.message || 'API çalışıyor',
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
};

export default {
  product: productAPI,
  category: categoryAPI,
  auth: authAPI,
  test: testAPI,
};