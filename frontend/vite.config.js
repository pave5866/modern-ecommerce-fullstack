import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // react-toastify için alias ekle
      'react-toastify': path.resolve(__dirname, './src/utils/toastify-shim.js')
    },
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    // Bundle büyüklük uyarı limitini artır
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://modern-ecommerce-fullstack.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});