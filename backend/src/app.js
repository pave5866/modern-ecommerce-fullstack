const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { startTimer, captureResponseBody, logOnFinish, logError } = require('./middlewares/logger');
const errorHandler = require('./middlewares/error');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();

// İzin verilen originler
const allowedOrigins = [
  'https://frabjous-daifuku-431360.netlify.app',
  'https://modern-ecommerce-fullstack.onrender.com',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173'
];

// CORS yapılandırması
app.use(cors({
  origin: function (origin, callback) {
    // origin null olabilir (örn. REST client, Postman gibi araçlar)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS hatası: Origin izin verilmedi: ${origin}`);
      callback(null, true); // Geliştirme aşamasında yine de izin verelim
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// CORS Preflight için OPTIONS isteklerini ele al
app.options('*', cors());

// Ek CORS middleware - tüm isteklere CORS header'ları ekle
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // İzin verilen originlere özel header ekle, diğerlerine '*' ata
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Debug amaçlı istekleri loglama
  if (req.method === 'OPTIONS') {
    logger.info('OPTIONS isteği:', { 
      origin: req.headers.origin,
      method: req.method,
      path: req.path
    });
    return res.status(200).end();
  }
  
  next();
});

// Kök API endpoint'i
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API çalışıyor',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logger middleware
app.use(startTimer);
app.use(captureResponseBody);
app.use(logOnFinish);

// Global hata yakalama
app.use((err, req, res, next) => {
  logger.error('Global hata:', { 
    message: err.message,
    stack: err.stack
  });
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz JSON formatı'
    });
  }

  next(err);
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/addresses', require('./routes/address.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/coupons', require('./routes/coupon.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/logs', require('./routes/log.routes'));
app.use('/api/admin', require('./routes/admin.routes')); 

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API çalışıyor',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use(logError);
app.use(errorHandler);

// Yakalanmamış hataları yakala
process.on('uncaughtException', (err) => {
  logger.error('Global hata:', { 
    type: 'uncaughtException',
    message: err.message,
    stack: err.stack
  });
  
  // Uygulama güvenli bir şekilde kapatılmalı
  process.exit(1);
});

// Yakalanmamış promise redlerini yakala
process.on('unhandledRejection', (err) => {
  logger.error('Global hata:', { 
    type: 'unhandledRejection',
    message: err.message,
    stack: err.stack
  });
});

module.exports = app;