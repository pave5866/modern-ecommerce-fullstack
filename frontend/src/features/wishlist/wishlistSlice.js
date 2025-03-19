import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item._id === product._id);
      
      if (existingItem) {
        // Eğer ürün zaten favorilerde varsa, çıkar
        state.items = state.items.filter(item => item._id !== product._id);
      } else {
        // Eğer ürün favorilerde yoksa, ekle
        state.items.push(product);
      }
    },
    
    addToWishlist: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item._id === product._id);
      
      if (!existingItem) {
        state.items.push(product);
      }
    },
    
    removeFromWishlist: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter(item => item._id !== id);
    },
    
    clearWishlist: (state) => {
      state.items = [];
    },
  },
});

export const { toggleWishlist, addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;