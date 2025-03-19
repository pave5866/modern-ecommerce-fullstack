import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import logger from '../utils/logger';

// Auth Store
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => {
        logger.info('Kullanıcı oturumu başlatılıyor', { email: user?.email });
        set({ 
          user, 
          token, 
          isAuthenticated: true 
        });
      },
      
      logout: () => {
        logger.info('Kullanıcı oturumu sonlandırıldı');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        });
      },
      
      updateUser: (userData) => {
        logger.info('Kullanıcı bilgileri güncelleniyor', { userId: userData?._id });
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          logger.info('Auth store hidrasyonu tamamlandı', { 
            isAuthenticated: state.isAuthenticated 
          });
        }
      }
    }
  )
);

// Cart Store
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      // Sepete ürün ekle
      addItem: (product) => {
        // MongoDB/Supabase uyumluluğu için ID kontrolü
        const productId = product._id || product.id;
        
        if (!productId) {
          logger.error('Sepete ürün eklenirken hata: Ürün ID tanımsız', { product });
          return;
        }
        
        set((state) => {
          // MongoDB/Supabase uyumluluğu için ID kontrolü
          const existingItem = state.items.find((item) => 
            (item._id && item._id === productId) || 
            (item.id && item.id === productId)
          );
          
          if (existingItem) {
            // Ürün zaten sepette, miktarı artır
            logger.info('Sepetteki ürün miktarı artırılıyor', { 
              productId, 
              newQuantity: existingItem.quantity + 1 
            });
            
            return {
              items: state.items.map((item) =>
                (item._id === productId || item.id === productId)
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          
          // Ürün sepette değil, yeni ekle - ID tutarlılığını sağla
          const newItem = { 
            ...product, 
            _id: productId, 
            id: productId, 
            quantity: 1 
          };
          
          logger.info('Sepete yeni ürün ekleniyor', { productId });
          
          return {
            items: [...state.items, newItem],
          };
        });
      },
      
      // Sepetten ürün çıkar
      removeItem: (productId) => {
        logger.info('Sepetten ürün kaldırılıyor', { productId });
        
        set((state) => ({
          items: state.items.filter((item) => 
            item._id !== productId && item.id !== productId
          ),
        }));
      },
      
      // Ürün miktarını güncelle
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          logger.warn('Geçersiz miktar', { productId, quantity });
          return;
        }
        
        logger.info('Ürün miktarı güncelleniyor', { productId, quantity });
        
        set((state) => ({
          items: state.items.map((item) =>
            (item._id === productId || item.id === productId) 
              ? { ...item, quantity } 
              : item
          ),
        }));
      },
      
      // Sepeti boşalt
      clearCart: () => {
        logger.info('Sepet temizleniyor');
        set({ items: [] });
      },
      
      // Toplam ürün sayısı
      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },
      
      // Toplam fiyat
      getTotalPrice: () => {
        const state = get();
        return state.items.reduce(
          (total, item) => total + item.price * item.quantity, 
          0
        );
      },
    }),
    {
      name: 'cart-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          logger.info('Sepet store hidrasyonu tamamlandı', { 
            itemCount: state.items.length 
          });
        }
      }
    }
  )
);

// Theme Store
export const useThemeStore = create(
  persist(
    (set) => ({
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      toggleDarkMode: () => set((state) => {
        const newDarkMode = !state.darkMode;
        
        logger.info('Tema değiştirildi', { 
          darkMode: newDarkMode 
        });
        
        // HTML class'ını da güncelle
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        return { darkMode: newDarkMode };
      }),
    }),
    {
      name: 'theme-storage',
    }
  )
);

export default {
  useAuthStore,
  useCartStore,
  useThemeStore,
};