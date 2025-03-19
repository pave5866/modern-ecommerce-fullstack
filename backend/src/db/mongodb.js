const mongoose = require('mongoose');
const logger = require('../utils/logger');

// MongoDB bağlantı durumu
let isConnected = false;

// MongoDB bağlantı fonksiyonu
const connectDB = async () => {
  if (isConnected) {
    logger.info('MongoDB bağlantısı zaten mevcut');
    return;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      logger.error('MONGODB_URI çevre değişkeni tanımlanmamış');
      return;
    }

    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    logger.info(`MongoDB bağlantısı başarılı: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB bağlantı hatası: ${error.message}`);
    
    // Kritik bir hata durumunda uygulama kapansın mı? 
    // Şu an kapatmayacağız, bunun yerine bir fallback mekanizması kullanacağız
    // process.exit(1);
  }
};

// MongoDB bağlantısını sonlandırma
const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB bağlantısı kapatıldı');
  } catch (error) {
    logger.error(`MongoDB bağlantı kapatma hatası: ${error.message}`);
  }
};

// MongoDB bağlantı durumunu kontrol etme
const checkConnection = () => {
  return isConnected;
};

module.exports = {
  connectDB,
  disconnectDB,
  checkConnection
};