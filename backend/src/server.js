require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { supabase } = require('./config/supabase');

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

// Supabase bağlantısını daha güvenli şekilde kontrol et
const checkSupabaseConnection = async () => {
  try {
    // Basit bir sağlık kontrolü - doğrudan from veya rpc kullanmak yerine auth.getUser() gibi
    // daha basit bir fonksiyonu çağıralım (null kullanıcı ID'si ile, sadece bağlantıyı test etmek için)
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error(`Supabase bağlantı hatası: ${error.message}`);
      return false;
    }
    
    logger.info('Supabase bağlantısı başarıyla test edildi');
    return true;
  } catch (error) {
    logger.error(`Supabase bağlantı kontrol hatası: ${error.message}`);
    return false;
  }
};

// Supabase bağlantısını asenkron olarak kontrol et, 
// ancak uygulamanın başlamasını engelleme
setTimeout(() => {
  checkSupabaseConnection().catch(err => {
    logger.error(`Supabase bağlantı kontrolünde beklenmeyen hata: ${err.message}`);
  });
}, 1000);

// Çevre değişkenlerini kontrol et
const requiredEnvVars = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error(`Eksik çevre değişkenleri: ${missingEnvVars.join(', ')}`);
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

// Sağlık kontrolü endpoint'i
app.get('/health', async (req, res) => {
  const supabaseStatus = {
    connected: false,
    message: 'Kontrol ediliyor...'
  };

  try {
    // Basit bir sağlık kontrolü - sadece bağlantıyı test et
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      supabaseStatus.message = `Bağlantı hatası: ${error.message}`;
    } else {
      supabaseStatus.connected = true;
      supabaseStatus.message = 'Bağlantı başarılı';
    }
  } catch (error) {
    supabaseStatus.message = `Bağlantı hatası: ${error.message}`;
  }

  res.json({
    status: 'online',
    supabase: supabaseStatus,
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