import axios from 'axios'
import { logger } from '../utils'

// API URL - backend URL'i
const API_URL = 'https://modern-ecommerce-fullstack.onrender.com/api';

// Dummy veri kullanımını kapatıyoruz
const USE_DUMMY_DATA = false;

// API instance oluşturma
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Access-Control-Allow-Origin': '*'
  },
  withCredentials: false, // CORS sorunları için false
  timeout: 30000 // 30 saniye timeout
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // İsteği loglama
    logger.info(`API isteği yapılıyor: ${config.method?.toUpperCase()} ${config.url}`, { 
      baseURL: config.baseURL,
      headers: config.headers
    });
    
    // LocalStorage'dan token alma
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    logger.error('API request error:', error.message);
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    logger.info(`API yanıtı alındı: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    logger.error(`API hata yanıtı: ${error.message}`, {
      url: error.config?.url,
      method: error.config?.method
    });
    
    // 401 hatası durumunda logout
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// Product endpoints
export const productAPI = {
  getAll: async (limit) => {
    try {
      logger.info('getAll çağrıldı, limit:', limit);
      const response = await api.get(`/products${limit ? `?limit=${limit}` : ''}`);
      logger.info('getAll yanıtı alındı:', { 
        status: response?.status,
        success: response?.data?.success,
        dataCount: response?.data?.data?.length || 0 
      });
      
      if (response?.data?.success) {
        return {
          success: true,
          data: response.data.data || []
        };
      }
      return { success: false, data: [] };
    } catch (error) {
      logger.error('Products fetch error:', error.message);
      return { success: false, data: [], error: error.message };
    }
  },
  getById: async (id) => {
    try {
      logger.info('getById çağrıldı, id:', id);
      
      const response = await api.get(`/products/${id}`);
      if (response?.data?.success) {
        return {
          success: true,
          product: response.data.data
        };
      }
      return { 
        success: false, 
        product: null,
        error: response?.data?.message || 'Ürün bulunamadı'
      };
    } catch (error) {
      logger.error('Ürün detayı getirme hatası:', error.message);
      return { 
        success: false, 
        product: null,
        error: error?.response?.data?.message || error.message
      };
    }
  },
  create: (data) => api.post('/products', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  update: (id, data) => api.put(`/products/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  delete: (id) => api.delete(`/products/${id}`),
  getCategories: async () => {
    try {
      logger.info('getCategories çağrıldı');
      
      const response = await api.get('/products/categories');
      if (response?.data?.success) {
        return {
          success: true,
          data: response.data.data || []
        };
      }
      return { success: false, data: [] };
    } catch (error) {
      logger.error('Categories fetch error:', error.message);
      return { success: false, data: [], error: error.message };
    }
  },
  search: async (query) => {
    try {
      const response = await api.get('/products/search', { params: { q: query } });
      if (response?.data?.success) {
        return {
          success: true,
          data: response.data.data || []
        };
      }
      return { success: false, data: [] };
    } catch (error) {
      logger.error('Search error:', { error: error.message });
      return { success: false, data: [] };
    }
  },
  getByCategory: async (category, limit = 15, skip = 0) => {
    try {
      logger.info('getByCategory çağrıldı, category:', category);
      
      if (!category) {
        logger.warn('Kategori belirtilmeden getByCategory çağrıldı');
        return { success: false, data: [], error: 'Kategori belirtilmedi' };
      }
      
      const categoryParam = encodeURIComponent(category);
      
      const response = await api.get(`/products/category/${categoryParam}`, {
        params: { limit, skip }
      });
      
      return {
        success: response?.data?.success || false,
        data: response?.data?.data || [],
        skip: response?.data?.skip || skip,
        limit: response?.data?.limit || limit,
        total: response?.data?.total || 0
      };
    } catch (error) {
      logger.error('Kategori ürünleri getirme hatası:', error.message, 'category:', category);
      return { 
        success: false, 
        data: [], 
        error: error?.response?.data?.message || error.message 
      };
    }
  }
}

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: async (data) => {
    try {
      logger.info('Login isteği yapılıyor', { email: data.email });
      
      const response = await api.post('/auth/login', data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      logger.info('Login yanıtı alındı', { status: response.status });
      return response;
    } catch (error) {
      logger.error('Login hatası:', error.message);
      throw error;
    }
  },
  logout: () => api.post('/auth/logout'),
  update: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data)
}

// Order endpoints
export const orderAPI = {
  create: async (orderData) => {
    try {
      if (!orderData.shippingAddress || !orderData.shippingAddress.fullName) {
        logger.error('Sipariş oluşturma hatası:', { error: 'shippingAddress.fullName alanı gerekli' });
        return {
          success: false,
          error: 'Teslimat adresi bilgileriniz eksik. Lütfen adres bilgilerinizi kontrol edin.'
        };
      }

      const response = await api.post('/orders', orderData);
      if (response?.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      logger.error('Sipariş oluşturma hatası:', { 
        status: response?.status, 
        error: response?.data?.error, 
        message: response?.data?.message
      });
      
      return {
        success: false,
        error: response?.data?.error || response?.data?.message,
        status: response?.status
      };
    } catch (error) {
      logger.error('Sipariş oluşturma hatası:', { 
        error: error.message, 
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error?.response?.data?.error || error?.response?.data?.message || error.message,
        status: error?.response?.status,
        data: error?.response?.data
      };
    }
  },
  getAll: async () => {
    try {
      const response = await api.get('/orders')
      if (response?.data?.success) {
        return {
          success: true,
          orders: response.data.data || []
        }
      }
      return {
        success: false,
        orders: [],
        error: response?.data?.message || 'Siparişler alınamadı'
      }
    } catch (error) {
      logger.error('Sipariş getirme hatası:', { error: error.message })
      return {
        success: false,
        orders: [],
        error: error?.response?.data?.message || error.message
      }
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`)
      return response.data
    } catch (error) {
      logger.error('Sipariş getirme hatası:', { error: error.message })
      throw error
    }
  },
  deleteOrder: async (orderId) => {
    try {
      const response = await api.delete(`/orders/${orderId}`)
      return response.data
    } catch (error) {
      logger.error('Sipariş silme hatası:', { error: error.message })
      throw error
    }
  },
  deleteAllOrders: async () => {
    try {
      const response = await api.delete('/orders')
      return response.data
    } catch (error) {
      logger.error('Tüm siparişleri silme hatası:', { error: error.message })
      throw error
    }
  },
  getUserOrders: async () => {
    try {
      const response = await api.get('/orders')
      if (response?.data?.success) {
        return {
          success: true,
          data: response.data.data || []
        }
      }
      return {
        success: false,
        data: [],
        error: response?.data?.message || 'Siparişler alınamadı'
      }
    } catch (error) {
      logger.error('Kullanıcı siparişleri getirme hatası:', { error: error.message })
      return {
        success: false,
        data: [],
        error: error?.response?.data?.message || error.message
      }
    }
  }
}

// Address endpoints
export const addressAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/addresses')
      if (response?.data?.success) {
        return {
          success: true,
          addresses: response.data.data || []
        }
      }
      return {
        success: false,
        addresses: [],
        error: response?.data?.message || 'Adresler alınamadı'
      }
    } catch (error) {
      logger.error('Adres getirme hatası:', { error: error.message })
      return {
        success: false,
        addresses: [],
        error: error?.response?.data?.message || error.message
      }
    }
  },
  create: async (addressData) => {
    try {
      const response = await api.post('/addresses', addressData)
      return response.data
    } catch (error) {
      logger.error('Adres oluşturma hatası:', { error: error.message })
      return {
        success: false,
        error: error?.response?.data?.message || error.message
      }
    }
  },
  update: async (addressId, addressData) => {
    try {
      const response = await api.put(`/addresses/${addressId}`, addressData)
      return response.data
    } catch (error) {
      logger.error('Adres güncelleme hatası:', { error: error.message })
      return {
        success: false,
        error: error?.response?.data?.message || error.message
      }
    }
  },
  delete: async (addressId) => {
    try {
      const response = await api.delete(`/addresses/${addressId}`)
      return response.data
    } catch (error) {
      logger.error('Adres silme hatası:', { error: error.message })
      return {
        success: false,
        error: error?.response?.data?.message || error.message
      }
    }
  }
}

// User endpoints
export const userAPI = {
  getAll: async (params) => {
    try {
      const paramStr = params ? params.toString() : '';
      const response = await api.get(`/users${paramStr ? `?${paramStr}` : ''}`);
      
      if (response?.data?.success) {
        return {
          success: true,
          data: response.data.data || { users: [], pagination: { total: 0, pages: 1 } }
        };
      }
      
      logger.error('Kullanıcı API hatası:', { response: response?.data });
      
      return {
        success: false,
        data: { users: [], pagination: { total: 0, pages: 1 } },
        error: response?.data?.message || 'Kullanıcılar alınamadı'
      };
    } catch (error) {
      logger.error('Kullanıcı getirme hatası:', { error: error.message });
      return {
        success: false,
        data: { users: [], pagination: { total: 0, pages: 1 } },
        error: error?.response?.data?.message || error.message
      };
    }
  },
  getUserDetails: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateRole: async (userId, role) => {
    try {
      const response = await api.put(`/users/${userId}`, { role });
      
      if (response?.data?.success) {
        return { 
          success: true, 
          data: response.data.data,
          message: 'Kullanıcı rolü başarıyla güncellendi'
        };
      }
      
      return {
        success: false,
        error: response?.data?.message || 'Rol güncelleme işlemi başarısız oldu'
      };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || 'Rol güncelleme sırasında bir hata oluştu';
      logger.error('Rol güncelleme hatası:', { errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },
  
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile')
      if (response?.data?.success) {
        return {
          success: true,
          user: response.data.data || {}
        }
      }
      return {
        success: false,
        user: {},
        error: response?.data?.message || 'Profil bilgileri alınamadı'
      }
    } catch (error) {
      logger.error('Profil bilgileri getirme hatası:', { error: error.message })
      return {
        success: false,
        user: {},
        error: error?.response?.data?.message || error.message
      }
    }
  },
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData)
      return response.data
    } catch (error) {
      logger.error('Profil güncelleme hatası:', { error: error.message })
      return {
        success: false,
        error: error?.response?.data?.message || error.message
      }
    }
  },
  updatePassword: async (passwordData) => {
    try {
      const response = await api.put('/users/password', passwordData)
      return response.data
    } catch (error) {
      logger.error('Şifre güncelleme hatası:', { error: error.message })
      return {
        success: false,
        error: error?.response?.data?.message || error.message
      }
    }
  }
}

// Settings endpoints
export const settingsAPI = {
  getSettings: async () => {
    try {
      const response = await api.get('/settings')
      return response.data
    } catch (error) {
      logger.error('Settings fetch error:', { error: error.message })
      return { success: false, data: {} }
    }
  },
  updateSettings: async (data) => {
    try {
      const response = await api.put('/settings', data)
      return response.data
    } catch (error) {
      logger.error('Settings update error:', { error: error.message })
      return { success: false, error: error.message }
    }
  }
}

// Log endpoints
export const logAPI = {
  sendLog: async (logData) => {
    try {
      const response = await api.post('/logs', logData)
      return response.data
    } catch (error) {
      // Burada logger kullanmıyoruz çünkü sonsuz döngüye girebilir
      return { success: false }
    }
  }
}