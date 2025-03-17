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
const USE_DUMMY_DATA = false; // Dummy veri kullanımını devre dışı bırak

// Local API instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true, // CORS için true olarak değiştirildi
  timeout: 30000 // 30 saniye timeout
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
  withCredentials: true,
  timeout: 30000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Dummy veri kullanımı etkinse, API çağrısını engelle ve dummy veri kullan
    if (USE_DUMMY_DATA) {
      // Bu config'i işaretle, response interceptor'da kullanacağız
      config.useDummyData = true;
      logger.debug('Dummy veri kullanımı etkin, API çağrısı işaretlendi:', config.url);
    }
    
    // LocalStorage'dan token'ı al
    const token = localStorage.getItem('token')
    
    // Token varsa header'a ekle
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    logger.debug('API isteği gönderiliyor:', {
      url: config.url,
      method: config.method,
      data: config.data instanceof FormData ? 'FormData içeriği' : config.data
    });
    
    return config
  },
  (error) => {
    logger.error('API istek hatası:', error.message);
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
      
      logger.debug('Dummy veri kullanılıyor, URL:', url);
      
      // URL'den endpoint'i çıkar
      const endpoint = url.split('/').pop();
      
      // Dummy veri döndür
      if (url.includes('/products') && !url.includes('/categories')) {
        logger.debug('Dummy ürün verileri kullanılıyor');
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
        logger.debug('Dummy kategori verileri kullanılıyor');
        return {
          ...response,
          data: { 
            success: true, 
            data: DUMMY_DATA.categories 
          }
        };
      } else if (url.includes('/users')) {
        logger.debug('Dummy kullanıcı verileri kullanılıyor');
        return {
          ...response,
          data: { 
            success: true, 
            data: DUMMY_DATA.users 
          }
        };
      } else if (url.includes('/orders')) {
        logger.debug('Dummy sipariş verileri kullanılıyor');
        return {
          ...response,
          data: { 
            success: true, 
            data: DUMMY_DATA.orders 
          }
        };
      }
    }
    
    logger.debug('API yanıtı alındı:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    
    return response
  },
  async (error) => {
    // Eğer hata bir yanıt içeriyorsa, detaylı log tut
    if (error.response) {
      logger.error('API yanıt hatası:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // 401 Unauthorized hatası
      if (error.response.status === 401) {
        logger.warn('Oturum süresi doldu veya geçersiz token');
        // localStorage.removeItem('token'); // logout
      }
      
      // CORS hatası durumunda yedek URL'leri dene
      if (error.response.status === 0 || error.message.includes('Network Error')) {
        logger.warn('CORS hatası algılandı, yedek URL deneniyor');
        // Bir sonraki yedek URL'yi dene
        currentBackupUrlIndex = (currentBackupUrlIndex + 1) % BACKUP_API_URLS.length;
        backupApi.defaults.baseURL = BACKUP_API_URLS[currentBackupUrlIndex];
        
        // İsteği yedek API ile tekrarla
        logger.info('İstek yedek URL ile tekrarlanıyor:', backupApi.defaults.baseURL);
        try {
          const response = await backupApi(error.config);
          return response;
        } catch (backupError) {
          logger.error('Yedek URL ile istek başarısız:', backupError.message);
          throw backupError;
        }
      }
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı
      logger.error('API yanıt vermedi:', error.request);
    } else {
      // İstek yapılırken bir hata oluştu
      logger.error('API istek hatası:', error.message);
    }
    
    return Promise.reject(error)
  }
)

// Yardımcı HTTP methodları
export const get = async (url, params = {}) => {
  try {
    const response = await api.get(url, { params })
    return response.data
  } catch (error) {
    logger.error(`GET ${url} hatası:`, error)
    throw error
  }
}

export const post = async (url, data = {}) => {
  try {
    const response = await api.post(url, data)
    return response.data
  } catch (error) {
    logger.error(`POST ${url} hatası:`, error)
    throw error
  }
}

export const put = async (url, data = {}) => {
  try {
    const response = await api.put(url, data)
    return response.data
  } catch (error) {
    logger.error(`PUT ${url} hatası:`, error)
    throw error
  }
}

export const del = async (url) => {
  try {
    const response = await api.delete(url)
    return response.data
  } catch (error) {
    logger.error(`DELETE ${url} hatası:`, error)
    throw error
  }
}

export default api