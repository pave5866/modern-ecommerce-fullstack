/**
 * Uygulama için logger modülü
 * Yapılandırılabilir log seviyeleri ve formatları ile
 */
const pino = require('pino');

// Log seviyesi belirleme (ortam değişkeninden veya varsayılan)
const logLevel = process.env.LOG_LEVEL || 'info';

// Geliştirme ortamı için renkli ve okunabilir loglar
const devConfig = {
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
  level: logLevel,
};

// Üretim ortamı için JSON formatında loglar
const prodConfig = {
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  level: logLevel,
};

// Ortama göre logger yapılandırması seç
const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

// Logger oluştur
const logger = pino(config);

// Node.js global hatalarını logla
process.on('uncaughtException', (err) => {
  logger.fatal(err, 'Uncaught Exception');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled Rejection');
});

module.exports = logger; 