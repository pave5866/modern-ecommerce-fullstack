# MongoDB Veritabanı Verilerinin Kullanımı

Bu kılavuz, projede MongoDB Compass'taki gerçek verileri kullanmak için gerekli ayarları ve sorun giderme adımlarını içerir.

## Yapılan Değişiklikler

1. `api.js` dosyasında:
   - `USE_DUMMY_DATA = false` olarak ayarlandı
   - Dummy veriler tamamen kaldırıldı
   - MongoDB API'sine doğrudan bağlantı sağlandı

2. `.env` dosyasında:
   - `VITE_APP_API_URL=https://modern-ecommerce-fullstack.onrender.com/api`
   - `VITE_APP_USE_DUMMY_DATA=false`

3. `netlify.toml` dosyasında:
   - Backend API'ye yönlendirme için proxy eklendi
   - CORS ayarları güncellendi
   - Environment variables düzenlendi

## Netlify Yeniden Dağıtım Adımları

MongoDB verilerinin doğru şekilde görüntülenmesi için:

1. Netlify'da projenizi açın
2. "Site settings" > "Build & deploy" > "Environment" kısmına gidin
3. Ortam değişkenlerini kontrol edin/ekleyin:
   - `VITE_APP_API_URL`: `https://modern-ecommerce-fullstack.onrender.com/api`
   - `VITE_APP_USE_DUMMY_DATA`: `false`
   - `VITE_APP_ENV`: `production`
4. "Deploys" sekmesine gidip "Clear cache and deploy site" butonuna tıklayın

## Sorun Giderme

### Sorun: Ürün fotoğrafları ve isimleri uyuşmuyor

**Çözüm:** Bu, dummy veri kullanımından kaynaklanan bir sorundur. Şimdi gerçek MongoDB verileri kullanılacağı için bu sorun çözülecektir.

### Sorun: Network sekmesinde hatalar görünüyor

**Çözüm:** 
1. API isteklerinin doğru URL'ye gittiğinden emin olun: Browser'da F12 tuşuna basıp Network sekmesini açın
2. İsteklerin `modern-ecommerce-fullstack.onrender.com/api` adresine gittiğini kontrol edin
3. Eğer localhost'a gidiyorsa:
   - Uygulamayı yeniden başlatın
   - Browser önbelleğini temizleyin
   - Hard refresh yapın (Ctrl+F5)

### Sorun: Veriler yüklenmiyor veya eksik

**Çözüm:**
1. Backend API'nin çalıştığından emin olun: `https://modern-ecommerce-fullstack.onrender.com/api/products` adresine doğrudan bir tarayıcıdan erişerek test edin
2. Eğer API çalışıyorsa ama veriler hala yüklenmiyorsa:
   - Netlify'da "Functions" bölümünde hata olup olmadığını kontrol edin
   - Netlify proxy ayarlarını gözden geçirin
   - Uygulamayı tümüyle yeniden dağıtın

## MongoDB Compass Kullanımı

MongoDB Compass'taki verileri yönetmek için:

1. MongoDB Compass'ı açın
2. `modern-ecommerce` veritabanını seçin
3. İlgili koleksiyonda (products, users, orders, vb.) değişiklik yapabilirsiniz
4. Yaptığınız değişiklikler otomatik olarak uygulamada görüntülenecektir

## Veritabanı Koleksiyonları ve Yapıları

1. **products**: Ürün bilgileri
   - name: Ürün adı
   - price: Fiyat
   - description: Açıklama
   - image: Resim URL'i
   - category: Kategori adı

2. **users**: Kullanıcı bilgileri
   - name: Ad Soyad
   - email: E-posta
   - role: Kullanıcı rolü ("user" veya "admin")

3. **orders**: Sipariş bilgileri
   - user: Kullanıcı ID
   - products: Sipariş ürünleri
   - status: Sipariş durumu
   - totalAmount: Toplam tutar

4. **addresses**: Adres bilgileri
   - user: Kullanıcı ID
   - address: Adres
   - city: Şehir
   - country: Ülke

Bu değişikliklerle MongoDB veritabanındaki gerçek verilerinizi kullanabileceksiniz.