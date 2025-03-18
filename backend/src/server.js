#!/usr/bin/env node

// Dotenv konfigürasyonu en başta yapılmalı
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// .env dosyasının tam yolunu belirle
const envPath = path.resolve(__dirname, '../.env');

// .env dosyasının varlığını kontrol et
console.log(`Çevre değişkenleri yükleniyor, yol: ${envPath}`);
console.log(`Dosya var mı? ${fs.existsSync(envPath) ? 'Evet ✓' : 'Hayır ✗'}`);

// .env dosyasını yükle
dotenv.config({ path: envPath });

// Çevre değişkenlerini kontrol et
const envVars = [
  'PORT',
  'MONGODB_URI',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

// Her bir değişkenin değerini gizleyerek logla
envVars.forEach(varName => {
  const value = process.env[varName];
  let maskedValue = '';
  if (value) {
    if (varName === 'PORT') {
      maskedValue = value; // PORT değerini gizlemeye gerek yok
    } else {
      maskedValue = value.substring(0, Math.min(8, value.length)) + '...';
    }
  } else {
    maskedValue = 'tanımlanmamış';
  }
  console.log(`Manuel yükleme: ${process.env[varName] ? '':'\u{FFFD}'}${varName} = ${maskedValue}`);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const logger = require('./utils/logger');

// Rota dosyaları
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const reviewRoutes = require('./routes/review.routes');
const addressRoutes = require('./routes/address.routes');
const couponRoutes = require('./routes/coupon.routes');
const settingsRoutes = require('./routes/settings.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const logRoutes = require('./routes/log.routes');
const uploadRoutes = require('./routes/upload.routes');
const categoryRoutes = require('./routes/category.routes');
const adminRoutes = require('./routes/admin.routes');

// Hata işleyici middleware
const errorHandler = require('./middlewares/error');

// Express uygulaması
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());

// HTTP isteklerini logla
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Public ve uploads klasörleri
const publicDir = path.join(__dirname, '../public');
const uploadsDir = path.join(publicDir, 'uploads');

// Klasörleri oluştur (yoksa)
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
  console.log('Public klasörü oluşturuldu');
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Uploads klasörü oluşturuldu');
}

// Statik dosyalar
app.use('/static', express.static(publicDir));

// API rotaları
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/admin', adminRoutes);

// Ana rota
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-Ticaret API çalışıyor',
    version: '1.0.0',
    docs: '/api/v1/docs'
  });
});

// 404 hatası
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `${req.originalUrl} yolu bulunamadı`
  });
});

// Hata işleyici
app.use(errorHandler);

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    logger.info('MongoDB\'ye başarıyla bağlandı');
  })
  .catch((err) => {
    logger.error(`MongoDB bağlantı hatası: ${err.message}`);
  });

// Sunucuyu başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Sunucu ${PORT} portunda çalışıyor...`);
});

// Beklenmeyen hataları yakala
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION: ${err.message}`);
  logger.error(err.stack);
});

process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.message}`);
  logger.error(err.stack);
});

module.exports = app; 