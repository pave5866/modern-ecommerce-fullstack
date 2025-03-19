require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./db/mongodb');

// Winston logger yapılandırması
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Logs klasörü oluştur
try {
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
  }
} catch (error) {
  console.error('Logs klasörü oluşturulamadı:', error);
}

// Ana uygulama
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Eksik bağımlılıkları kontrol et ve logla
try { 
  const bcrypt = require('bcryptjs');
  logger.info('bcryptjs modülü kullanılıyor', { service: 'ecommerce-api' });
} catch(e) { 
  logger.error('bcryptjs modülü yüklenemedi', { service: 'ecommerce-api' });
}

// Çevre değişkenlerini kontrol et
const requiredEnvVars = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error(`Eksik çevre değişkenleri: ${missingEnvVars.join(', ')}`);
}

// MongoDB bağlantısı
connectDB().then(() => {
  logger.info('MongoDB bağlantı fonksiyonu çalıştırıldı');
}).catch(err => {
  logger.error(`MongoDB bağlantı fonksiyonu hatası: ${err.message}`);
});

// Ana rota - API durumunu kontrol etmek için
app.get('/', (req, res) => {
  res.json({
    message: 'API çalışıyor',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// Rotaları yükle
try {
  // auth.routes.js'yi kontrol et ve yükle
  try {
    app.use('/api/auth', require('./routes/auth.routes'));
  } catch (err) {
    logger.error(`auth.routes.js yüklenirken hata: ${err.message}`);
  }

  // Diğer rotaları kontrol et ve yükle
  try { app.use('/api/products', require('./routes/product.routes')); } catch(e) { logger.warn('product.routes yüklenemedi'); }
  try { app.use('/api/cart', require('./routes/cart.routes')); } catch(e) { logger.warn('cart.routes yüklenemedi'); }
  try { app.use('/api/orders', require('./routes/order.routes')); } catch(e) { logger.warn('order.routes yüklenemedi'); }
  try { app.use('/api/users', require('./routes/user.routes')); } catch(e) { logger.warn('user.routes yüklenemedi'); }
  try { app.use('/api/categories', require('./routes/category.routes')); } catch(e) { logger.warn('category.routes yüklenemedi'); }
  try { app.use('/api/upload', require('./routes/upload.routes')); } catch(e) { logger.warn('upload.routes yüklenemedi'); }
} catch (error) {
  logger.error(`Rota yükleme genel hatası: ${error.message}`);
}

// 404 - Sayfa bulunamadı hatası
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `${req.originalUrl} - Bu endpoint bulunamadı`
  });
});

// Genel hata yakalayıcı
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  logger.error(`${statusCode} - ${err.message}`);
  
  res.status(statusCode).json({
    status: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

// Port ayarları
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  logger.info(`Server ${PORT} portunda çalışıyor`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Yakalanmayan hataları işle
process.on('uncaughtException', (err) => {
  logger.error('YAKALANMAYAN İSTİSNA!');
  logger.error(err.name, err.message, err.stack);
  // Kritik hatalar durumunda bile sunucunun çalışmaya devam etmesi için
  // process.exit(1) kullanmıyoruz
});

process.on('unhandledRejection', (err) => {
  logger.error('İŞLENMEMİŞ VAAD REDDİ!');
  logger.error(err.name, err.message, err.stack);
  // Kritik hatalar durumunda bile sunucunun çalışmaya devam etmesi için
  // process.exit(1) kullanmıyoruz
});