import axios from 'axios'

// API URL - backend URL'i
const API_URL = 'https://modern-ecommerce-fullstack.onrender.com/api';

// Log gönderimini kontrol etmek için değişken
let isLoggingEnabled = false;
let pendingLogs = [];
let isLogSendingActive = false;

// Dummy veri kullanımını kapatıyoruz
const USE_DUMMY_DATA = false;

// API instance oluşturma
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true, // CORS sorunları için true (credentials ile çalışacak şekilde)
  timeout: 30000 // 30 saniye timeout
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // İsteği log et (ama /logs endpoint'ine gönderme)
    if (config.url !== '/logs') {
      console.log(`API isteği: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // LocalStorage'dan token alma
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('API request error:', error.message);
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Yalnızca /logs dışındaki yanıtları loglama
    if (!response.config.url.includes('/logs')) {
      console.log(`API yanıtı: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    if (!error.config?.url.includes('/logs')) {
      console.error(`API hata yanıtı: ${error.message}`, {
        url: error.config?.url,
        method: error.config?.method
      });
    }
    
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
      console.log('getAll çağrıldı, limit:', limit);
      const response = await api.get(`/products${limit ? `?limit=${limit}` : ''}`);
      console.log('getAll yanıtı alındı:', { 
        status: response?.status,
        success: response?.data?.success,
        dataCount: response?.data?.data?.length || 0 
      });
      
      // Backend response formatı: { success: true, data: [...] }
      // Eğer data bir array değilse (örn, { products: [], pagination: {} } gibi bir obje ise)
      if (response?.data?.success) {
        const responseData = response.data.data;
        
        // Eğer data bir array ise doğrudan döndür, değilse products'ı döndür
        if (Array.isArray(responseData)) {
          return {
            success: true,
            data: responseData
          };
        } else if (responseData && responseData.products) {
          // Eğer data { products: [], pagination: {} } şeklinde ise
          return {
            success: true,
            data: responseData.products
          };
        } else {
          // Hiçbiri değilse boş array döndür
          console.warn('API yanıtından ürünler alınamadı', responseData);
          return {
            success: true,
            data: []
          };
        }
      }
      return { success: false, data: [] };
    } catch (error) {
      console.error('Products fetch error:', error.message);
      return { success: false, data: [], error: error.message };
    }
  },
  getById: async (id) => {
    try {
      console.log('getById çağrıldı, id:', id);
      
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
      console.error('Ürün detayı getirme hatası:', error.message);
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
      console.log('getCategories çağrıldı');
      
      const response = await api.get('/products/categories');
      console.log('getCategories yanıtı:', response?.data);
      
      if (response?.data?.success) {
        return {
          success: true,
          data: response.data.data || []
        };
      }
      return { success: false, data: [] };
    } catch (error) {
      console.error('Categories fetch error:', error.message);
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
      console.error('Search error:', { error: error.message });
      return { success: false, data: [] };
    }
  },
  getByCategory: async (category, limit = 15, skip = 0) => {
    try {
      console.log('getByCategory çağrıldı, category:', category);
      
      if (!category) {
        console.warn('Kategori belirtilmeden getByCategory çağrıldı');
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
      console.error('Kategori ürünleri getirme hatası:', error.message, 'category:', category);
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
      console.log('Login isteği yapılıyor', { email: data.email });
      
      // CORS hatalarını önlemek için özel yapılandırma
      const response = await axios.post(`${API_URL}/auth/login`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('Login yanıtı alındı', { status: response.status });
      return response;
    } catch (error) {
      console.error('Login hatası:', error.message);
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
        console.error('Sipariş oluşturma hatası:', { error: 'shippingAddress.fullName alanı gerekli' });
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
      
      console.error('Sipariş oluşturma hatası:', { 
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
      console.error('Sipariş oluşturma hatası:', { 
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
      console.error('Sipariş getirme hatası:', { error: error.message })
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
      console.error('Sipariş getirme hatası:', { error: error.message })
      throw error
    }
  },
  deleteOrder: async (orderId) => {
    try {
      const response = await api.delete(`/orders/${orderId}`)
      return response.data
    } catch (error) {
      console.error('Sipariş silme hatası:', { error: error.message })
      throw error
    }
  },
  deleteAllOrders: async () => {
    try {
      const response = await api.delete('/orders')
      return response.data
    } catch (error) {
      console.error('Tüm siparişleri silme hatası:', { error: error.message })
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
      console.error('Kullanıcı siparişleri getirme hatası:', { error: error.message })
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
      console.error('Adres getirme hatası:', { error: error.message })
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
      console.error('Adres oluşturma hatası:', { error: error.message })
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
      console.error('Adres güncelleme hatası:', { error: error.message })
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
      console.error('Adres silme hatası:', { error: error.message })
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
      
      console.error('Kullanıcı API hatası:', { response: response?.data });
      
      return {
        success: false,
        data: { users: [], pagination: { total: 0, pages: 1 } },
        error: response?.data?.message || 'Kullanıcılar alınamadı'
      };
    } catch (error) {
      console.error('Kullanıcı getirme hatası:', { error: error.message });
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
      console.error('Rol güncelleme hatası:', { errorMessage });
      
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
      console.error('Profil bilgileri getirme hatası:', { error: error.message })
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
      console.error('Profil güncelleme hatası:', { error: error.message })
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
      console.error('Şifre güncelleme hatası:', { error: error.message })
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
      console.error('Settings fetch error:', { error: error.message })
      return { success: false, data: {} }
    }
  },
  updateSettings: async (data) => {
    try {
      const response = await api.put('/settings', data)
      return response.data
    } catch (error) {
      console.error('Settings update error:', { error: error.message })
      return { success: false, error: error.message }
    }
  }
}

// Log endpoints
export const logAPI = {
  // Tamamen devre dışı bırakılmış log sistemi
  sendLog: async (logData) => {
    // Bu isteği yapmıyoruz, bunun yerine konsola yazdırıyoruz
    console.log("Log istek", logData);
    return { success: true }
  }
}