# Modern E-Ticaret Full Stack Uygulaması

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Bu proje, modern bir full stack e-ticaret uygulamasıdır. Kullanıcı dostu arayüzü, responsive tasarımı ve zengin özellikleriyle kapsamlı bir alışveriş deneyimi sunmaktadır.

## 🌟 Özellikler

* 👤 Kullanıcı kimlik doğrulama ve yetkilendirme
* 🛍️ Ürün listeleme ve filtreleme
* 🛒 Sepet yönetimi
* 💳 Ödeme işlemleri
* 📦 Sipariş takibi
* 👨‍💼 Admin paneli
* 📱 Responsive tasarım (mobil, tablet ve masaüstü uyumlu)
* 🌓 Karanlık/Aydınlık tema desteği
* ✨ Zengin animasyonlar ve geçişler

## 🛠️ Teknolojik Bileşenler

### Frontend

* React.js
* TailwindCSS
* React Query
* Framer Motion
* Heroicons
* Context API
* Zustand (State yönetimi)

### Backend

* Node.js
* Express.js
* MongoDB
* JWT Authentication
* Cloudinary (Resim yükleme)

## 🚀 Canlı Demo

* Frontend: [https://modern-ecommerce-fullstack.netlify.app](https://modern-ecommerce-fullstack.netlify.app)
* Backend API: [https://modern-ecommerce-fullstack.onrender.com/api/v1](https://modern-ecommerce-fullstack.onrender.com/api/v1)

## 📋 Kurulum Gereksinimleri

* Node.js (v16 veya üzeri)
* npm veya yarn
* MongoDB (yerel kurulum veya MongoDB Atlas)
* Git

## 🚀 Kurulum Adımları

### 1\. Projeyi İndirme

```
git clone https://github.com/pave5866/modern-ecommerce-fullstack.git
cd modern-ecommerce-fullstack
```

### 2\. Backend Kurulumu

```
cd backend

# Bağımlılıkları yükleme
npm install

# .env dosyasını oluşturma
```

`.env` dosyasını backend klasöründe oluşturun ve aşağıdaki gibi düzenleyin:

```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
JWT_COOKIE_EXPIRES_IN=7
NODE_ENV=development

# Cloudinary bilgileri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3\. Frontend Kurulumu

```
cd frontend

# Bağımlılıkları yükleme
npm install

# .env dosyasını oluşturma
```

`.env` dosyasını frontend klasöründe oluşturun:

```
VITE_API_URL=http://localhost:5000/api/v1
```

## ▶️ Proje Çalıştırma

### Tüm Bağımlılıkları Kurma

```
npm run install:all
```

### Backend Sunucusunu Başlatma

```
npm run dev:backend
```

Backend sunucu varsayılan olarak `http://localhost:5000` adresinde çalışmaya başlayacaktır.

### Frontend Uygulamasını Başlatma

```
npm run dev:frontend
```

Frontend uygulama varsayılan olarak `http://localhost:5173` adresinde çalışmaya başlayacaktır.

## 🌐 Canlıya Alma (Deployment)

### Backend Deployment - Render.com

1. Render.com hesabı oluşturun
2. "New Web Service" oluşturun 
3. GitHub reponuzu bağlayın
4. Aşağıdaki ayarları yapılandırın:
   - Build Command: `npm install`
   - Start Command: `node backend/src/server.js`
5. Çevre değişkenlerini ekleyin:
   - `PORT`: 5000
   - `MONGODB_URI`: MongoDB Atlas bağlantı URL'iniz
   - `JWT_SECRET`: Güvenli bir anahtar
   - `NODE_ENV`: production
   - `CLOUDINARY_CLOUD_NAME`: Cloudinary bulut adınız
   - `CLOUDINARY_API_KEY`: Cloudinary API anahtarınız
   - `CLOUDINARY_API_SECRET`: Cloudinary API gizli anahtarınız

### Frontend Deployment - Netlify

1. Netlify hesabı oluşturun
2. GitHub reponuzu Netlify ile bağlayın
3. Build ayarlarını yapılandırın:  
   - Base directory: `frontend`
   - Build command: `npm run build`  
   - Publish directory: `dist`
4. Ortam değişkenlerini ekleyin:
   - `VITE_API_URL`: https://modern-ecommerce-fullstack.onrender.com/api/v1

## 💾 Veritabanı Yapılandırması

MongoDB veritabanınızı yapılandırmak için aşağıdaki adımları izleyin:

1. MongoDB Atlas hesabı oluşturun
2. Yeni bir veritabanı oluşturun: `ecommerce`
3. Gerekli koleksiyonlar otomatik olarak oluşturulacaktır

## 👨‍💼 Admin Kullanıcı Oluşturma

İlk admin kullanıcısını oluşturmak için:

1. Normal bir kullanıcı olarak kayıt olun
2. MongoDB veritabanınıza erişin
3. `users` koleksiyonunda, oluşturduğunuz kullanıcının `role` alanını `admin` olarak güncelleyin

## 📞 İletişim

Sorularınız veya önerileriniz için issues açabilir veya aşağıdaki iletişim kanallarını kullanabilirsiniz:

* GitHub: pave5866

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır.