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
    // Yarı boş modüllere izin ver
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    // Bağımlılık hatalarını görmezden gel
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('redux') || id.includes('axios')) {
              return 'vendor';
            }
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'ui';
            }
            // Diğer node_modules paketleri için
            return 'deps';
          }
        }
      },
    },
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