# Netlify Deployment Güncelleme Kılavuzu

Bu kılavuz, Netlify'da dağıtılmış olan e-ticaret uygulamamızın API isteklerini gerçek backend sunucusuna doğru şekilde yönlendirmek için yapılan güncellemeleri içerir.

## Yapılan Değişiklikler

1. **API Yapılandırması Güncellendi**
   - `frontend/src/services/api.js` dosyasında `USE_DUMMY_DATA` değişkeni `false` olarak ayarlandı.
   - API URL'i doğrudan Render.com sunucusuna yönlendirildi: `https://modern-ecommerce-fullstack.onrender.com/api`

2. **Netlify Yapılandırması Güncellendi**
   - Root dizine `netlify.toml` dosyası eklendi ve CORS ayarları güncellendi.
   - SPA yönlendirmeleri için gerekli olan `_redirects` dosyaları eklendi.

## Redeployment Adımları

Netlify'da sitenizi yeniden dağıtmak için şu adımları izleyin:

1. Netlify Dashboard'a gidin: [https://app.netlify.com/](https://app.netlify.com/)
2. Projenizi seçin
3. **Deploys** sekmesine gidin
4. **Trigger deploy** > **Deploy site** düğmesine tıklayın

## Çevre Değişkenleri

Uygulama artık sabit bir API URL'si kullanıyor, ancak isterseniz Netlify'da çevre değişkenleri ile bu değeri geçersiz kılabilirsiniz:

1. Netlify Dashboard'da projenizi seçin
2. **Site settings** > **Build & deploy** > **Environment** sekmesine gidin
3. Aşağıdaki değişkeni ekleyin (ihtiyaç duyarsanız):
   - Key: `VITE_APP_API_URL` 
   - Value: `https://modern-ecommerce-fullstack.onrender.com/api` (veya kendi API URL'iniz)

## API İsteklerini İzleme

Uygulama çalışırken tarayıcınızın geliştirici araçlarını (F12) açın ve Network sekmesini kontrol edin:

1. API isteklerinin `https://modern-ecommerce-fullstack.onrender.com/api` adresine gittiğinden emin olun
2. CORS hatası olmadığını doğrulayın
3. Yanıtların başarılı olduğunu (200 OK) kontrol edin

## Sorun Giderme

CORS hatalarıyla karşılaşırsanız:

1. Backend sunucunuzun CORS ayarlarını kontrol edin
2. Netlify'da `netlify.toml` dosyasının doğru şekilde uygulandığını doğrulayın
3. Gerekirse `frontend/src/services/api.js` dosyasında `USE_DUMMY_DATA = true` olarak geçici bir çözüm kullanabilirsiniz

API istekleri hala localhost'a gidiyorsa:

1. Tarayıcı önbelleğini temizleyin
2. Yeniden deploy yapın
3. Hard refresh yapın (Ctrl+F5 veya Cmd+Shift+R)

## İletişim

Herhangi bir sorunla karşılaşırsanız, lütfen geliştirici ekibiyle iletişime geçin.