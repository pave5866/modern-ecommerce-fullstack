#!/usr/bin/env node

// Gerekli modüller
const path = require('path');
const fs = require('fs');
const express = require('express');

// Dotenv yapılandırması - EN BAŞTA YÜKLENMELİDİR
const dotenvPath = path.resolve(process.cwd(), '.env');
console.log('Çevre değişkenleri yükleniyor, yol:', dotenvPath);
console.log('Dosya var mı?', fs.existsSync(dotenvPath) ? 'Evet ✓' : 'Hayır ✗');

// Dosyayı düz metin olarak oku, BOM karakterini temizle
if (fs.existsSync(dotenvPath)) {
  let envContent = fs.readFileSync(dotenvPath, 'utf8');
  
  // BOM karakteri tespiti ve temizleme (U+FEFF - 0xEF,0xBB,0xBF)
  if (envContent.charCodeAt(0) === 0xFEFF || 
      (envContent.charCodeAt(0) === 0xEF && 
       envContent.charCodeAt(1) === 0xBB && 
       envContent.charCodeAt(2) === 0xBF)) {
    envContent = envContent.substring(1);
    console.log('BOM karakteri tespit edildi ve temizlendi');
    
    // BOM olmayan dosyayı yeniden yaz
    fs.writeFileSync(dotenvPath, envContent, 'utf8');
    console.log('.env dosyası temizlendi ve yeniden yazıldı');
  }
  
  // Manuel çevre değişkenleri ayarla
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const indexOfEqual = trimmedLine.indexOf('=');
      if (indexOfEqual > 0) {
        const key = trimmedLine.substring(0, indexOfEqual).trim();
        const value = trimmedLine.substring(indexOfEqual + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
          console.log(`Manuel yükleme: ${key} = ${value.length > 15 ? value.substring(0, 15) + '...' : value}`);
        }
      }
    }
  }
}

// dotenv yüklendikten sonra ana modülleri yükle
require('dotenv').config({ path: dotenvPath });
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const winston = require('winston');

// Logger tanımlama
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'modern-ecommerce-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Express uygulaması
const app = express();

// Public klasörünü oluştur (eğer yoksa)
const publicDir = path.join(__dirname, '..', 'public');
const uploadsDir = path.join(publicDir, 'uploads');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Public klasörü oluşturuldu');
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads klasörü oluşturuldu');
}

// Temel middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Statik dosyalar için middleware
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
app.use(express.static(publicDir));

// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const reviewRoutes = require('./routes/review.routes');
const uploadRoutes = require('./routes/upload.routes');
const settingsRoutes = require('./routes/settings.routes');
const logRoutes = require('./routes/log.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const adminRoutes = require('./routes/admin.routes');

// Geçici kategori routes (orijinal dosya olmadığı için)
const categoryRouter = express.Router();

// Temel kategori route'ları
categoryRouter.get('/', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Kategoriler başarıyla listelendi',
    data: [] 
  });
});

categoryRouter.post('/', (req, res) => {
  res.status(201).json({ 
    success: true, 
    message: 'Kategori başarıyla oluşturuldu',
    data: {
      name: req.body.name || 'Yeni Kategori',
      slug: req.body.slug || 'yeni-kategori',
      _id: '6502d4a8172cf3c9d71bc' + Math.floor(Math.random() * 1000)
    } 
  });
});

categoryRouter.get('/:id', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Kategori başarıyla getirildi',
    data: {
      _id: req.params.id,
      name: 'Geçici Kategori',
      slug: 'gecici-kategori'
    } 
  });
});

categoryRouter.put('/:id', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Kategori başarıyla güncellendi',
    data: {
      _id: req.params.id,
      name: req.body.name || 'Güncellenmiş Kategori',
      slug: req.body.slug || 'guncellenmis-kategori'
    } 
  });
});

categoryRouter.delete('/:id', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Kategori başarıyla silindi',
    data: {
      _id: req.params.id
    } 
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/categories', categoryRouter); // Geçici kategori router'ı

// Ana endpoint
app.get('/', (req, res) => {
  res.send('Modern E-Ticaret API - Hoşgeldiniz');
});

// 404 handler
app.use((req, res, next) => {
  console.log(`404 - Bulunamadı: ${req.method} ${req.originalUrl}`);
  logger.info(`404 - Bulunamadı: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API rotası bulunamadı: ${req.originalUrl}`
  });
});

// Hata yakalama middleware
app.use((err, req, res, next) => {
  // Hata logları
  console.error(`Hata (${err.statusCode || 500}): ${err.message}`);
  
  if (err.statusCode >= 500) {
    logger.error(err.message, { stack: err.stack });
  } else {
    logger.error(err.message, { statusCode: err.statusCode || 500 });
  }

  // Hata türüne göre yanıt oluştur
  try {
    res.status(err.statusCode || 500).json({
      success: false,
      status: err.status || 'error',
      message: err.message || 'Bir şeyler yanlış gitti!',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        isOperational: err.isOperational || false
      })
    });
  } catch (sendError) {
    console.error('Hata gönderirken ikincil hata oluştu:', sendError);
    // Header zaten gönderilmişse tekrar göndermeyi deneme
    if (!res.headersSent) {
      res.status(500).send('Sunucu hatası');
    }
  }
});

// Çevre değişkenleri kontrol
console.log('--------------------------------------');
console.log('ÇEVRE DEĞİŞKENLERİ DURUMU:');
console.log('PORT:', process.env.PORT || 'Tanımsız ✗');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Tanımlı ✓' : 'Tanımsız ✗');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'Tanımsız ✗');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY || 'Tanımsız ✗');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Tanımlı ✓' : 'Tanımsız ✗');
console.log('--------------------------------------');

// MongoDB bağlantısı kur
console.log('MongoDB bağlantısı kuruluyor...');
const connectDB = async () => {
  try {
    // Render.com için özel olarak MongoDB URI değişkenini kontrol et
    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/modern-ecommerce';
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI çevre değişkeni tanımlanmamış!');
    }
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 saniye timeout
      connectTimeoutMS: 10000 // 10 saniye bağlantı zaman aşımı
    });
    
    console.log('MongoDB Atlas bağlantısı BAŞARILI!');
    logger.info('MongoDB veritabanına bağlantı başarılı!');
    return true;
  } catch (err) {
    console.error('MongoDB bağlantı HATASI:', err.message);
    logger.error('MongoDB bağlantı hatası:', err);
    logger.warn('MongoDB bağlantısı kurulamadı ama uygulama devam ediyor');
    return false;
  }
};

// Server başlatma fonksiyonu
const startServer = async () => {
  const dbConnected = await connectDB();
  
  // Render.com için PORT değişkenini al veya varsayılan olarak 5000 kullan
  const PORT = process.env.PORT || 5000;
  
  try {
    const server = app.listen(PORT, () => {
      console.log(`Backend sunucusu ${PORT} portunda ÇALIŞIYOR! ${dbConnected ? '' : '(MongoDB bağlantısı olmadan)'}`);
      logger.info(`Backend sunucusu ${PORT} portunda çalışıyor...`);
      logger.info(`API: ${process.env.NODE_ENV === 'production' 
        ? 'https://modern-ecommerce-fullstack.onrender.com/api/v1' 
        : `http://localhost:${PORT}/api/v1`}`);
    });
    
    // İstenmeyen hata yakalama
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...');
      logger.error(err.name, err.message);
      
      server.close(() => {
        process.exit(1);
      });
    });
    
  } catch (err) {
    console.error('Server başlatma hatası:', err);
    logger.error('Server başlatma hatası:', err);
    process.exit(1);
  }
};

// Uygulamayı başlat
startServer(); 