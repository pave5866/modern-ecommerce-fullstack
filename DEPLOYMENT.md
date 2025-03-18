# Deployment Talimatları

## Frontend Deployment (Netlify)

Bu proje Netlify'a kolayca deploy edilebilir durumdadır.

### Netlify'a Deploy Adımları:

1. **Netlify Hesabına Giriş Yapın**
   - https://app.netlify.com/ adresinden giriş yapın

2. **Yeni Site Oluşturun**
   - "Sites" sayfasına gidin
   - "New site from Git" butonuna tıklayın veya manual drag & drop yöntemini kullanın

3. **Git Repository Bağlayın (Otomatik Deploy için)**
   - GitHub hesabınıza bağlanın
   - Bu repository'yi seçin
   - Aşağıdaki ayarları yapın:
     - Base directory: frontend
     - Build command: npm install && npm run build
     - Publish directory: dist

4. **Manuel Yöntem (Alternatif)**
   - Bu repository'yi klonlayın
   - `cd frontend` ile frontend klasörüne geçin
   - `npm install` ve `npm run build` komutlarını çalıştırın
   - Oluşan `dist` klasörünü Netlify arayüzüne sürükleyip bırakın

## Backend Deployment (Render.com)

Backend için Render.com kullanıldı ve aşağıdaki ayarlar yapıldı:

1. **Web Service Oluşturma**
   - "New +" > "Web Service"
   - Bu repository'nin GitHub bağlantısını seçin
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free

2. **Environment Variables**
   - `PORT`: 4000
   - `JWT_SECRET`: [güvenli bir secret değer]
   - `MONGODB_URI`: [MongoDB bağlantı URI'niz]
   - `CORS_ORIGINS`: https://e-commerce-mernstack.netlify.app,http://localhost:3000,http://localhost:5173

## Dummy Veri Kullanımı

Şu anda frontend, API bağlantısı olmadan dummy verilerle çalışacak şekilde yapılandırılmıştır:

- `frontend/src/services/api.js` dosyasında `USE_DUMMY_DATA = true` olarak ayarlandı
- Frontend, backend bağlantısı olmadan da tamamen çalışabilir durumdadır
- Gerçek API'ye geçmek isterseniz, `USE_DUMMY_DATA = false` olarak değiştirin

## CORS ve Yönlendirme Yapılandırması

- `netlify.toml` ve `_redirects` dosyaları oluşturuldu
- Backend CORS ayarları güncellendi
- SPA yapısı için gerekli tüm yönlendirmeler eklendi

## Sorun Giderme

1. **Netlify'da 404 Hatası**:
   - Site ayarları > "Build & deploy" > "Post processing" kısmını kontrol edin
   - Deploy loglarını inceleyin

2. **API Bağlantı Sorunları**:
   - `USE_DUMMY_DATA` değerini kontrol edin
   - Tarayıcı konsolunda network hatalarını inceleyin
   - CORS hatası durumunda backend yapılandırmasını kontrol edin

## Tüm Dosyalar Hazır!

Tüm gerekli yapılandırma dosyaları eklenmiştir. Netlify'a deploy etmek için tek yapmanız gereken bu repository'yi Netlify'a bağlamak veya frontend/dist klasörünü manuel olarak yüklemektir.