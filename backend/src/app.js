const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { startTimer, captureResponseBody, logOnFinish, logError } = require('./middlewares/logger');
const errorHandler = require('./middlewares/error');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();

// CORS ayarları - güçlendirilmiş
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['https://e-commerce-mernstack.netlify.app', 'http://localhost:3000', 'http://localhost:5173'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// CORS Preflight için OPTIONS isteklerini ele al
app.options('*', cors());

// Kök API endpoint'i
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Modern E-Commerce API',
    version: '1.0.0',
    endpoints: [
      '/api/products',
      '/api/products/categories',
      '/api/users',
      '/api/auth',
      '/api/orders',
      '/api/addresses',
      '/api/coupons',
      '/api/settings',
      '/api/dashboard',
      '/api/logs'
    ]
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
  
  // Uygulama güvenli bir şekilde kapatılmalı
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;