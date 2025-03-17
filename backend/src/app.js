const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const logger = require('./utils/logger');

// Uygulama başlatma
const app = express();

// CORS ayarları - Whitelist ayarı
const whitelist = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://modern-ecommerce.netlify.app',
  'https://modern-full-stack-e-ticaret.netlify.app'
];

// CORS yapılandırma
const corsOptions = {
  origin: (origin, callback) => {
    // Frontend'ten gelen isteklerde origin boş olabiliyor (null), bu durumu handle edelim
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Whitelist dışındaki orgin'leri loglayalım (debugging için)
      logger.warn(`CORS: Bloke edilen origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true, // Cookie ve JWT doğrulaması için gerekli
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  maxAge: 86400 // CORS önbellek süresi: 24 saat
};

app.use(cors(corsOptions));

// Helmet güvenlik başlıkları
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Resim yükleme için gerekli
  contentSecurityPolicy: false // Geliştirme aşamasında devre dışı bırakıldı
}));

// Rate limiting (DDoS koruması)
const limiter = rateLimit({
  max: 100, // Her IP için izin verilen istek sayısı
  windowMs: 15 * 60 * 1000, // 15 dakikalık pencere
  message: 'Bu IP adresinden çok fazla istek yapıldı, lütfen 15 dakika sonra tekrar deneyin.',
  standardHeaders: true,
  legacyHeaders: false
});

// JSON body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Morgan logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Statik dosyalar
const publicDir = path.join(__dirname, '../public');
const uploadsDir = path.join(publicDir, 'uploads');

// Public ve uploads klasörlerini kontrol et ve yoksa oluştur
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  logger.info('Public klasörü oluşturuldu');
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('Uploads klasörü oluşturuldu');
}

app.use(express.static(publicDir));

// API rotaları
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/logs', require('./routes/log.routes'));
app.use('/api/uploads', require('./routes/upload.routes'));

// Ana endpoint
app.get('/', (req, res) => {
  res.send('Modern E-Ticaret API - Hoşgeldiniz');
});

// 404 handler
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API rotası bulunamadı: ${req.originalUrl}`
  });
});

// Hata yakalama middleware
app.use((err, req, res, next) => {
  // Hata logları
  if (err.statusCode >= 500) {
    logger.error(err.message, { stack: err.stack });
  } else {
    logger.error(err.message, { statusCode: err.statusCode || 500 });
  }

  // Hata türüne göre yanıt oluştur
  res.status(err.statusCode || 500).json({
    success: false,
    status: err.status || 'error',
    message: err.message || 'Bir şeyler yanlış gitti!',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      isOperational: err.isOperational || false
    })
  });
});

module.exports = app;