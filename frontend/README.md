# Modern E-ticaret Frontend

Modern E-ticaret Uygulaması için React tabanlı frontend projesi.

## Özellikler

- React + Vite tabanlı modern geliştirme ortamı
- TailwindCSS ile responsive tasarım
- Karanlık/Aydınlık mod desteği
- React Router DOM ile sayfa yönlendirme
- Axios ile API istekleri
- Supabase entegrasyonu
- Modern UI/UX tasarımı
- Mobil ve tablet uyumlu arayüz

## Kurulum

Projeyi yerel ortamınızda çalıştırmak için:

```bash
cd frontend
npm install
npm run dev
```

## Geliştirme

```bash
# Geliştirme sunucusunu başlat
npm run dev

# Uygulamayı derle
npm run build

# Derlenmiş uygulamayı önizle
npm run preview
```

## Dağıtım (Deploy)

Render.com veya benzeri bir platform üzerinde dağıtım yapabilirsiniz:

1. Render.com'da yeni bir "Static Site" servis oluşturun
2. GitHub reponuzu bağlayın
3. Build Command: `npm install && npm run build`
4. Publish directory: `dist`
5. Environment variables olarak aşağıdaki değerleri ekleyin:
   - `VITE_API_URL`: Backend API URL'i
   - `VITE_SUPABASE_URL`: Supabase URL'i
   - `VITE_SUPABASE_ANON_KEY`: Supabase Anonim Anahtarı

## Klasör Yapısı

```
/src
  /components       # Yeniden kullanılabilir UI bileşenleri
  /pages            # Uygulama sayfaları
  /utils            # Yardımcı fonksiyonlar
  /store            # (Gelecekte) Zustand state yönetimi
  /hooks            # (Gelecekte) Özel React hook'ları
  App.jsx           # Ana uygulama bileşeni
  main.jsx          # Giriş noktası
```

## Teknolojiler

- React 18
- React Router DOM 6
- TailwindCSS
- Axios
- Supabase
- Vite
- React Icons