# Canlı Sitede Admin Kullanıcısı Oluşturma ve Kullanma Tanıtımı

Bu belge, canlı sitenizde admin kullanıcısı oluşturma ve kullanma işlemini adım adım açıklar. Bu talimatlar, Netlify'da yayınlanan frontend ve Render.com'da çalışan backend için geçerlidir.

## Hızlı Başlangıç: Admin Kullanıcısı Oluşturma

Netlify'da yayınlanan sitenizde aşağıdaki adımları izleyerek admin kullanıcısı oluşturabilirsiniz:

1. **Kayıt Olma Adımları:**
   - Sitenize gidin (örn: `https://your-site-name.netlify.app`)
   - Sağ üst köşedeki "Kayıt Ol" butonuna tıklayın
   - Formda aşağıdaki bilgileri doldurun:
     - Ad Soyad: Kadir ERDEM
     - E-posta: kerdem5866@gmail.com
     - Şifre: Salako5866.
   - "Kayıt Ol" butonuna tıklayın

2. **Admin Yapma Adımları:**
   - Kaydolduktan sonra, sizin için hazırladığımız özel endpoint'i kullanarak admin yapabilirsiniz
   - Sitenizin tarayıcı konsolunu açın (F12 tuşuna basıp "Console" sekmesini seçin)
   - Aşağıdaki kodu konsola yapıştırın ve Enter tuşuna basın:

   ```javascript
   (async function() {
     try {
       // Önce giriş yapıyoruz
       const loginResponse = await fetch('https://modern-ecommerce-fullstack.onrender.com/api/auth/login', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           email: 'kerdem5866@gmail.com',
           password: 'Salako5866.'
         })
       });
       
       const loginData = await loginResponse.json();
       
       if (!loginData.success) {
         throw new Error('Giriş başarısız: ' + (loginData.error || 'Bilinmeyen hata'));
       }
       
       console.log('Giriş başarılı!');
       
       // Aldığımız token ile admin olma işlemini yapıyoruz
       const token = loginData.token;
       
       const adminResponse = await fetch('https://modern-ecommerce-fullstack.onrender.com/api/admin/self-promote', {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify({
           secretKey: 'Kadire5866ModeRn2024'
         })
       });
       
       const adminData = await adminResponse.json();
       
       if (adminData.success) {
         console.log('🎉 Tebrikler! Admin rolüne yükseltildiniz!');
         console.log('Sayfayı yenileyip Admin Paneline erişebilirsiniz.');
       } else {
         console.error('Admin yapma işlemi başarısız:', adminData.error);
       }
     } catch (error) {
       console.error('İşlem sırasında hata oluştu:', error);
     }
   })();
   ```

3. **Admin Paneline Erişim:**
   - Yukarıdaki kod başarıyla çalıştıktan sonra sayfayı yenileyin
   - Üst menüde "Admin Panel" seçeneği görünecektir
   - "Admin Panel" seçeneğine tıklayarak admin paneline erişebilirsiniz

## Alternatif Yöntem: API İsteği ile Admin Kullanıcısı Oluşturma

Eğer bir API istemcisi (Postman, cURL, vb.) kullanmak istiyorsanız:

1. **Admin Kullanıcısı Oluşturma İsteği:**
   
   ```bash
   curl -X POST https://modern-ecommerce-fullstack.onrender.com/api/admin/create \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Kadir ERDEM",
       "email": "kerdem5866@gmail.com",
       "password": "Salako5866.",
       "secretKey": "Kadire5866ModeRn2024"
     }'
   ```

2. **Giriş Yapma:**
   
   ```bash
   curl -X POST https://modern-ecommerce-fullstack.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "kerdem5866@gmail.com",
       "password": "Salako5866."
     }'
   ```

## Adım Adım: Admin Panelinde Ürün Ekleme

Admin kullanıcısıyla giriş yaptıktan sonra:

1. **Admin Paneline Giriş:**
   - Üst menüde "Admin Panel" seçeneğine tıklayın
   
2. **Ürünler Sayfası:**
   - Sol menüde "Ürünler" seçeneğine tıklayın
   - Sağ üst köşedeki "Yeni Ürün Ekle" butonuna tıklayın
   
3. **Ürün Bilgilerini Doldurma:**
   - **Ürün Adı:** İstediğiniz bir isim (örn: "Siyah T-Shirt")
   - **Fiyat:** Ürün fiyatı (örn: 149.99)
   - **Açıklama:** Ürün açıklaması (örn: "Rahat ve şık siyah t-shirt")
   - **Kategori:** Kategori seçin veya yeni ekleyin (örn: "Giyim")
   - **Stok Miktarı:** Stok sayısı (örn: 50)
   
4. **Ürün Görseli Yükleme:**
   - "Görsel Seç" butonuna tıklayın
   - Bilgisayarınızdan bir görsel seçin (önerilen boyut: 800x800px)
   - "Yükle" butonuna tıklayın
   
5. **Ürünü Kaydetme:**
   - Tüm bilgileri doldurduktan sonra "Kaydet" butonuna tıklayın
   - Başarılı bir şekilde kaydedildikten sonra ürünler listesine yönlendirileceksiniz

## Adım Adım: Admin Panelinde Kategori Ekleme

Admin kullanıcısıyla giriş yaptıktan sonra:

1. **Admin Paneline Giriş:**
   - Üst menüde "Admin Panel" seçeneğine tıklayın
   
2. **Kategoriler Sayfası:**
   - Sol menüde "Kategoriler" seçeneğine tıklayın
   - Sağ üst köşedeki "Yeni Kategori Ekle" butonuna tıklayın
   
3. **Kategori Bilgilerini Doldurma:**
   - **Kategori Adı:** İstediğiniz bir isim (örn: "Giyim", "Elektronik")
   - **Açıklama:** (İsteğe bağlı) Kategori açıklaması
   
4. **Kategoriyi Kaydetme:**
   - "Kaydet" butonuna tıklayın
   - Başarılı bir şekilde kaydedildikten sonra kategoriler listesine yönlendirileceksiniz

## Sık Karşılaşılan Sorunlar ve Çözümleri

### 1. Giriş Yapamıyorum

**Olası Çözümler:**
- Doğru e-posta ve şifre kullandığınızdan emin olun
- Tarayıcı önbelleğini temizleyin (Ctrl+F5)
- Backend API'sinin çalıştığından emin olun
- Konsol sekmesindeki hata mesajlarını kontrol edin

### 2. Admin Paneli Görünmüyor

**Olası Çözümler:**
- Kullanıcı rolünüzün "admin" olduğundan emin olun
- Tarayıcı önbelleğini temizleyin (Ctrl+F5)
- Çıkış yapıp tekrar giriş yapmayı deneyin
- Yukarıdaki admin yapma kodunu tekrar çalıştırın

### 3. Ürün Ekleyemiyorum

**Olası Çözümler:**
- Tüm zorunlu alanları doldurduğunuzdan emin olun
- Görsel boyutunun çok büyük olmadığından emin olun (max 2MB)
- Backend API'sinin çalıştığından emin olun
- Network sekmesinde hata mesajlarını kontrol edin

### 4. Yüklediğim Görseller Görünmüyor

**Olası Çözümler:**
- Görsel formatının desteklendiğinden emin olun (JPG, PNG, WebP)
- Daha küçük boyutlu bir görsel yüklemeyi deneyin
- Network sekmesinde görsel yükleme isteklerinin durumunu kontrol edin
- Backend depolama alanının dolu olmadığından emin olun

## Önemli Güvenlik Notları

- Admin kullanıcı bilgilerinizi güvenli bir yerde saklayın
- İşiniz bittiğinde her zaman "Çıkış Yap" butonunu kullanın
- Gerçek bir üretim ortamında daha güçlü bir şifre kullanmanız önerilir
- Bu belgedeki güvenlik anahtarları sadece test amaçlıdır, gerçek üretim ortamında kullanmayın