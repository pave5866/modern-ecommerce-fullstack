# Netlify Sorun Giderme Kılavuzu

Bu kılavuz, Modern E-Commerce Fullstack uygulamasının Netlify'da deployment sırasında karşılaşabileceğiniz yaygın sorunları ve çözümlerini içerir.

## İçindekiler

1. [API İstekleri Localhost'a Gidiyor](#api-istekleri-localhosta-gidiyor)
2. [Sayfa Yenilemede 404 Hatası](#sayfa-yenilemede-404-hatası)
3. [CORS Hataları](#cors-hataları)
4. [Build Hataları](#build-hataları)
5. [Çevre Değişkenleri Sorunları](#çevre-değişkenleri-sorunları)
6. [Önbellek Sorunları](#önbellek-sorunları)

## API İstekleri Localhost'a Gidiyor

### Sorun
Frontend uygulaması API isteklerini `http://localhost:5000/api` gibi yerel bir adrese gönderiyor.

### Çözüm

1. **API URL'sini Kontrol Edin**:
   - `frontend/src/services/api.js` dosyasında API URL'sinin sabit olarak ayarlandığından emin olun:
   ```javascript
   const API_URL = 'https://modern-ecommerce-fullstack.onrender.com/api';
   ```

2. **Çevre Değişkenlerini Kontrol Edin**:
   - Netlify Dashboard > Site settings > Build & deploy > Environment
   - `VITE_APP_API_URL` değişkeninin doğru ayarlandığından emin olun:
   ```
   VITE_APP_API_URL=https://modern-ecommerce-fullstack.onrender.com/api
   ```

3. **Önbelleği Temizleyin**:
   - Tarayıcı önbelleğini temizleyin (Ctrl+F5 veya Cmd+Shift+R)
   - Netlify'da yeni bir deployment başlatın:
     - Netlify Dashboard > Deploys > Trigger deploy > Deploy site

4. **Proxy Ayarlarını Kontrol Edin**:
   - `netlify.toml` dosyasında API proxy ayarlarının doğru olduğundan emin olun:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://modern-ecommerce-fullstack.onrender.com/api/:splat"
     status = 200
     force = true
   ```

## Sayfa Yenilemede 404 Hatası

### Sorun
Sayfayı yenilediğinizde veya doğrudan bir URL'ye gittiğinizde "Page not found" hatası alıyorsunuz.

### Çözüm

1. **SPA Yönlendirmelerini Kontrol Edin**:
   - `netlify.toml` dosyasında SPA yönlendirmelerinin doğru olduğundan emin olun:
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
     force = true
   ```

2. **_redirects Dosyasını Kontrol Edin**:
   - `frontend/public/_redirects` dosyasının doğru içeriğe sahip olduğundan emin olun:
   ```
   /*  /index.html  200
   ```

3. **Netlify Ayarlarını Kontrol Edin**:
   - Netlify Dashboard > Site settings > Build & deploy > Post processing
   - "Asset optimization" ayarlarının doğru olduğundan emin olun

4. **Yeni Deployment Başlatın**:
   - Netlify Dashboard > Deploys > Trigger deploy > Deploy site

## CORS Hataları

### Sorun
Tarayıcı konsolunda "Access to XMLHttpRequest has been blocked by CORS policy" gibi hatalar görüyorsunuz.

### Çözüm

1. **Backend CORS Ayarlarını Kontrol Edin**:
   - `backend/src/app.js` dosyasında CORS ayarlarının doğru olduğundan emin olun:
   ```javascript
   app.use(cors({
     origin: '*',
     credentials: false,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
   }));
   ```

2. **Netlify CORS Ayarlarını Kontrol Edin**:
   - `netlify.toml` dosyasında CORS header'larının doğru olduğundan emin olun:
   ```toml
   [[headers]]
     for = "/*"
       [headers.values]
       Access-Control-Allow-Origin = "*"
       Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
       Access-Control-Allow-Headers = "Origin, X-Requested-With, Content-Type, Accept, Authorization"
   ```

3. **API Proxy Kullanın**:
   - `netlify.toml` dosyasında API proxy ayarlarının doğru olduğundan emin olun:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://modern-ecommerce-fullstack.onrender.com/api/:splat"
     status = 200
     force = true
   ```

4. **Frontend API İsteklerini Kontrol Edin**:
   - `frontend/src/services/api.js` dosyasında API isteklerinin doğru header'larla yapıldığından emin olun:
   ```javascript
   headers: {
     'Content-Type': 'application/json',
     'Accept': 'application/json',
     'X-Requested-With': 'XMLHttpRequest',
     'Access-Control-Allow-Origin': '*'
   }
   ```

## Build Hataları

### Sorun
Netlify'da build sırasında hatalar alıyorsunuz.

### Çözüm

1. **Build Loglarını Kontrol Edin**:
   - Netlify Dashboard > Deploys > [son deployment] > Deploy log
   - Hata mesajlarını okuyun ve sorunları belirleyin

2. **Node.js Versiyonunu Kontrol Edin**:
   - `frontend/package.json` dosyasında Node.js versiyonunu belirtin:
   ```json
   "engines": {
     "node": ">=14.0.0"
   }
   ```
   - Netlify Dashboard > Site settings > Build & deploy > Environment > Environment variables
   - `NODE_VERSION` değişkenini ekleyin (örn. `NODE_VERSION=16`)

3. **Bağımlılıkları Kontrol Edin**:
   - `frontend/package.json` dosyasında tüm bağımlılıkların doğru versiyonlara sahip olduğundan emin olun
   - Yerel ortamda `npm ci` komutunu çalıştırarak bağımlılıkları test edin

4. **Build Komutunu Kontrol Edin**:
   - Netlify Dashboard > Site settings > Build & deploy > Build settings
   - Build komutunun doğru olduğundan emin olun: `npm run build`

## Çevre Değişkenleri Sorunları

### Sorun
Çevre değişkenleri doğru yüklenmemiş veya erişilemiyor.

### Çözüm

1. **Netlify Çevre Değişkenlerini Kontrol Edin**:
   - Netlify Dashboard > Site settings > Build & deploy > Environment > Environment variables
   - Tüm gerekli değişkenlerin doğru ayarlandığından emin olun

2. **Vite Çevre Değişkenleri Formatını Kontrol Edin**:
   - Vite, çevre değişkenlerini `VITE_` önekiyle kullanır
   - Tüm frontend çevre değişkenlerinin `VITE_` önekine sahip olduğundan emin olun

3. **Çevre Değişkenlerini Kodda Doğru Kullanın**:
   - `frontend/src/services/api.js` dosyasında çevre değişkenlerinin doğru kullanıldığından emin olun:
   ```javascript
   // Doğru kullanım
   const API_URL = 'https://modern-ecommerce-fullstack.onrender.com/api';
   ```

4. **Yeni Deployment Başlatın**:
   - Çevre değişkenlerini güncelledikten sonra yeni bir deployment başlatın

## Önbellek Sorunları

### Sorun
Değişiklikler yapmanıza rağmen eski içerik görüntüleniyor.

### Çözüm

1. **Tarayıcı Önbelleğini Temizleyin**:
   - Tarayıcı önbelleğini temizleyin (Ctrl+F5 veya Cmd+Shift+R)
   - Tarayıcının geliştirici araçlarını açın ve "Disable cache" seçeneğini işaretleyin

2. **Netlify Önbelleğini Temizleyin**:
   - Netlify Dashboard > Deploys > [son deployment] > Preview
   - URL'nin sonuna `?no-cache=1` ekleyin

3. **Cache-Control Header'larını Ayarlayın**:
   - `netlify.toml` dosyasında Cache-Control header'larını ayarlayın:
   ```toml
   [[headers]]
     for = "/*"
       [headers.values]
       Cache-Control = "public, max-age=0, must-revalidate"
   ```

4. **Yeni Deployment Başlatın**:
   - Netlify Dashboard > Deploys > Trigger deploy > Clear cache and deploy site

---

Bu kılavuzla ilgili sorularınız veya sorunlarınız varsa, lütfen GitHub üzerinden bir issue açın.

Son Güncelleme: 15 Mart 2025