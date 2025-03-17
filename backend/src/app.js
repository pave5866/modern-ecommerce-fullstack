const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { startTimer, captureResponseBody, logOnFinish, logError } = require('./middlewares/logger');
const errorHandler = require('./middlewares/error');
const logger = require('./utils/logger');
require('dotenv').config();

// Modelleri önceden yükle (uygulama çalıştığında tüm modellerin hazır olması için)
require('./models/product.model');
require('./models/review.model'); // Review modelini ekledik

// Express uygulaması oluştur
const app = express();

// CORS ayarları
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://frabjous-daifuku-431360.netlify.app',
    'https://modern-fullstack-eticaret.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// JSON parser ve diğer middleware'ler
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Front-end static dosyaları için (eğer ihtiyaç olursa)
app.use(express.static(path.join(__dirname, '../public')));

// Middlewares for logging request and response data
app.use(startTimer);

// Log tüm istekleri, performans analizi için
app.use((req, res, next) => {
  // URL ve method bilgisini logla
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const addressRoutes = require('./routes/address.routes');
const settingsRoutes = require('./routes/settings.routes');
const adminRoutes = require('./routes/admin.routes');
const reviewRoutes = require('./routes/review.routes'); // Review routes eklendi
const logRoutes = require('./routes/log.routes'); // Log routes eklendi
const dashboardRoutes = require('./routes/dashboard.routes'); // Dashboard routes eklendi

// API Yolları
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes); // Review routes kullanıldı
app.use('/api/logs', logRoutes); // Log routes kullanıldı
app.use('/api/dashboard', dashboardRoutes); // Dashboard routes kullanıldı

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API sağlık kontrolü başarılı',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime())
  });
});

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

// 404 Route Handler - Tüm route'lar kontrol edildikten sonra çağrılır
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Üzgünüz, istenen kaynak (${req.originalUrl}) bulunamadı.`
  });
});

// Response capture - bu middleware isteğin işlenmesinden sonra çağrılır
// ve yanıt gövdesini yakalar
app.use(captureResponseBody);

// Log the request/response info after the request has been completed
app.use(logOnFinish);

// Error handling middleware
app.use(logError);
app.use(errorHandler);

module.exports = app;