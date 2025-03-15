import axios from 'axios'
import { logger } from '../utils'

// Backend API URL - render.com'daki URL, boşsa dummy veri kullanılır
const BACKEND_API_URL = 'https://modern-ecommerce-fullstack.onrender.com/api';

// Dummy veri kullanımını aktif ediyoruz geçici olarak
const USE_DUMMY_DATA = true;

// API için base URL
const API_URL = BACKEND_API_URL || 'https://api.example.com';

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
    
    // Eğer dummy veri kullanılacaksa, isteği kesip dummy veri döndürme
    if (USE_DUMMY_DATA && config.method === 'get') {
      // İstek URL'inde yapılacak işleme göre uygun dummy veriyi belirleme
      const dummyResponse = getDummyResponseForUrl(config.url);
      
      // Axios'un promise zincirini kırarak dummy veriyi döndürme
      config._dummyData = dummyResponse;
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
    // Eğer dummy veri varsa onu kullan
    if (response.config._dummyData) {
      logger.info('Dummy veri döndürülüyor:', response.config.url);
      return {
        data: response.config._dummyData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: response.config
      };
    }
    
    logger.info(`API yanıtı alındı: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    logger.error(`API hata yanıtı: ${error.message}`, {
      url: error.config?.url,
      method: error.config?.method
    });
    
    // Eğer dummy veri kullanımı aktifse ve bir hata oluşmuşsa, dummy veri döndür
    if (USE_DUMMY_DATA && error.config) {
      logger.info('Hata sonrası dummy veri döndürülüyor:', error.config.url);
      const dummyResponse = getDummyResponseForUrl(error.config.url);
      
      return Promise.resolve({
        data: dummyResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config
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

// DUMMY DATA
const DUMMY_DATA = {
  products: [
    {
      _id: '1',
      name: 'Siyah T-Shirt',
      price: 149.99,
      description: 'Rahat ve şık siyah t-shirt',
      image: 'https://picsum.photos/id/237/300/300',
      category: 'Giyim',
      quantity: 50,
      createdAt: '2023-01-01'
    },
    {
      _id: '2',
      name: 'Mavi Kot Pantolon',
      price: 299.99,
      description: 'Klasik kesim mavi kot pantolon',
      image: 'https://picsum.photos/id/26/300/300',
      category: 'Giyim',
      quantity: 30,
      createdAt: '2023-01-02'
    },
    {
      _id: '3',
      name: 'Spor Ayakkabı',
      price: 399.99,
      description: 'Hafif ve konforlu spor ayakkabı',
      image: 'https://picsum.photos/id/21/300/300',
      category: 'Ayakkabı',
      quantity: 20,
      createdAt: '2023-01-03'
    },
    {
      _id: '4',
      name: 'Deri Cüzdan',
      price: 199.99,
      description: 'Hakiki deri el yapımı cüzdan',
      image: 'https://picsum.photos/id/37/300/300',
      category: 'Aksesuar',
      quantity: 15,
      createdAt: '2023-01-04'
    },
    {
      _id: '5',
      name: 'Akıllı Saat',
      price: 1299.99,
      description: 'Su geçirmez GPS özellikli akıllı saat',
      image: 'https://picsum.photos/id/111/300/300',
      category: 'Elektronik',
      quantity: 10,
      createdAt: '2023-01-05'
    },
    {
      _id: '6',
      name: 'Bluetooth Kulaklık',
      price: 499.99,
      description: 'Gürültü önleyici kablosuz kulaklık',
      image: 'https://picsum.photos/id/250/300/300',
      category: 'Elektronik',
      quantity: 25,
      createdAt: '2023-01-06'
    },
    {
      _id: '7',
      name: 'Outdoor Ceket',
      price: 899.99,
      description: 'Suya ve rüzgara dayanıklı dağcı ceketi',
      image: 'https://picsum.photos/id/248/300/300',
      category: 'Giyim',
      quantity: 8,
      createdAt: '2023-01-07'
    },
    {
      _id: '8',
      name: 'Yüzme Gözlüğü',
      price: 129.99,
      description: 'Profesyonel anti-fog yüzme gözlüğü',
      image: 'https://picsum.photos/id/106/300/300',
      category: 'Spor',
      quantity: 30,
      createdAt: '2023-01-08'
    },
    {
      _id: '9',
      name: 'Kış Montu',
      price: 1499.99,
      description: 'Ekstra kalın içi polar kaplı kış montu',
      image: 'https://picsum.photos/id/96/300/300',
      category: 'Giyim',
      quantity: 12,
      createdAt: '2023-01-09'
    },
    {
      _id: '10',
      name: 'Kahve Makinesi',
      price: 2999.99,
      description: 'Tam otomatik espresso ve cappuccino makinesi',
      image: 'https://picsum.photos/id/225/300/300',
      category: 'Ev Aletleri',
      quantity: 5,
      createdAt: '2023-01-10'
    }
  ],
  categories: ['Giyim', 'Ayakkabı', 'Elektronik', 'Aksesuar', 'Spor', 'Ev Aletleri'],
  users: [
    {
      _id: '101',
      name: 'Test Kullanıcı',
      email: 'test@example.com',
      role: 'user'
    },
    {
      _id: '102',
      name: 'Admin Kullanıcı',
      email: 'admin@example.com',
      role: 'admin'
    }
  ],
  orders: [
    {
      _id: '1001',
      user: '101',
      products: [
        { product: '1', quantity: 2, price: 149.99 },
        { product: '3', quantity: 1, price: 399.99 }
      ],
      totalAmount: 699.97,
      status: 'completed',
      createdAt: '2023-01-15'
    }
  ],
  addresses: [
    {
      _id: '10001',
      user: '101',
      fullName: 'Test Kullanıcı',
      phone: '5551234567',
      address: 'Test Mahallesi, Örnek Sokak No:1',
      city: 'İstanbul',
      postalCode: '34000',
      country: 'Türkiye',
      isDefault: true
    }
  ],
  settings: {
    siteName: 'E-Commerce',
    logo: 'logo.png',
    supportEmail: 'support@example.com',
    supportPhone: '5551234567'
  }
}

// URL'e göre dummy veri döndürme fonksiyonu
function getDummyResponseForUrl(url) {
  // URL'i parsing
  if (!url) return { success: false, message: 'URL not provided' };
  
  // /products endpoint'i
  if (url.match(/^\/products\/?$/)) {
    return { 
      success: true, 
      data: DUMMY_DATA.products,
      total: DUMMY_DATA.products.length,
      limit: 10,
      skip: 0
    };
  }
  
  // /products/:id endpoint'i
  const productDetailMatch = url.match(/^\/products\/([^/]+)$/);
  if (productDetailMatch) {
    const productId = productDetailMatch[1];
    const product = DUMMY_DATA.products.find(p => p._id === productId);
    
    if (product) {
      return { success: true, data: product };
    }
    return { success: false, message: 'Product not found' };
  }
  
  // /products/search endpoint'i  
  if (url.startsWith('/products/search')) {
    return { 
      success: true, 
      data: DUMMY_DATA.products.slice(0, 3),
      total: 3
    };
  }
  
  // /products/categories endpoint'i
  if (url === '/products/categories') {
    return { 
      success: true, 
      data: DUMMY_DATA.categories.map(name => ({ _id: name.toLowerCase(), name }))
    };
  }
  
  // /products/category/:category endpoint'i
  const categoryMatch = url.match(/^\/products\/category\/([^/]+)/);
  if (categoryMatch) {
    const categoryName = categoryMatch[1];
    const decodedCategory = decodeURIComponent(categoryName);
    
    // Kategori ismini normalize et
    const normalizedRequestedCategory = decodedCategory.toLowerCase().trim();
    
    // Kategoriye göre filtreleme yap
    const filteredProducts = DUMMY_DATA.products.filter(product => {
      const normalizedProductCategory = product.category.toLowerCase().trim();
      return normalizedProductCategory === normalizedRequestedCategory ||
             normalizedProductCategory.replace(/ /g, '-') === normalizedRequestedCategory;
    });
    
    return { 
      success: true, 
      data: filteredProducts,
      total: filteredProducts.length,
      limit: 10,
      skip: 0
    };
  }
  
  // /users endpoint'i
  if (url.match(/^\/users\/?$/)) {
    return { 
      success: true, 
      data: { 
        users: DUMMY_DATA.users,
        pagination: { total: DUMMY_DATA.users.length, pages: 1 }
      }
    };
  }
  
  // /orders endpoint'i
  if (url.match(/^\/orders\/?$/)) {
    return { 
      success: true, 
      data: DUMMY_DATA.orders
    };
  }
  
  // /addresses endpoint'i
  if (url.match(/^\/addresses\/?$/)) {
    return { 
      success: true, 
      data: DUMMY_DATA.addresses
    };
  }
  
  // /settings endpoint'i
  if (url.match(/^\/settings\/?$/)) {
    return { 
      success: true, 
      data: DUMMY_DATA.settings
    };
  }
  
  // /users/profile endpoint'i
  if (url === '/users/profile') {
    return { 
      success: true, 
      data: DUMMY_DATA.users[0]
    };
  }
  
  // Eşleşme yoksa genel bir yanıt döndür
  return { 
    success: false, 
    message: 'Endpoint not found or not supported in dummy mode' 
  };
}

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
  login: (data) => api.post('/auth/login', data),
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