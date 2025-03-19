#!/usr/bin/env node
/**
 * Backend sunucu başlangıç dosyası
 */

// Ortam değişkenlerini yükle
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { supabase } = require('./config/supabase');

// Rotaları import et
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const orderRoutes = require('./routes/order.routes');
const reviewRoutes = require('./routes/review.routes');
const uploadRoutes = require('./routes/upload.routes');
const couponRoutes = require('./routes/coupon.routes');
const settingsRoutes = require('./routes/settings.routes');
const addressRoutes = require('./routes/address.routes');

// Global error handler
const globalErrorHandler = require('./controllers/error.controller');
const AppError = require('./utils/appError');

// Express uygulaması
const app = express();

// CORS ayarları
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://yourfrontenddomain.com', 
        'https://www.yourfrontenddomain.com'
      ] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Güvenlik önlemleri
app.use(helmet());

// Sıkıştırma - Bandwidth düşürme
app.use(compression());

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// JSON Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına limit
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Çok fazla istek, lütfen daha sonra tekrar deneyin'
});

// API rotaları
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/addresses', addressRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 - Not Found
app.all('*', (req, res, next) => {
  next(new AppError(`${req.originalUrl} - Bu URL sunucuda bulunamadı!`, 404));
});

// Hata yakalama middleware
app.use(globalErrorHandler);

// Sunucu başlatma
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Sunucu ${PORT} portunda başlatıldı, ortam: ${process.env.NODE_ENV}`);
  logger.info(`Supabase bağlantısı: ${process.env.SUPABASE_URL ? 'Kuruldu' : 'Kurulmadı'}`);
});

// Beklenmeyen hatalar
process.on('unhandledRejection', err => {
  logger.error('İŞLENMEMIŞ PROMISE REJECTION! Sunucu kapatılıyor...', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', err => {
  logger.error('İŞLENMEMIŞ EXCEPTION! Sunucu kapatılıyor...', err);
  process.exit(1);
});

module.exports = app; 