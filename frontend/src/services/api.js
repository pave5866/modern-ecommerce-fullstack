import axios from 'axios';

// API'nin temel URL'si
const API_URL = import.meta.env.VITE_API_URL || 'https://modern-ecommerce-fullstack.onrender.com/api';

// Axios örneği oluşturma
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
});

// API istekleri için interceptor
api.interceptors.request.use(
  (config) => {
    // İstek öncesi yapılacak işlemler
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // İstek hatası durumunda
    console.error('API istek hatası:', error);
    return Promise.reject(error);
  }
);

// API yanıtları için interceptor
api.interceptors.response.use(
  (response) => {
    // Başarılı yanıt
    return response.data;
  },
  (error) => {
    // Hata yanıtı
    console.error('API yanıt hatası:', error.response || error.message);
    
    // Token süresi dolmuşsa
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Kullanıcıyı login sayfasına yönlendir
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Kullanıcı API
export const userAPI = {
  // Kullanıcı kayıt
  register: (userData) => api.post('/auth/register', userData),
  
  // Kullanıcı girişi
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Kullanıcı çıkışı
  logout: () => api.get('/auth/logout'),
  
  // Kullanıcı bilgilerini getir
  getProfile: () => api.get('/users/me'),
  
  // Kullanıcı bilgilerini güncelle
  updateProfile: (userData) => api.put('/users/me', userData),
  
  // Şifre değiştir
  changePassword: (passwordData) => api.put('/users/change-password', passwordData),
  
  // Şifre sıfırlama isteği
  requestPasswordReset: (email) => api.post('/auth/forgot-password', { email }),
  
  // Şifre sıfırlama
  resetPassword: (resetToken, newPassword) => api.post(`/auth/reset-password/${resetToken}`, { password: newPassword }),
};

// Ürün API
export const productAPI = {
  // Tüm ürünleri getir
  getAll: async (limit = 10) => {
    try {
      const response = await api.get(`/products?limit=${limit}`);
      console.log('API getAll yanıtı:', response);
      
      // Backend yanıt formatını kontrol et
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data || []
        };
      }
      
      // Eski format veya geçersiz yanıt
      return {
        success: false,
        data: [],
        error: 'Beklenmeyen API yanıt formatı'
      };
    } catch (error) {
      console.error('Ürünleri getirme hatası:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.message || 'Ürünler getirilirken bir hata oluştu'
      };
    }
  },
  
  // Ürün detayı getir
  getById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      if (response.success && response.data) {
        return {
          success: true,
          product: response.data
        };
      }
      return {
        success: false,
        product: null,
        error: 'Ürün bulunamadı'
      };
    } catch (error) {
      console.error('Ürün detayı getirme hatası:', error);
      return {
        success: false,
        product: null,
        error: error.response?.data?.message || 'Ürün detayı getirilirken bir hata oluştu'
      };
    }
  },
  
  // Ürün oluştur
  create: (productData) => api.post('/products', productData),
  
  // Ürün güncelle
  update: (id, productData) => api.put(`/products/${id}`, productData),
  
  // Ürün sil
  delete: (id) => api.delete(`/products/${id}`),
  
  // Kategorileri getir
  getCategories: async () => {
    try {
      const response = await api.get('/products/categories');
      console.log('API getCategories yanıtı:', response);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data || []
        };
      }
      
      return {
        success: false,
        data: [],
        error: 'Beklenmeyen API yanıt formatı'
      };
    } catch (error) {
      console.error('Kategorileri getirme hatası:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.message || 'Kategoriler getirilirken bir hata oluştu'
      };
    }
  },
  
  // Kategoriye göre ürün ara
  getByCategory: async (category) => {
    try {
      const response = await api.get(`/products/category/${category}`);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        data: [],
        error: 'Beklenmeyen API yanıt formatı'
      };
    } catch (error) {
      console.error('Kategori ürünlerini getirme hatası:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.message || 'Kategori ürünleri getirilirken bir hata oluştu'
      };
    }
  },
  
  // Ürün ara
  search: async (query) => {
    try {
      const response = await api.get(`/products/search?query=${query}`);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        data: [],
        error: 'Beklenmeyen API yanıt formatı'
      };
    } catch (error) {
      console.error('Ürün arama hatası:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.message || 'Ürün araması yapılırken bir hata oluştu'
      };
    }
  },
  
  // Öne çıkan ürünleri getir
  getFeatured: async (limit = 5) => {
    try {
      const response = await api.get(`/products/featured?limit=${limit}`);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        data: [],
        error: 'Beklenmeyen API yanıt formatı'
      };
    } catch (error) {
      console.error('Öne çıkan ürünleri getirme hatası:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.message || 'Öne çıkan ürünler getirilirken bir hata oluştu'
      };
    }
  }
};

// Sipariş API
export const orderAPI = {
  // Sipariş oluştur
  create: (orderData) => api.post('/orders', orderData),
  
  // Kullanıcının siparişlerini getir
  getMyOrders: () => api.get('/orders/me'),
  
  // Sipariş detayı getir
  getById: (id) => api.get(`/orders/${id}`),
  
  // Ödeme yap
  makePayment: (orderId, paymentData) => api.post(`/orders/${orderId}/pay`, paymentData),
  
  // Sipariş durumunu güncelle (admin)
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

// Adres API
export const addressAPI = {
  // Kullanıcı adreslerini getir
  getAll: () => api.get('/addresses'),
  
  // Adres ekle
  create: (addressData) => api.post('/addresses', addressData),
  
  // Adres güncelle
  update: (id, addressData) => api.put(`/addresses/${id}`, addressData),
  
  // Adres sil
  delete: (id) => api.delete(`/addresses/${id}`),
};

// Admin API
export const adminAPI = {
  // Tüm kullanıcıları getir
  getAllUsers: () => api.get('/admin/users'),
  
  // Kullanıcı detayı getir
  getUserById: (id) => api.get(`/admin/users/${id}`),
  
  // Kullanıcı güncelle
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  
  // Kullanıcı sil
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Tüm siparişleri getir
  getAllOrders: () => api.get('/admin/orders'),
  
  // Dashboard istatistiklerini getir
  getDashboardStats: () => api.get('/admin/stats'),
};

// Yorum API
export const reviewAPI = {
  // Ürün yorumlarını getir
  getByProduct: (productId) => api.get(`/reviews/product/${productId}`),
  
  // Yorum ekle
  create: (reviewData) => api.post('/reviews', reviewData),
  
  // Yorum güncelle
  update: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
  
  // Yorum sil
  delete: (id) => api.delete(`/reviews/${id}`),
};

export default api;