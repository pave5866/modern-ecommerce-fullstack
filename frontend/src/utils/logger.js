// Basit bir logger modülü
// Gerçek uygulamada winston gibi daha kapsamlı bir logger kullanılabilir

const isDevelopment = import.meta.env.MODE === 'development';

// Log seviyesi için renkler
const COLORS = {
  error: '#FF3333',
  warn: '#FF9900',
  info: '#33AAFF',
  debug: '#AAAAAA',
};

// Timestamp oluştur
const timestamp = () => {
  return new Date().toISOString();
};

// Loglama fonksiyonu
const log = (level, message, data = {}) => {
  const logObject = {
    timestamp: timestamp(),
    level,
    message,
    ...data
  };

  // Geliştirme modunda konsola log bas
  if (isDevelopment) {
    // Seviyeye göre konsol metodu
    const consoleMethod = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    }[level] || console.log;

    // Stil tanımla
    const style = `color: ${COLORS[level]}; font-weight: bold;`;
    
    // Log göster
    consoleMethod(
      `%c[${logObject.level.toUpperCase()}] ${logObject.timestamp}:`, 
      style, 
      message, 
      data
    );
  } else {
    // Üretim modunda kritik hataları konsola yaz
    if (level === 'error') {
      console.error(`[${logObject.level.toUpperCase()}]`, message, data);
    }
  }

  // Burada gerçek projede loglama servisine gönderilebilir
  // Örneğin: Sentry, LogRocket, kendi sunucunuz vb.
  
  return logObject;
};

// Logger arayüzü
const logger = {
  error: (message, data) => log('error', message, data),
  warn: (message, data) => log('warn', message, data),
  info: (message, data) => log('info', message, data),
  debug: (message, data) => log('debug', message, data),
  log: (level, message, data) => log(level, message, data),
};

export default logger;