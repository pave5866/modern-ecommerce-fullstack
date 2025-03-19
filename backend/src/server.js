const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('./utils/logger');
const { 
  checkSupabaseConnection, 
  testSupabaseConnection,
  useMockData
} = require('./config/supabase');

// Çevre değişkenlerini yükle
dotenv.config();

// Express uygulamasını oluştur
const app = express();
const PORT = process.env.PORT || 10000;

// CORS ayarları
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

// Middleware'ler
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Statik dosyalar
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ana sayfa - API durumu
app.get('/', async (req, res) => {
  try {
    // Supabase bağlantı durumunu kontrol et
    const supabaseStatus = await checkSupabaseConnection();
    
    // API durumunu döndür
    return res.status(200).json({
      status: 'success',
      message: 'API aktif ve çalışıyor',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      supabase: {
        connected: supabaseStatus.connected,
        message: supabaseStatus.message,
        mockMode: supabaseStatus.mockMode || useMockData
      }
    });
  } catch (error) {
    logger.error(`API durum kontrolü hatası: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'API durumu kontrol edilirken bir hata oluştu',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Sağlık kontrolü endpoint'i
app.get('/health', async (req, res) => {
  try {
    // Supabase bağlantı durumunu kontrol et
    const supabaseStatus = await checkSupabaseConnection();
    
    if (!supabaseStatus.connected && !supabaseStatus.mockMode) {
      return res.status(200).json({
        status: 'warning',
        message: 'API çalışıyor ancak gerçek Supabase bağlantısı kurulamıyor',
        supabase: supabaseStatus
      });
    }
    
    // Tüm sistemler çalışıyor
    return res.status(200).json({
      status: 'success',
      message: supabaseStatus.mockMode ? 'API mock veri modu ile çalışıyor' : 'Tüm sistemler aktif',
      supabase: supabaseStatus
    });
  } catch (error) {
    logger.error(`Sağlık kontrolü hatası: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Sağlık kontrolü sırasında bir hata oluştu',
      error: error.message
    });
  }
});

// Veritabanı bağlantı testi endpoint'i
app.get('/db-test', async (req, res) => {
  try {
    // Supabase bağlantı durumunu kontrol et
    const supabaseStatus = await checkSupabaseConnection();
    
    // Doğrudan bağlantı testi
    const directConnectionTest = await testSupabaseConnection();
    
    // Çevre değişkenlerini kontrol et
    const envVars = {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'ayarlanmış' : 'eksik',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'ayarlanmış' : 'eksik',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'ayarlanmış' : 'eksik',
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
    
    return res.status(200).json({
      status: 'success',
      message: 'Veritabanı bağlantı testi sonuçları',
      mockMode: supabaseStatus.mockMode || useMockData,
      supabaseStatus,
      directConnectionTest,
      environmentVariables: envVars
    });
  } catch (error) {
    logger.error(`Veritabanı test hatası: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Veritabanı testi sırasında bir hata oluştu',
      error: error.message
    });
  }
});

// API rotalarını yükle
try {
  // Auth rotaları
  const authRoutes = require('./routes/auth.routes');
  app.use('/api/auth', authRoutes);
  logger.info('auth.routes.js başarıyla yüklendi');
  logger.info('Auth rotaları başarıyla yüklendi');
} catch (error) {
  logger.error(`Auth rotaları yüklenemedi: ${error.message}`);
}

try {
  // Kullanıcı rotaları
  const userRoutes = require('./routes/user.routes');
  app.use('/api/users', userRoutes);
  logger.info('user.routes.js başarıyla yüklendi');
  logger.info('Kullanıcı rotaları başarıyla yüklendi');
} catch (error) {
  logger.error(`Kullanıcı rotaları yüklenemedi: ${error.message}`);
}

try {
  // Ürün rotaları
  const productRoutes = require('./routes/product.routes');
  app.use('/api/products', productRoutes);
  logger.info('product.routes.js başarıyla yüklendi');
  logger.info('Ürün rotaları başarıyla yüklendi');
} catch (error) {
  logger.error(`Ürün rotaları yüklenemedi: ${error.message}`);
}

try {
  // Kategori rotaları
  const categoryRoutes = require('./routes/category.routes');
  app.use('/api/categories', categoryRoutes);
  logger.info('category.routes.js başarıyla yüklendi');
  logger.info('Kategori rotaları başarıyla yüklendi');
} catch (error) {
  logger.error(`Kategori rotaları yüklenemedi: ${error.message}`);
}

try {
  // Sipariş rotaları
  const orderRoutes = require('./routes/order.routes');
  app.use('/api/orders', orderRoutes);
  logger.info('order.routes.js başarıyla yüklendi');
  logger.info('Sipariş rotaları başarıyla yüklendi');
} catch (error) {
  logger.error(`Sipariş rotaları yüklenemedi: ${error.message}`);
}

try {
  // Sepet rotaları
  const cartRoutes = require('./routes/cart.routes');
  app.use('/api/cart', cartRoutes);
  logger.info('cart.routes.js başarıyla yüklendi');
  logger.info('Sepet rotaları başarıyla yüklendi');
} catch (error) {
  logger.error(`Sepet rotaları yüklenemedi: ${error.message}`);
}

try {
  // Dosya yükleme rotaları
  const uploadRoutes = require('./routes/upload.routes');
  app.use('/api/upload', uploadRoutes);
  logger.info('upload.routes.js başarıyla yüklendi');
  logger.info('Dosya yükleme rotaları başarıyla yüklendi');
} catch (error) {
  logger.error(`Dosya yükleme rotaları yüklenemedi: ${error.message}`);
}

// 404 - Bulunamadı
app.use((req, res, next) => {
  return res.status(404).json({
    status: 'error',
    message: `Üzgünüz, istediğiniz sayfa bulunamadı: ${req.originalUrl}`
  });
});

// Genel hata yakalayıcı
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  logger.error(`Sunucu hatası: ${err.message}`);
  
  return res.status(statusCode).json({
    status: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Sunucuyu başlat
app.listen(PORT, async () => {
  logger.info(`Sunucu ${PORT} portunda çalışıyor`);
  logger.info(`Mod: ${process.env.NODE_ENV || 'development'}`);
  
  // Supabase bağlantısını kontrol et
  try {
    const status = await checkSupabaseConnection();
    
    if (status.connected && !status.mockMode) {
      logger.info('Supabase bağlantısı başarılı - Gerçek veri modu aktif');
    } else if (status.mockMode) {
      logger.info('Supabase mock veri modu aktif - API demo verileriyle çalışıyor');
      logger.info('Not: Frontend geliştirmeleri için yeterli olacaktır. Gerçek veri için Supabase yapılandırmanızı kontrol edin.');
    } else {
      logger.warn(`Supabase bağlantısı başarısız: ${status.message}`);
      logger.warn('API sınırlı modda çalışacak (bazı özellikler kullanılamayabilir)');
    }
  } catch (err) {
    logger.error(`Supabase bağlantı kontrolü başarısız: ${err.message}`);
    logger.info('API mock veri modu ile çalışmaya devam edecek');
  }
});

// İşlem sonlandırma sinyallerini yakala
process.on('SIGTERM', () => {
  logger.info('SIGTERM sinyali alındı, sunucu kapatılıyor');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT sinyali alındı, sunucu kapatılıyor');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error(`Yakalanmamış istisna: ${err.message}`);
  logger.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('İşlenmeyen promise reddi:');
  logger.error(reason);
});

module.exports = app;