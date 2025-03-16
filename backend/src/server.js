const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./utils/logger');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('MongoDB bağlantısı başarılı');
  })
  .catch(error => {
    logger.error('MongoDB bağlantı hatası:', error.message);
    process.exit(1);
  });

// Public klasörünü oluştur (eğer yoksa)
const publicDir = path.join(__dirname, '..', 'public');
const uploadsDir = path.join(publicDir, 'uploads');

try {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    logger.info('Public klasörü oluşturuldu');
  }
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    logger.info('Uploads klasörü oluşturuldu');
  }
} catch (error) {
  logger.error(`Klasör oluşturma hatası: ${error.message}`);
}

// Statik dosyalar için middleware
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Server port
const PORT = process.env.PORT || 5000;

// Server'ı başlat
app.listen(PORT, () => {
  logger.info(`Server ${PORT} portunda çalışıyor`);
  logger.info(`API: ${process.env.NODE_ENV === 'production' 
    ? 'https://modern-ecommerce-fullstack.onrender.com/api' 
    : `http://localhost:${PORT}/api`}`);
});

// Beklenmeyen hata yakalama
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Uygulama kapatılıyor...');
  logger.error(err.name, err.message);
  // Uygulamayı temiz bir şekilde kapat
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Uygulama kapatılıyor...');
  logger.error(err.name, err.message);
  process.exit(1);
});