# Modern E-Commerce Fullstack Deployment Kılavuzu

Bu kılavuz, Modern E-Commerce Fullstack uygulamasının canlı ortama (production) nasıl deploy edileceğini adım adım açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Ön Koşullar](#ön-koşullar)
3. [Backend Deployment (Render.com)](#backend-deployment-rendercom)
4. [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
5. [MongoDB Atlas Kurulumu](#mongodb-atlas-kurulumu)
6. [Sorun Giderme](#sorun-giderme)

## Genel Bakış

Modern E-Commerce Fullstack uygulaması üç ana bileşenden oluşur:

1. **Frontend**: React + Vite ile geliştirilmiş, Netlify'da host edilir
2. **Backend**: Node.js + Express ile geliştirilmiş, Render.com'da host edilir
3. **Veritabanı**: MongoDB, MongoDB Atlas'ta host edilir

## Ön Koşullar

- [GitHub](https://github.com/) hesabı
- [Netlify](https://www.netlify.com/) hesabı
- [Render.com](https://render.com/) hesabı
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) hesabı
- [Node.js](https://nodejs.org/) (v14 veya üstü)
- [Git](https://git-scm.com/)

## Backend Deployment (Render.com)

### 1. Render.com'da Web Service Oluşturma

1. [Render Dashboard](https://dashboard.render.com/)'a giriş yapın
2. "New +" > "Web Service" seçeneğine tıklayın
3. GitHub reponuzu bağlayın veya public repo URL'sini girin
4. Aşağıdaki ayarları yapılandırın:
   - **Name**: `modern-ecommerce-fullstack`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (veya ihtiyacınıza göre)

### 2. Çevre Değişkenlerini Ayarlama

Render.com'da "Environment" sekmesine gidin ve aşağıdaki değişkenleri ekleyin:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/e-ticaret
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
CORS_ORIGIN=https://e-commerce-memstack.netlify.app
```

### 3. Backend Deployment'ı Başlatma

1. "Create Web Service" düğmesine tıklayın
2. Deployment sürecini izleyin (5-10 dakika sürebilir)
3. Deployment tamamlandığında, servis URL'sini not edin (örn. `https://modern-ecommerce-fullstack.onrender.com`)

## Frontend Deployment (Netlify)

### 1. Netlify'da Yeni Site Oluşturma

1. [Netlify Dashboard](https://app.netlify.com/)'a giriş yapın
2. "New site from Git" düğmesine tıklayın
3. GitHub reponuzu seçin

### 2. Build Ayarlarını Yapılandırma

Aşağıdaki ayarları yapılandırın:

- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### 3. Çevre Değişkenlerini Ayarlama

"Site settings" > "Build & deploy" > "Environment" sekmesine gidin ve aşağıdaki değişkenleri ekleyin:

```
VITE_APP_API_URL=https://modern-ecommerce-fullstack.onrender.com/api
VITE_APP_ENV=production
```

### 4. Frontend Deployment'ı Başlatma

1. "Deploy site" düğmesine tıklayın
2. Deployment sürecini izleyin (2-5 dakika sürebilir)
3. Deployment tamamlandığında, site URL'sini not edin (örn. `https://e-commerce-memstack.netlify.app`)

## MongoDB Atlas Kurulumu

### 1. MongoDB Atlas Cluster Oluşturma

1. [MongoDB Atlas](https://cloud.mongodb.com/)'a giriş yapın
2. "Create" > "Shared Cluster" seçeneğine tıklayın (ücretsiz plan)
3. Cloud provider ve bölge seçin
4. "Create Cluster" düğmesine tıklayın

### 2. Veritabanı Kullanıcısı Oluşturma

1. Sol menüden "Database Access"e tıklayın
2. "Add New Database User" düğmesine tıklayın
3. Kullanıcı adı ve şifre belirleyin
4. "Add User" düğmesine tıklayın

### 3. IP Erişimini Yapılandırma

1. Sol menüden "Network Access"e tıklayın
2. "Add IP Address" düğmesine tıklayın
3. "Allow Access from Anywhere" seçeneğini işaretleyin (veya belirli IP'leri ekleyin)
4. "Confirm" düğmesine tıklayın

### 4. Bağlantı Dizesini Alma

1. Sol menüden "Clusters"a tıklayın
2. "Connect" düğmesine tıklayın
3. "Connect your application" seçeneğini seçin
4. Bağlantı dizesini kopyalayın ve Render.com'daki `MONGODB_URI` çevre değişkenine ekleyin

## Sorun Giderme

### CORS Hataları

CORS hatalarıyla karşılaşırsanız:

1. Backend'de CORS ayarlarını kontrol edin (`backend/src/app.js`)
2. Frontend'de API URL'sinin doğru olduğundan emin olun
3. Netlify'da `netlify.toml` dosyasının doğru yapılandırıldığından emin olun

### API İstekleri Localhost'a Gidiyor

Bu sorunla karşılaşırsanız:

1. `frontend/src/services/api.js` dosyasında API URL'sinin doğru ayarlandığından emin olun
2. Tarayıcı önbelleğini temizleyin (Ctrl+F5 veya Cmd+Shift+R)
3. Netlify'da çevre değişkenlerinin doğru ayarlandığından emin olun
4. Netlify'da yeni bir deployment başlatın

### MongoDB Bağlantı Hataları

MongoDB bağlantı hatalarıyla karşılaşırsanız:

1. MongoDB Atlas'ta IP erişim listesini kontrol edin
2. Bağlantı dizesinin doğru olduğundan emin olun
3. Veritabanı kullanıcı adı ve şifresinin doğru olduğundan emin olun
4. Render.com'da `MONGODB_URI` çevre değişkeninin doğru ayarlandığından emin olun

## Önemli Notlar

- **Güvenlik**: JWT_SECRET değerini güçlü ve benzersiz bir değerle değiştirin
- **Ölçeklendirme**: Trafik arttıkça Render.com ve MongoDB Atlas planlarını yükseltmeyi düşünün
- **Yedekleme**: MongoDB Atlas'ta düzenli yedeklemeler yapılandırın
- **İzleme**: Render.com ve Netlify'ın izleme araçlarını kullanarak uygulamanızı izleyin

---

Bu kılavuzla ilgili sorularınız veya sorunlarınız varsa, lütfen GitHub üzerinden bir issue açın.

Son Güncelleme: 15 Mart 2025