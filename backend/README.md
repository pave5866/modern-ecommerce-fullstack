# ModernShop E-Ticaret Backend

Modern, kapsamlı ve ölçeklenebilir bir e-ticaret platformunun backend bileşeni.

## 🚀 Özellikler

- Kullanıcı Yönetimi & Kimlik Doğrulama
- Ürün & Kategori Yönetimi
- Sepet & Sipariş İşlemleri
- Ödeme Entegrasyonu (Stripe)
- Dosya Yükleme & Depolama (Supabase)
- Güvenli API Endpointleri
- Performans Optimizasyonları
- Kapsamlı Hata Yakalama
- Detaylı Loglama

## 🛠️ Teknolojiler

- **Node.js & Express** - Backend çatısı
- **MongoDB** - Ana veritabanı
- **Supabase** - Dosya depolama ve ikincil veritabanı
- **JWT** - Kimlik doğrulama
- **Pino/Winston** - Loglama
- **Bcrypt** - Şifre hashleme
- **Stripe** - Ödeme işlemleri
- **Joi** - Veri doğrulama

## 🔧 Kurulum

### Gereksinimler

- Node.js (>=16.0.0)
- MongoDB veritabanı
- Supabase hesabı (opsiyonel, dosya depolama için)

### Adımlar

1. Depoyu klonlayın:
   ```
   git clone https://github.com/pave5866/modern-ecommerce-fullstack.git
   cd modern-ecommerce-fullstack/backend
   ```

2. Bağımlılıkları yükleyin:
   ```
   npm install
   ```

3. `.env` dosyasını oluşturun:
   ```
   cp .env.example .env
   ```

4. `.env` dosyasını düzenleyin ve gerekli değerleri girin.

5. Sunucuyu başlatın:
   ```
   npm run dev
   ```

## 🌐 Deployment

### Render.com ile Deploy

1. Render'da yeni bir Web Service oluşturun.
2. Depo URL'si olarak GitHub reponuzu belirtin.
3. Aşağıdaki ayarları yapın:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Auto Deploy**: Enabled

4. Ortam değişkenlerini ekleyin:
   - `NODE_ENV=production`
   - `PORT=10000` (Render varsayılanı)
   - `MONGODB_URI=...`
   - `JWT_SECRET=...`
   - `SUPABASE_URL=...`
   - `SUPABASE_SERVICE_KEY=...`
   - Diğer gerekli env değişkenleri

5. "Create Web Service" butonuna tıklayın.

### Fallback Mekanizmaları

Backend, bazı servisler kullanılamadığında çalışmaya devam edebilmek için fallback mekanizmaları içerir:

- **Supabase bağlantısı kurulamazsa**: Yerel bir test modu devreye girer
- **MongoDB bağlantısı kurulamazsa**: Bellek içi bir veritabanı kullanılır
- **bcrypt/bcryptjs yüklenemezse**: Basit bir şifreleme mekanizması devreye girer

Bu, development ve test ortamlarında bağımlılıklardan biri eksik olsa bile sistemi çalıştırabilmenizi sağlar.

## 📁 Proje Yapısı

```
backend/
├── node_modules/
├── src/
│   ├── config/         # Yapılandırma dosyaları
│   ├── controllers/    # İş mantığı
│   ├── middleware/     # Express middleware'leri
│   ├── models/         # Veritabanı modelleri
│   ├── routes/         # API rotaları
│   ├── utils/          # Yardımcı fonksiyonlar
│   └── server.js       # Ana uygulama
├── .env                # Ortam değişkenleri
├── .env.example        # Örnek env dosyası
├── .gitignore
├── package.json
└── README.md
```

## 📝 API Belgelendirmesi

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/api/v1/auth/register` | POST | Kullanıcı kaydı |
| `/api/v1/auth/login` | POST | Kullanıcı girişi |
| `/api/v1/products` | GET | Ürünleri listeleme |
| `/api/v1/products/:id` | GET | Ürün detayları |
| `/api/v1/orders` | POST | Sipariş oluşturma |
| ... | ... | ... |

Detaylı API belgelendirmesi için [/api/docs](http://localhost:5000/api/docs) adresini ziyaret edin.

## 🤝 Katkıda Bulunma

1. Repoyu forklayın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi pushlayın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📜 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır.

## 🚨 Sorun Giderme

Deployment sorunları için:

1. Log kayıtlarını kontrol edin
2. Tüm ortam değişkenlerinin doğru ayarlandığından emin olun
3. Node.js sürümünün desteklendiğini kontrol edin (>= 16.0.0)
4. package.json dosyasındaki tüm bağımlılıkların yüklendiğinden emin olun
5. MongoDB ve Supabase bağlantılarını test edin

Sorun devam ederse, GitHub issues bölümünden bir issue açın.