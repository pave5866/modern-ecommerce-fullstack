require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

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

// Eksik bağımlılıkları kontrol et
const missingDeps = [];
try { require('express-validator'); } catch(e) { missingDeps.push('express-validator'); }
try { require('bcryptjs'); } catch(e) { missingDeps.push('bcryptjs'); }
try { require('@supabase/supabase-js'); } catch(e) { missingDeps.push('@supabase/supabase-js'); }

if (missingDeps.length > 0) {
  logger.error(`Eksik bağımlılıklar tespit edildi: ${missingDeps.join(', ')}`);
  logger.info('Eksik bağımlılıkları yüklemek için: npm install ' + missingDeps.join(' '));
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Çevre değişkenlerini kontrol et
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error(`Eksik çevre değişkenleri: ${missingEnvVars.join(', ')}`);
}

// Routes
try {
  app.use('/api/auth', require('./routes/auth.routes'));
  app.use('/api/products', require('./routes/product.routes'));
  app.use('/api/cart', require('./routes/cart.routes'));
  app.use('/api/orders', require('./routes/order.routes'));

  // Ek rotalar için try-catch (eğer bir rota dosyası eksikse hata vermesin)
  try { app.use('/api/users', require('./routes/user.routes')); } catch(e) { logger.warn('user.routes yüklenemedi'); }
  try { app.use('/api/categories', require('./routes/category.routes')); } catch(e) { logger.warn('category.routes yüklenemedi'); }
  try { app.use('/api/upload', require('./routes/upload.routes')); } catch(e) { logger.warn('upload.routes yüklenemedi'); }
} catch (error) {
  logger.error(`Rota yükleme hatası: ${error.message}`);
}

// Ana rota - API durumunu kontrol etmek için
app.get('/', (req, res) => {
  res.json({
    message: 'API çalışıyor',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// Veritabanı bağlantısı
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    logger.info(`MongoDB bağlantısı başarılı: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB bağlantı hatası: ${error.message}`);
  }
};

connectDB();

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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server ${PORT} portunda çalışıyor`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Yakalanmayan hataları işle
process.on('uncaughtException', (err) => {
  logger.error('YAKALANMAYAN İSTİSNA! Uygulama kapanıyor...');
  logger.error(err.name, err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('İŞLENMEMİŞ VAAD REDDİ! Uygulama kapanıyor...');
  logger.error(err.name, err.message, err.stack);
  process.exit(1);
});