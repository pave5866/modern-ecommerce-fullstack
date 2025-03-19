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
    minify: 'terser',
    // Bundle büyüklük uyarı limitini artır
    chunkSizeWarningLimit: 2000,
    // CSS'leri ayır
    cssCodeSplit: true,
    // Bundle'ı basitleştir
    rollupOptions: {
      // Sorun çıkaran modülleri external olarak tanımla
      external: ['react-toastify'],
      output: {
        // Global değişkenleri tanımla
        globals: {
          'react-toastify': 'ReactToastify',
        },
        // Çıktı formatını düzenle
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        // Modülleri grupla
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Temel dependency'leri vendor'a koy
            return 'vendor';
          }
        }
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
  // Farklı ortamlar için optimizasyonlar
  define: {
    'process.env.NODE_ENV': '"production"'
  },
});