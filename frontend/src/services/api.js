import axios from 'axios';
import { logger } from '../utils/logger';

// Base API URL - .env dosyasından al veya varsayılanı kullan
const API_URL = import.meta.env.VITE_API_URL || 'https://modern-ecommerce-fullstack.onrender.com/api';

// CORS sorunları için yedek API URL'leri
const BACKUP_API_URLS = [
  'https://modern-ecommerce-fullstack.onrender.com/api',
  'https://api.modern-ecommerce-fullstack.com/api',
  'https://cors-anywhere.herokuapp.com/https://modern-ecommerce-fullstack.onrender.com/api'
];

// Dummy veri - geliştirme aşamasında kullanılır
const PRODUCTS = [
  {
    _id: '1',
    name: 'Kablosuz Kulaklık',
    price: 999.99,
    description: 'Yüksek kaliteli ses deneyimi sunan kablosuz kulaklık.',
    category: 'Elektronik',
    stock: 15,
    images: [
      'https://res.cloudinary.com/dlkrduwav/image/upload/v1716065896/headphones_1_eesk0k.jpg',
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'Bluetooth Hoparlör',
    price: 799.99,
    description: 'Taşınabilir bluetooth hoparlör, 10 saat pil ömrü.',
    category: 'Elektronik',
    stock: 10,
    images: [
      'https://res.cloudinary.com/dlkrduwav/image/upload/v1716066033/speaker_xjjr3i.jpg',
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: '3',
    name: 'Akıllı Saat',
    price: 1999.99,
    description: 'Fitness takibi, kalp ritmi ölçümü ve bildirimler.',
    category: 'Elektronik',
    stock: 8,
    images: [
      'https://res.cloudinary.com/dlkrduwav/image/upload/v1716066082/smartwatch_yjskbo.jpg',
    ],
    createdAt: new Date().toISOString()
  }
];

const CATEGORIES = [
  'Elektronik',
  'Giyim',
  'Kitap',
  'Ev & Yaşam',
  'Kozmetik',
  'Spor',
  'Oyuncak'
];

const USERS = [
  {
    _id: '1',
    name: 'Ali Yılmaz',
    email: 'ali@example.com',
    createdAt: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'Ayşe Demir',
    email: 'ayse@example.com',
    createdAt: new Date().toISOString()
  }
];

const ORDERS = [
  {
    _id: '1',
    user: {
      _id: '1',
      name: 'Ali Yılmaz'
    },
    products: [
      {
        product: {
          _id: '1',
          name: 'Kablosuz Kulaklık',
          price: 999.99
        },
        quantity: 1
      }
    ],
    total: 999.99,
    status: 'Tamamlandı',
    createdAt: new Date().toISOString()
  },
  {
    _id: '2',
    user: {
      _id: '2',
      name: 'Ayşe Demir'
    },
    products: [
      {
        product: {
          _id: '2',
          name: 'Bluetooth Hoparlör',
          price: 799.99
        },
        quantity: 1
      }
    ],
    total: 799.99,
    status: 'İşleniyor',
    createdAt: new Date().toISOString()
  }
];

// Dummy veri kullanılsın mı
const USE_DUMMY_DATA = false;

// API çağrıları için Axios instance oluştur
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // CORS ve çerezlerle ilgili
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Gerçek API'ye bağlanılamadığında, alternatif endpoint dene
let currentUrlIndex = 0;

const switchToBackupUrl = () => {
  currentUrlIndex = (currentUrlIndex + 1) % BACKUP_API_URLS.length;
  api.defaults.baseURL = BACKUP_API_URLS[currentUrlIndex];
  logger.info(`API endpoint değiştirildi: ${api.defaults.baseURL}`);
  return api.defaults.baseURL;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // İstek logla
    logger.debug('API İstek:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      params: config.params,
      data: config.data
    });

    // Auth header ekle
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    logger.error('API İstek Hatası:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    logger.debug('API Yanıt:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  async (error) => {
    logger.error('API Yanıt Hatası:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // 401 Unauthorized yanıtı - token yenileme veya logout
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // CORS hatası veya ağ hatası - başka bir API endpoint dene
    if (error.message === 'Network Error' || 
        (error.response && error.response.status === 0) ||
        error.code === 'ERR_NETWORK') {
      
      // Canlı ortamda alternatif URL'yi dene
      if (process.env.NODE_ENV === 'production') {
        const newUrl = switchToBackupUrl();
        const originalRequest = error.config;
        originalRequest.baseURL = newUrl;
        return api(originalRequest);
      }
      
      // Geliştirme aşamasında - dummy veri kullan
      if (USE_DUMMY_DATA) {
        const originalRequest = error.config;
        const endpoint = originalRequest.url;
        const method = originalRequest.method;

        // Dummy veri yanıtı oluştur
        if (endpoint.includes('/products') && method === 'get') {
          if (endpoint.includes('/products/') && endpoint.split('/').length > 2) {
            // Tekil ürün
            const id = endpoint.split('/').pop();
            const product = PRODUCTS.find(p => p._id === id);
            if (product) {
              return Promise.resolve({
                status: 200,
                statusText: 'OK',
                data: { success: true, data: product }
              });
            }
          } else {
            // Tüm ürünler
            return Promise.resolve({
              status: 200,
              statusText: 'OK',
              data: { success: true, data: PRODUCTS }
            });
          }
        }
        
        if (endpoint.includes('/products/categories')) {
          return Promise.resolve({
            status: 200,
            statusText: 'OK',
            data: { success: true, data: CATEGORIES }
          });
        }
        
        if (endpoint.includes('/users')) {
          return Promise.resolve({
            status: 200,
            statusText: 'OK',
            data: { success: true, data: USERS }
          });
        }
        
        if (endpoint.includes('/orders')) {
          return Promise.resolve({
            status: 200,
            statusText: 'OK',
            data: { success: true, data: ORDERS }
          });
        }
      }
    }

    return Promise.reject(error);
  }
);

// API yardımcı fonksiyonları
export const get = async (url, params = {}) => {
  try {
    const response = await api.get(url, { params });
    return response.data;
  } catch (error) {
    logger.error('GET hatası:', { url, error: error.message });
    throw error;
  }
};

export const post = async (url, data = {}) => {
  try {
    const response = await api.post(url, data);
    return response.data;
  } catch (error) {
    logger.error('POST hatası:', { url, error: error.message });
    throw error;
  }
};

export const put = async (url, data = {}) => {
  try {
    const response = await api.put(url, data);
    return response.data;
  } catch (error) {
    logger.error('PUT hatası:', { url, error: error.message });
    throw error;
  }
};

export const del = async (url) => {
  try {
    const response = await api.delete(url);
    return response.data;
  } catch (error) {
    logger.error('DELETE hatası:', { url, error: error.message });
    throw error;
  }
};

// Axios Instance ve yardımcı fonksiyonları dışa aktar
export default {
  api,
  get,
  post,
  put,
  del
};