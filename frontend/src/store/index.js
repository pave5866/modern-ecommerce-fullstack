import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth Store
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      }),
      
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData },
      })),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Cart Store
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      // Sepete ürün ekle
      addItem: (product) => set((state) => {
        const existingItem = state.items.find((item) => item.id === product.id);
        
        if (existingItem) {
          // Ürün zaten sepette, miktarı artır
          return {
            items: state.items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          };
        }
        
        // Ürün sepette değil, yeni ekle
        return {
          items: [...state.items, { ...product, quantity: 1 }],
        };
      }),
      
      // Sepetten ürün çıkar
      removeItem: (productId) => set((state) => ({
        items: state.items.filter((item) => item.id !== productId),
      })),
      
      // Ürün miktarını güncelle
      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        ),
      })),
      
      // Sepeti boşalt
      clearCart: () => set({ items: [] }),
      
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
    }
  )
);

// Theme Store
export const useThemeStore = create(
  persist(
    (set) => ({
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
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