# ModernShop - Modern Full Stack E-Ticaret Uygulaması

Modern teknolojiler kullanılarak geliştirilen tam kapsamlı e-ticaret uygulaması. Supabase ve React teknolojileri kullanılmıştır.

## Teknolojiler

### Frontend
- React 18
- React Router 6
- TanStack Query (React Query)
- Tailwind CSS
- DaisyUI
- Vite

### Backend
- Node.js
- Express
- Supabase
- JWT Authentication

## Özellikler

- Responsive tasarım (Mobil, tablet ve masaüstü uyumlu)
- Kullanıcı kaydı ve girişi
- Ürün listeleme ve filtreleme
- Ürün detay sayfaları
- Sepet yönetimi
- Sipariş oluşturma ve takibi
- Ürün yorumları ve puanlama
- Admin paneli
  - Ürün yönetimi
  - Kategori yönetimi
  - Sipariş yönetimi
  - Kullanıcı yönetimi
  - İstatistikler

## Kurulum

### Gereksinimler
- Node.js 16+
- Supabase hesabı

### Adımlar

1. Repoyu klonlayın
```
git clone https://github.com/username/modernshop.git
cd modernshop
```

2. Bağımlılıkları yükleyin
```
# Backend için
cd backend
npm install

# Frontend için
cd ../frontend
npm install
```

3. `.env` dosyasını yapılandırın
   - Backend ve frontend için `.env.example` dosyalarını kopyalayın ve `.env` olarak yeniden adlandırın
   - Gerekli ortam değişkenlerini doldurun (Supabase URL ve API Key)

4. Uygulamayı başlatın
```
# Backend için
cd backend
npm run dev

# Frontend için
cd ../frontend
npm run dev
```

## Supabase Yapılandırması

### Tablolar
- profiles: Kullanıcı profilleri
- products: Ürünler
- categories: Kategoriler
- orders: Siparişler
- order_items: Sipariş ürünleri
- reviews: Ürün yorumları
- coupons: İndirim kuponları

### Storage
- products: Ürün görselleri için bucket

## Lisans
MIT