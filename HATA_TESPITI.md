# API ve Backend Bağlantı Sorunları Hata Tespiti

Bu belge, projede yaşanan API bağlantı sorunlarını ve çözüm önerilerini içermektedir.

## Gözlemlenen Sorunlar

1. **Ürün verileri MongoDB'den değil dummy verilerden geliyor:**
   - Ürün isimleri ve fotoğraflar birbirine uymuyor (Örn: "Siyah T-shirt" başlığı altında köpek fotoğrafı)
   - Network sekmesinde sürekli hatalar görülüyor

2. **Network hataları:**
   - `net::ERR_...` hatalarının sık görülmesi (CORS veya bağlantı sorunları)
   - API isteklerinin backend'e ulaşmaması

## Sorunun Nedenleri

Sorunun birkaç muhtemel nedeni olabilir:

1. **Backend API Erişimi Sorunları:**
   - Render.com'da barındırılan backend hizmeti uykuda olabilir (ücretsiz planda süresiz çalışmaz)
   - Backend sunucusu çalışmıyor olabilir
   - CORS ayarları doğru yapılandırılmamış olabilir

2. **Netlify Yapılandırma Sorunları:**
   - Proxy konfigürasyonu düzgün çalışmıyor olabilir
   - Environment değişkenleri doğru ayarlanmamış olabilir
   - Build process sırasında .env değişkenleri doğru şekilde enjekte edilmiyor olabilir

3. **Frontend Kod Sorunları:**
   - api.js'deki API URL sabit kodlanmış olabilir (hardcoded)
   - Dummy veri ayarı etkinleştirilmiş olabilir

## Test Edilmesi Gereken Adımlar

### 1. Backend API'nin Çalışıp Çalışmadığını Kontrol Edin

```
https://modern-ecommerce-fullstack.onrender.com/api/products
```

Tarayıcınızda yukarıdaki URL'yi açarak API'nin çalışıp çalışmadığını kontrol edin:

- Eğer JSON verileri görüyorsanız, backend çalışıyor demektir
- Eğer hata alıyorsanız, backend çalışmıyor veya uykuda olabilir

### 2. CORS Sorunlarını Kontrol Edin

CORS sorunlarını gidermek için:

1. Backend'in CORS ayarlarını kontrol edin:
   - `backend/app.js` veya `backend/server.js` dosyasında CORS başlıklarının doğru şekilde ayarlandığından emin olun

2. Frontend'in CORS ayarlarını kontrol edin:
   - `netlify.toml` dosyasında CORS başlıklarının doğru şekilde ayarlandığından emin olun

### 3. Frontend Yapılandırmasını Kontrol Edin

1. `.env` dosyasındaki değişkenleri kontrol edin:
   ```
   VITE_APP_API_URL=https://modern-ecommerce-fullstack.onrender.com/api
   VITE_APP_USE_DUMMY_DATA=false
   ```

2. Netlify dashboard'dan environment değişkenlerini kontrol edin:
   - `Site settings > Build & deploy > Environment > Environment variables`

3. `api.js` dosyasındaki `USE_DUMMY_DATA` değerini kontrol edin:
   - `USE_DUMMY_DATA = false` olduğundan emin olun

## Çözüm Stratejileri

### Acil Çözüm: Dummy Veri Kullanımı

Backend bağlantısı sorunu giderilene kadar geçici olarak dummy veri kullanımına geçilmiştir:

1. `api.js` dosyasında `USE_DUMMY_DATA = true` yapılmıştır
2. API istekleri ve yanıtları için interceptor'lar geliştirilmiştir
3. Uyumlu ürün verileri ve görselleri tanımlanmıştır

Bu geçici çözüm sayesinde:
- Network hataları ortadan kalkacak
- Ürün görselleri ve isimleri birbirine uyumlu olacak
- Kullanıcı deneyimi kesintisiz devam edecek

### Kalıcı Çözüm Adımları

1. **Backend'i Kontrol Edin:**
   - Render.com dashboard'dan backend'in çalışıp çalışmadığını kontrol edin
   - Eğer uykudaysa, uyandırmak için bir HTTP isteği gönderin
   - Logları kontrol ederek sorunları tespit edin

2. **Backend CORS Ayarlarını Güncelleyin:**
   ```javascript
   // backend/server.js veya app.js
   app.use(cors({
     origin: '*',
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
   }));
   ```

3. **Netlify Yeniden Yapılandırın:**
   - Tüm önbelleği temizleyin: `Site settings > Build & deploy > Clear cache and deploy site`
   - Environment değişkenlerini güncelleyin
   - Ek CORS başlıkları ekleyin

## Sonuç

Şu anda geçici çözüm olarak dummy veri kullanımına geçilmiştir. Dummy veriler gerçekçi ürün bilgileri ve uyumlu görseller içermektedir. Backend bağlantısı düzeltildikten sonra, tekrar gerçek verilere geçmek için:

1. `api.js` dosyasında `USE_DUMMY_DATA = false` yapın
2. Netlify'da yeni bir deployment başlatın
3. Browser önbelleğini temizleyin (Ctrl+F5 veya Shift+F5)

Bu kılavuz, yaşanan sorunları çözmek için adım adım takip edilmelidir. Eğer sorunlar devam ederse, daha kapsamlı bir hata ayıklama gerekebilir.