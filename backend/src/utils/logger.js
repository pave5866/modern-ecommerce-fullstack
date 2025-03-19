const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Logs klasörünü oluştur (yoksa)
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir);
  } catch (error) {
    console.error('Logs klasörü oluşturulamadı:', error);
  }
}

// Winston formatlayıcı
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Winston logger örneği
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: customFormat,
  defaultMeta: { service: 'ecommerce-api' },
  transports: [
    // Konsola yazdırma
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      )
    }),
    // Hata dosyasına yazdırma
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Tüm logları dosyaya yazdırma
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// HTTP isteklerini loglamak için özel metot
logger.logHttpRequest = (req, res, responseTime) => {
  const { method, url, ip } = req;
  const userAgent = req.get('user-agent') || '';
  const contentLength = res.get('content-length') || 0;
  const statusCode = res.statusCode;
  
  logger.info(`HTTP ${method} ${url}`, {
    method,
    url,
    status: statusCode,
    contentLength,
    responseTime: `${responseTime}ms`,
    ip,
    userAgent
  });
};

// Veritabanı işlemlerini loglamak için özel metot
logger.logDbQuery = (operation, collection, query, duration) => {
  logger.debug(`DB ${operation} ${collection}`, {
    operation,
    collection,
    query: JSON.stringify(query),
    duration: `${duration}ms`
  });
};

// Kullanıcı işlemlerini loglamak için özel metot
logger.logUserActivity = (userId, action, details) => {
  logger.info(`USER ${action}`, {
    userId,
    action,
    details
  });
};

module.exports = logger;