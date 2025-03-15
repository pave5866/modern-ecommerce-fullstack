# Admin Kullanıcısı Oluşturma ve Kullanma Talimatları

Bu belge, admin rolüne sahip bir kullanıcı oluşturma ve bu kullanıcıyla sisteme giriş yaparak ürün ekleme işlemlerini açıklar.

## Admin Kullanıcı Bilgileri

Aşağıdaki bilgilerle admin kullanıcısı oluşturulmuştur:

- **E-posta:** kerdem5866@gmail.com
- **Şifre:** Salako5866.
- **Rol:** admin

## Admin Kullanıcısı Oluşturma

Admin kullanıcısını oluşturmak için iki farklı yöntem bulunmaktadır:

### 1. MongoDB Bağlantısı ile Oluşturma

Bu yöntem, doğrudan MongoDB veritabanına bağlanarak admin kullanıcısı oluşturur.

1. Backend klasörüne gidin:
   ```
   cd backend
   ```

2. Gerekli paketleri yükleyin:
   ```
   npm install
   ```

3. Admin kullanıcısı oluşturma script'ini çalıştırın:
   ```
   node scripts/createAdminUser.js
   ```

### 2. HTTP İsteği ile Oluşturma

Bu yöntem, backend API'ye HTTP isteği göndererek admin kullanıcısı oluşturur.

1. Backend klasörüne gidin:
   ```
   cd backend
   ```

2. Gerekli paketleri yükleyin:
   ```
   npm install
   ```

3. HTTP isteği ile admin kullanıcısı oluşturma script'ini çalıştırın:
   ```
   node scripts/createAdminUserHttp.js
   ```

## Admin Paneline Erişim

Admin kullanıcısıyla giriş yaptıktan sonra admin paneline erişebilirsiniz:

1. Web sitesine gidin
2. Sağ üst köşedeki "Giriş Yap" butonuna tıklayın
3. E-posta ve şifre bilgilerini girin:
   - E-posta: kerdem5866@gmail.com
   - Şifre: Salako5866.
4. Giriş yaptıktan sonra, üst menüde "Admin Panel" seçeneği görünecektir
5. "Admin Panel" seçeneğine tıklayarak admin paneline erişebilirsiniz

## Ürün Ekleme

Admin panelinden ürün eklemek için:

1. Admin panelinde "Ürünler" sekmesine tıklayın
2. "Yeni Ürün Ekle" butonuna tıklayın
3. Ürün bilgilerini doldurun:
   - Ürün Adı
   - Fiyat
   - Açıklama
   - Kategori
   - Stok Miktarı
   - Ürün Görseli (Dosya yükleme)
4. "Kaydet" butonuna tıklayarak ürünü ekleyin

## Kategori Ekleme

Admin panelinden kategori eklemek için:

1. Admin panelinde "Kategoriler" sekmesine tıklayın
2. "Yeni Kategori Ekle" butonuna tıklayın
3. Kategori adını girin
4. "Kaydet" butonuna tıklayarak kategoriyi ekleyin

## Sorun Giderme

### Giriş Yapamıyorum

Eğer admin kullanıcısıyla giriş yapamıyorsanız:

1. Şifrenizi doğru girdiğinizden emin olun
2. Backend API'nin çalıştığından emin olun
3. Admin kullanıcısının veritabanında var olduğunu kontrol edin
4. Gerekirse admin kullanıcısı oluşturma script'ini tekrar çalıştırın

### Admin Paneli Görünmüyor

Eğer giriş yaptıktan sonra admin paneli görünmüyorsa:

1. Kullanıcı rolünüzün "admin" olduğundan emin olun
2. Tarayıcı önbelleğini temizleyin ve sayfayı yenileyin
3. Çıkış yapıp tekrar giriş yapmayı deneyin

### Ürün Ekleyemiyorum

Eğer ürün eklerken sorun yaşıyorsanız:

1. Tüm zorunlu alanları doldurduğunuzdan emin olun
2. Yüklediğiniz görselin boyutunun çok büyük olmadığından emin olun (max 5MB)
3. Backend API'nin çalıştığından emin olun
4. Network sekmesinde hata mesajlarını kontrol edin

## Önemli Notlar

- Admin kullanıcısı bilgilerini güvenli bir yerde saklayın
- Gerçek bir üretim ortamında, daha güçlü bir şifre kullanmanız önerilir
- Backend API'nin çalışır durumda olduğundan emin olun
- Ürün görselleri için optimize edilmiş (boyutu küçültülmüş) görseller kullanın