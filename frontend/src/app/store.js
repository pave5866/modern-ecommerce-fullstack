import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Reducer'ları içe aktarma
import cartReducer from '../features/cart/cartSlice';
import wishlistReducer from '../features/wishlist/wishlistSlice';
import productsReducer from '../features/products/productSlice';

// Auth reducer'ı (eğer yoksa şimdilik boş oluşturalım)
const authReducer = (state = { userInfo: null }, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, userInfo: action.payload };
    case 'LOGOUT':
      return { ...state, userInfo: null };
    default:
      return state;
  }
};

// Redux persist konfigürasyonu
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['cart', 'wishlist', 'auth'], // Sadece bu reducer'lar persist edilecek
};

// Tüm reducer'ları birleştirme
const rootReducer = combineReducers({
  cart: cartReducer,
  wishlist: wishlistReducer,
  products: productsReducer,
  auth: authReducer,
});

// Persist edilmiş reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store oluşturma
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Persist ile çalışabilmek için
    }),
});

// Persistor
export const persistor = persistStore(store);