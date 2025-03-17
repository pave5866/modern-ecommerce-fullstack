const pino = require('pino');
const path = require('path');
const fs = require('fs');

// Log dizinini oluştur (yoksa)
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log yapılandırması
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: {
    targets: [
      // Formatlı konsol çıktısı
      {
        target: 'pino-pretty',
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
      // Dosyaya log yazdırma
      {
        target: 'pino/file',
        level: 'info',
        options: { destination: path.join(logDir, 'app.log') },
      },
      // Hata logları ayrı dosyaya
      {
        target: 'pino/file',
        level: 'error',
        options: { destination: path.join(logDir, 'error.log') },
      },
    ],
  },
  
  // Standart log metadatası
  base: {
    env: process.env.NODE_ENV,
  },
});

module.exports = logger;