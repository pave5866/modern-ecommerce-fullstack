import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://modern-ecommerce-fullstack.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    },
    // CORS sorunlarını önlemek için
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Netlify için özel ayarlar
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  },
  // Netlify için özel ayarlar
  base: '/',
  // Çevre değişkenleri için
  define: {
    'process.env.VITE_APP_API_URL': JSON.stringify('https://modern-ecommerce-fullstack.onrender.com/api')
  }
})