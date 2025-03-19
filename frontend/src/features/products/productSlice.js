import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API URL
const API_URL = '/api/products';

// Async Thunk Action: Tüm ürünleri getir
export const getProducts = createAsyncThunk('products/getProducts', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

// Async Thunk Action: Ürün detayını getir
export const getProductDetails = createAsyncThunk('products/getProductDetails', async (id, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

// Async Thunk Action: Kategorileri getir
export const getCategories = createAsyncThunk('products/getCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

// Initial State
const initialState = {
  products: [],
  productDetails: null,
  categories: [],
  loading: false,
  productLoading: false,
  categoriesLoading: false,
  error: null,
  productError: null,
  categoriesError: null,
  success: false,
};

// Slice
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    resetProductDetails: (state) => {
      state.productDetails = null;
      state.productLoading = false;
      state.productError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // getProducts
      .addCase(getProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.success = true;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // getProductDetails
      .addCase(getProductDetails.pending, (state) => {
        state.productLoading = true;
        state.productError = null;
      })
      .addCase(getProductDetails.fulfilled, (state, action) => {
        state.productLoading = false;
        state.productDetails = action.payload;
      })
      .addCase(getProductDetails.rejected, (state, action) => {
        state.productLoading = false;
        state.productError = action.payload;
      })
      
      // getCategories
      .addCase(getCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload;
      });
  },
});

export const { resetProductDetails } = productSlice.actions;
export default productSlice.reducer;