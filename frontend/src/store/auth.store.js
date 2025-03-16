import { create } from 'zustand'
import { authAPI } from '../services/api'
import { showToast } from '../utils/toast'
import logger from '../utils/logger'
import { useCartStore } from './cartStore'

export const useAuthStore = create((set) => ({
  user: (() => {
    try {
      const savedUser = localStorage.getItem('user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })(),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  register: async (data) => {
    try {
      const response = await authAPI.register(data)
      const { data: { user, token } } = response

      if (user && token) {
        // Admin kullanıcı kaydı yapıldığında sepeti temizle
        if (user.role === 'admin') {
          const clearCart = useCartStore.getState().clearCart;
          clearCart();
          logger.info('Admin kullanıcı kaydı yapıldı, sepet temizlendi');
        }
        
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      }
      
      return response
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Kayıt olurken bir hata oluştu')
      throw error
    }
  },

  login: async (data) => {
    try {
      logger.info('Login isteği başlatılıyor', { email: data.email });
      
      // Detaylı hata yakalama ve loglama yapısı
      try {
        const response = await authAPI.login(data);
        logger.info('Login yanıtı alındı', { status: response?.status });

        if (response?.data?.success && response?.data?.data) {
          const { user, token } = response.data.data;
          
          if (user && token) {
            // Admin kullanıcı giriş yaptığında sepeti temizle
            if (user.role === 'admin') {
              // Sepeti temizle
              const clearCart = useCartStore.getState().clearCart;
              clearCart();
              logger.info('Admin kullanıcı girişi yapıldı, sepet temizlendi');
            }
            
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
            set({ user, token, isAuthenticated: true });
            return response;
          }
        } else {
          throw new Error(response?.data?.message || 'Geçersiz giriş bilgileri');
        }
      } catch (innerError) {
        logger.error('Login işlem hatası:', { 
          message: innerError.message,
          status: innerError.response?.status,
          data: innerError.response?.data
        });
        throw innerError;
      }
      
      throw new Error('Geçersiz sunucu yanıtı');
    } catch (error) {
      logger.error('Login üst seviye hata:', { error: error.message });
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      logger.error('Logout error:', { error: error.message })
    } finally {
      // Kullanıcı çıkış yaptığında sepeti temizle
      const clearCart = useCartStore.getState().clearCart;
      clearCart();
      logger.info('Kullanıcı çıkış yaptı, sepet temizlendi');
      
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      set({ user: null, token: null, isAuthenticated: false })
    }
  },

  updateUser: async (data) => {
    try {
      const response = await authAPI.update(data)
      const updatedUser = response?.data?.user || response?.data || response?.user || response

      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser))
        set({ user: updatedUser })
      }

      return response
    } catch (error) {
      logger.error('Profil güncelleme hatası:', { error: error.message })
      throw error
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await authAPI.forgotPassword({ email })
      return response.data
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Bir hata oluştu')
      throw error
    }
  },

  resetPassword: async (token, password) => {
    try {
      const response = await authAPI.resetPassword(token, { password })
      return response.data
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Bir hata oluştu')
      throw error
    }
  }
}))