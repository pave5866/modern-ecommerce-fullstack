import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      // Sorunlu modülleri dışarıda bırak
      external: [
        'react', 
        'react-dom', 
        'react-router-dom',
        'react-redux',
        '@reduxjs/toolkit',
        'redux-persist',
        'antd',
        '@ant-design/icons'
      ],
      output: {
        // Global değişkenleri tanımla
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react-redux': 'ReactRedux',
          '@reduxjs/toolkit': 'RTK',
          'redux-persist': 'ReduxPersist',
          'antd': 'antd',
          '@ant-design/icons': 'icons',
          'react-router-dom': 'ReactRouterDOM'
        },
        // HTML için gerekli script eklemeleri
        inlineDynamicImports: false,
        // Script yükleme sırası
        manualChunks: undefined
      }
    }
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
  // Hata ayıklama bilgilerini ekle
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    keepNames: true,
  },
});