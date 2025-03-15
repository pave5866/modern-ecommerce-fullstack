# Netlify Deployment Guide

Bu repo Netlify'a deploy edilebilir. Dummy verilerle çalışması için gerekli yapılandırmalar aşağıdaki gibidir:

## Netlify Deploy Yöntemleri:

### 1. Netlify CLI ile Deploy:

```bash
# Netlify CLI'yi yükleyin
npm install -g netlify-cli

# Netlify hesabınıza giriş yapın
netlify login

# Projeyi deploy edin
cd frontend
npm run build
netlify deploy --prod
```

### 2. Manuel olarak Deploy:

1. Netlify hesabınıza giriş yapın: https://app.netlify.com/
2. "Sites" sayfasına gidin
3. "New site from Git" butonuna tıklayın veya doğrudan dist klasörünü sürükleyip bırakın
4. GitHub reposunu bağlayın ve deploy ayarlarını yapılandırın:
   - Base directory: frontend
   - Build command: npm install && npm run build
   - Publish directory: dist

## Önemli Ayarlar:

1. **Environment Variables**:
   - Site ayarları > "Build & deploy" > "Environment" kısmında:
   - Dummy veri kullanmak için VITE_APP_API_URL değişkenini boş bırakın

2. **Redirect Ayarları**:
   - _redirects ve netlify.toml dosyaları otomatik tanımlanacaktır
   - Eğer SPA yönlendirme sorunları yaşarsanız Site ayarları > "Build & deploy" > "Post processing" > "Asset optimization" bölümünü kontrol edin

## Dummy Veri Kullanımı:

Bu proje şu anki yapılandırmasında otomatik olarak dummy verilerle çalışacak şekilde ayarlanmıştır. Gerçek backend API'ye bağlanmak isterseniz:

1. api.js dosyasında `USE_DUMMY_DATA = false` olarak değiştirin
2. Netlify ortam değişkenlerinde `VITE_APP_API_URL` değerini backend URL'nizle güncelleyin:
   - Örnek: https://modern-ecommerce-fullstack.onrender.com/api
   
## CORS ve Güvenlik Ayarları:

Tüm CORS yapılandırmaları netlify.toml dosyasında tanımlanmıştır. Gerçek backend kullanımında CORS sorunları yaşarsanız backend tarafındaki CORS ayarlarınızı kontrol edin.

## Sorun Giderme:

1. **Sayfa Yenilemede 404 Hatası**: 
   - _redirects dosyasının doğru şekilde publish edildiğinden emin olun

2. **API Bağlantı Hataları**:
   - Network sekmesinden CORS hatalarını kontrol edin
   - Dummy veri kullanımının aktif olduğunu kontrol edin

3. **Sayfa Render Sorunları**:
   - DevTools konsolunda JS hatalarını inceleyin
   - Netlify log'larını kontrol edin