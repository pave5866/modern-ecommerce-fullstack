const winston = require('winston');
const { format, transports } = winston;

// Winston formatları
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Console formatı (renkli ve okunabilir)
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

// Logger tanımlaması 
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'backend-api' },
  transports: [
    // Console'a log yazma
    new transports.Console({
      format: consoleFormat
    }),
    // Dosyaya hata logları yazma
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Dosyaya tüm logları yazma
    new transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  // Beklenmeyen hataları yakalama
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' }),
    new transports.Console({
      format: consoleFormat
    })
  ],
  // Yakalanmamış promise red nedenlerini yakalama
  rejectionHandlers: [
    new transports.File({ filename: 'logs/rejections.log' }),
    new transports.Console({
      format: consoleFormat
    })
  ]
});

// Geliştirme ortamında console transport'unu daha okunabilir yap
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

module.exports = logger;