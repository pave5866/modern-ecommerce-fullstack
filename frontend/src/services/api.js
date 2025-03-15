import axios from 'axios'
import { logger } from '../utils'

// API URL'sini çevre değişkeninden al
const API_URL = import.meta.env.VITE_APP_API_URL || 'https://modern-ecommerce-fullstack.onrender.com/api'

// Alternatif API URL'leri - CORS sorunu durumunda kullanılacak
const BACKUP_API_URLS = [
  '/api', // Vite proxy ile çalışır
  'https://modern-ecommerce-fullstack.onrender.com/api',
  'https://cors-anywhere.herokuapp.com/https://modern-ecommerce-fullstack.onrender.com/api',
  'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://modern-ecommerce-fullstack.onrender.com/api')
];

// Dummy API - geçici çözüm olarak kullanılabilir
const DUMMY_DATA = {
  products: [
    { 
      _id: '1', 
      name: 'Siyah T-Shirt', 
      price: 149.99, 
      description: 'Rahat ve şık siyah t-shirt', 
      images: ['https://picsum.photos/id/237/300/400'], 
      category: 'Giyim',
      stock: 25,
      rating: 4.5,
      numReviews: 12
    },
    { 
      _id: '2', 
      name: 'Mavi Kot Pantolon', 
      price: 299.99, 
      description: 'Slim fit mavi kot pantolon', 
      images: ['https://picsum.photos/id/238/300/400'], 
      category: 'Giyim',
      stock: 15,
      rating: 4.2,
      numReviews: 8
    },
    { 
      _id: '3', 
      name: 'Spor Ayakkabı', 
      price: 399.99, 
      description: 'Konforlu spor ayakkabı', 
      images: ['https://picsum.photos/id/239/300/400'], 
      category: 'Ayakkabı',
      stock: 10,
      rating: 4.7,
      numReviews: 15
    },
    { 
      _id: '4', 
      name: 'Deri Cüzdan', 
      price: 199.99, 
      description: 'Hakiki deri cüzdan', 
      images: ['https://picsum.photos/id/240/300/400'], 
      category: 'Aksesuar',
      stock: 30,
      rating: 4.0,
      numReviews: 5
    },
    { 
      _id: '5', 
      name: 'Akıllı Saat', 
      price: 1299.99, 
      description: 'Çok fonksiyonlu akıllı saat', 
      images: ['https://picsum.photos/id/241/300/400'], 
      category: 'Elektronik',
      stock: 8,
      rating: 4.8,
      numReviews: 20
    },
    { 
      _id: '6', 
      name: 'Bluetooth Kulaklık', 
      price: 499.99, 
      description: 'Kablosuz bluetooth kulaklık', 
      images: ['https://picsum.photos/id/242/300/400'], 
      category: 'Elektronik',
      stock: 12,
      rating: 4.6,
      numReviews: 18
    },
    { 
      _id: '7', 
      name: 'Laptop Çantası', 
      price: 249.99, 
      description: 'Su geçirmez laptop çantası', 
      images: ['https://picsum.photos/id/243/300/400'], 
      category: 'Aksesuar',
      stock: 20,
      rating: 4.3,
      numReviews: 9
    },
    { 
      _id: '8', 
      name: 'Güneş Gözlüğü', 
      price: 349.99, 
      description: 'UV korumalı güneş gözlüğü', 
      images: ['https://picsum.photos/id/244/300/400'], 
      category: 'Aksesuar',
      stock: 15,
      rating: 4.4,
      numReviews: 11
    },
    { 
      _id: '9', 
      name: 'Kış Montu', 
      price: 899.99, 
      description: 'Sıcak tutan kış montu', 
      images: ['https://picsum.photos/id/245/300/400'], 
      category: 'Giyim',
      stock: 7,
      rating: 4.9,
      numReviews: 25
    },
    { 
      _id: '10', 
      name: 'Spor Çorap', 
      price: 49.99, 
      description: 'Nefes alabilen spor çorap', 
      images: ['https://picsum.photos/id/246/300/400'], 
      category: 'Giyim',
      stock: 50,
      rating: 4.1,
      numReviews: 7
    }
  ],
  categories: ['Giyim', 'Ayakkabı', 'Aksesuar', 'Elektronik'],
  users: [
    { _id: '1', name: 'Test Kullanıcı', email: 'test@example.com', role: 'user' },
    { _id: '2', name: 'Admin Kullanıcı', email: 'admin@example.com', role: 'admin' }
  ],
  orders: [
    { _id: '1', userId: '1', products: ['1', '2'], totalAmount: 449.98, status: 'completed' },
    { _id: '2', userId: '1', products: ['3', '4'], totalAmount: 599.98, status: 'processing' }
  ]
};

// Dummy veri kullanımını kontrol eden değişken
const USE_DUMMY_DATA = true; // Geçici olarak dummy veri kullanımını etkinleştir

// Local API instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: false, // CORS sorunlarını önlemek için false yapıldı
  timeout: 15000 // 15 saniye timeout
})

// Yedek API instance - CORS sorunu durumunda kullanılacak
let currentBackupUrlIndex = 0;
export const backupApi = axios.create({
  baseURL: BACKUP_API_URLS[0],
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: false,
  timeout: 15000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Dummy veri kullanımı etkinse, API çağrısını engelle ve dummy veri kullan
    if (USE_DUMMY_DATA) {
      // Bu config'i işaretle, response interceptor'da kullanacağız
      config.useDummyData = true;
      logger.info('Dummy veri kullanımı etkin, API çağrısı işaretlendi:', config.url);
    }
    
    // LocalStorage'dan token'ı al
    const token = localStorage.getItem('token')
    
    // Token varsa header'a ekle
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // CORS sorunlarını önlemek için ek header'lar
    config.headers['Access-Control-Allow-Origin'] = '*';
    
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
    // Dummy veri kullanımı etkinse ve config işaretlenmişse, dummy veri döndür
    if (USE_DUMMY_DATA && response.config.useDummyData) {
      const url = response.config.url;
      const method = response.config.method;
      
      logger.info('Dummy veri kullanılıyor, URL:', url);
      
      // URL'den endpoint'i çıkar
      const endpoint = url.split('/').pop();
      
      // Dummy veri döndür
      if (url.includes('/products') && !url.includes('/categories')) {
        logger.info('Dummy ürün verileri kullanılıyor');
        return {
          ...response,
          data: { 
            success: true, 
            data: DUMMY_DATA.products,
            total: DUMMY_DATA.products.length,
            skip: 0,
            limit: DUMMY_DATA.products.length
          }
        };
      } else if (url.includes('/products/categories') || endpoint === 'categories') {
        logger.info('Dummy kategori verileri kullanılıyor');
        return {
          ...response,
          data: { 
            success: true, 
            data: DUMMY_DATA.categories 
          }
        };
      } else if (url.includes('/users')) {
        logger.info('Dummy kullanıcı verileri kullanılıyor');
        return {
          ...response,
          data: { 
            success: true, 
            data: DUMMY_DATA.users 
          }
        };
      } else if (url.includes('/orders')) {
        logger.info('Dummy sipariş verileri kullanılıyor');
        return {
          ...response,
          data: { 
            success: true, 
            data: DUMMY_DATA.orders 
          }
        };
      }
    }
    
    return response;
  },
  async (error) => {
    // Dummy veri kullanımı etkinse, hata durumunda dummy veri döndür
    if (USE_DUMMY_DATA && error.config) {
      const url = error.config.url;
      
      logger.info('API hatası oluştu, dummy veri kullanılacak. URL:', url);
      
      // URL'den endpoint'i çıkar
      const endpoint = url.split('/').pop();
      
      // Dummy veri döndür
      if (url.includes('/products') && !url.includes('/categories')) {
        logger.info('Hata durumunda dummy ürün verileri kullanılıyor');
        return Promise.resolve({ 
          data: { 
            success: true, 
            data: DUMMY_DATA.products,
            total: DUMMY_DATA.products.length,
            skip: 0,
            limit: DUMMY_DATA.products.length
          } 
        });
      } else if (url.includes('/products/categories') || endpoint === 'categories') {
        logger.info('Hata durumunda dummy kategori verileri kullanılıyor');
        return Promise.resolve({ 
          data: { 
            success: true, 
            data: DUMMY_DATA.categories 
          } 
        });
      } else if (url.includes('/users')) {
        logger.info('Hata durumunda dummy kullanıcı verileri kullanılıyor');
        return Promise.resolve({ 
          data: { 
            success: true, 
            data: DUMMY_DATA.users 
          } 
        });
      } else if (url.includes('/orders')) {
        logger.info('Hata durumunda dummy sipariş verileri kullanılıyor');
        return Promise.resolve({ 
          data: { 
            success: true, 
            data: DUMMY_DATA.orders 
          } 
        });
      }
    }
    
    // CORS hatalarını özel olarak logla
    if (error.message && (error.message.includes('Network Error') || error.message.includes('CORS'))) {
      logger.error('CORS veya ağ hatası:', error.message, 'URL:', error.config?.url);
      
      // CORS hatası durumunda yedek API'yi dene
      if (error.config) {
        try {
          // Bir sonraki yedek URL'yi kullan
          currentBackupUrlIndex = (currentBackupUrlIndex + 1) % BACKUP_API_URLS.length;
          backupApi.defaults.baseURL = BACKUP_API_URLS[currentBackupUrlIndex];
          
          logger.info(`Yedek API URL'sine geçiliyor: ${backupApi.defaults.baseURL}`);
          
          // Orijinal isteği yedek API ile tekrar dene
          const retryConfig = { ...error.config };
          retryConfig.baseURL = backupApi.defaults.baseURL;
          
          return axios(retryConfig);
        } catch (retryError) {
          logger.error('Yedek API ile de istek başarısız:', retryError.message);
          
          // Tüm API'ler başarısız olursa dummy veri kullan
          const endpoint = error.config.url.split('/').pop();
          if (endpoint === 'products' || error.config.url.includes('/products')) {
            logger.info('Dummy ürün verileri kullanılıyor');
            return Promise.resolve({ 
              data: { 
                success: true, 
                data: DUMMY_DATA.products 
              } 
            });
          } else if (endpoint === 'categories' || error.config.url.includes('/categories')) {
            logger.info('Dummy kategori verileri kullanılıyor');
            return Promise.resolve({ 
              data: { 
                success: true, 
                data: DUMMY_DATA.categories 
              } 
            });
          }
          
          return Promise.reject(retryError);
        }
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Dummy API instance
export const dummyApi = axios.create({
  baseURL: 'https://dummyjson.com',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Product endpoints
export const productAPI = {
  getAll: async (limit) => {
    try {
      logger.info('getAll çağrıldı, limit:', limit);
      const response = await api.get(`/products${limit ? `?limit=${limit}` : ''}`);
      logger.info('getAll yanıtı:', response?.data);
      
      if (USE_DUMMY_DATA) {
        logger.info('Dummy ürün verileri döndürülüyor');
        return {
          success: true,
          data: DUMMY_DATA.products
        };
      }
      
      if (response?.data?.success) {
        return {
          success: true,
          data: response.data.data || []
        };
      }
      return { success: false, data: [] };
    } catch (error) {
      logger.error('Products fetch error:', error.message);
      
      if (USE_DUMMY_DATA) {
        logger.info('Hata durumunda dummy ürün verileri döndürülüyor');
        return {
          success: true,
          data: DUMMY_DATA.products
        };
      }
      
      return { success: false, data: [] };
    }
  },
  getById: async (id) => {
    try {
      logger.info('getById çağrıldı, id:', id);
      
      if (USE_DUMMY_DATA) {
        const product = DUMMY_DATA.products.find(p => p._id === id);
        logger.info('Dummy ürün verisi döndürülüyor:', product);
        return {
          success: true,
          product: product || null
        };
      }
      
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
      
      if (USE_DUMMY_DATA) {
        const product = DUMMY_DATA.products.find(p => p._id === id);
        return {
          success: true,
          product: product || null
        };
      }
      
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
      
      if (USE_DUMMY_DATA) {
        logger.info('Dummy kategori verileri döndürülüyor');
        return {
          success: true,
          data: DUMMY_DATA.categories
        };
      }
      
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
      
      if (USE_DUMMY_DATA) {
        return {
          success: true,
          data: DUMMY_DATA.categories
        };
      }
      
      return { success: false, data: [] };
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
      
      if (USE_DUMMY_DATA) {
        // Kategori adını normalize et
        const normalizedCategory = category.toLowerCase().trim();
        
        // Dummy verilerden kategori ile eşleşen ürünleri filtrele
        const filteredProducts = DUMMY_DATA.products.filter(product => {
          const productCategory = product.category.toLowerCase().trim();
          return productCategory === normalizedCategory || 
                 productCategory.replace(/ /g, '-') === normalizedCategory;
        });
        
        logger.info('Dummy kategori ürünleri döndürülüyor:', filteredProducts.length);
        
        return {
          success: true,
          data: filteredProducts,
          skip: 0,
          limit: filteredProducts.length,
          total: filteredProducts.length
        };
      }
      
      if (!category) {
        logger.warn('Kategori belirtilmeden getByCategory çağrıldı');
        return { success: false, data: [], error: 'Kategori belirtilmedi' };
      }
      
      // URL'de kategori adını kullanırken dikkatli olalım 
      // Bazen kategori adı, bazen slug değeri gelebilir
      const categoryParam = encodeURIComponent(category);
      
      const response = await api.get(`/products/category/${categoryParam}`, {
        params: { limit, skip }
      });
      
      // Eğer sonuç boş gelirse ve bu bir slug ise, direkt API'den tüm ürünleri getirip 
      // kategori filtresini client-side yapalım (hata durumuna karşı)
      if (response?.data?.success && (!response.data.data || response.data.data.length === 0)) {
        // Veri yoksa tüm ürünleri getirip filtrelemeyi deneyelim
        const allProductsResponse = await api.get('/products', {
          params: { limit: 100, skip: 0 } // Daha fazla ürün almaya çalışalım
        });
        
        if (allProductsResponse?.data?.success && allProductsResponse.data.data) {
          // Client-side filtreleme yapalım - hem orijinal adı hem de slug'ı deneyelim
          const filteredProducts = allProductsResponse.data.data.filter(product => {
            if (!product.category) return false;
            
            const productCategory = product.category.toLowerCase().trim();
            const searchCategory = category.toLowerCase().trim();
            
            // Direk eşleşme ya da slug eşleşmesi kontrolü
            return productCategory === searchCategory || 
                   productCategory.replace(/ /g, '-') === searchCategory;
          });
          
          if (filteredProducts.length > 0) {
            return {
              success: true,
              data: filteredProducts,
              skip,
              limit,
              total: filteredProducts.length
            };
          }
        }
      }
      
      return {
        success: response?.data?.success || false,
        data: response?.data?.data || [],
        skip: response?.data?.skip || skip,
        limit: response?.data?.limit || limit,
        total: response?.data?.total || 0
      };
    } catch (error) {
      logger.error('Kategori ürünleri getirme hatası:', error.message, 'category:', category);
      
      if (USE_DUMMY_DATA) {
        // Kategori adını normalize et
        const normalizedCategory = category.toLowerCase().trim();
        
        // Dummy verilerden kategori ile eşleşen ürünleri filtrele
        const filteredProducts = DUMMY_DATA.products.filter(product => {
          const productCategory = product.category.toLowerCase().trim();
          return productCategory === normalizedCategory || 
                 productCategory.replace(/ /g, '-') === normalizedCategory;
        });
        
        return {
          success: true,
          data: filteredProducts,
          skip: 0,
          limit: filteredProducts.length,
          total: filteredProducts.length
        };
      }
      
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
      // Sipariş göndermeden önce adres kontrolü yap
      if (!orderData.shippingAddress || !orderData.shippingAddress.fullName) {
        logger.error('Sipariş oluşturma hatası:', { error: 'shippingAddress.fullName alanı gerekli', orderTotal: orderData.totalAmount, items: orderData.items.length });
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
        message: response?.data?.message,
        orderTotal: orderData.totalAmount, 
        items: orderData.items.length 
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
        data: error.response?.data,
        orderTotal: orderData.totalAmount, 
        items: orderData.items.length 
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
      // Önbellek header'larını kaldırıp sadece API çağrısına odaklanıyoruz
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
      // API çağrısı daha güçlü hata yakalama ile
      const response = await api.put(`/users/${userId}`, { role });
      
      // Başarılı API yanıtı
      if (response?.data?.success) {
        return { 
          success: true, 
          data: response.data.data,
          message: 'Kullanıcı rolü başarıyla güncellendi'
        };
      }
      
      // Başarısız API yanıtı - detaylı hata mesajı
      return {
        success: false,
        error: response?.data?.message || 'Rol güncelleme işlemi başarısız oldu'
      };
    } catch (error) {
      // Hata detaylarını göster
      const errorMessage = error?.response?.data?.message || error.message || 'Rol güncelleme sırasında bir hata oluştu';
      logger.error('Rol güncelleme hatası:', { errorDetails: error.toString(), errorMessage });
      
      // Hata yanıtını döndür
      return {
        success: false,
        error: errorMessage
      };
    }
  },
  
  // Önbelleği temizleme fonksiyonu (client-side)
  invalidateCache: async () => {
    try {
      logger.info('Client-side önbellek temizleniyor...');
      
      // Tarayıcı önbelleğini temizle
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }
      
      // LocalStorage'dan geçici verileri temizle
      localStorage.removeItem('needsRefresh');
      localStorage.removeItem('lastRoleChange');
      
      return { success: true };
    } catch (error) {
      logger.error('Önbellek temizleme hatası:', { error: error.message });
      return { success: false, error: error.message };
    }
  },
  
  // Profil işlemleri
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