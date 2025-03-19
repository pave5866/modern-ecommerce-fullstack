// Logger modülü
// Konsol loglarını üretim ortamında devre dışı bırakmak veya çeşitli loglama seviyelerini kullanmak için.

const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// İsmimizi log mesajlarında göstermek için
const APP_NAME = 'ModernShop';

// Aktif log seviyesi (development ortamında DEBUG, production ortamında INFO veya daha üstü olabilir)
const ACTIVE_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVEL.INFO : LOG_LEVEL.DEBUG;

// Hata ayıklama modunu kontrol et - development sırasında daha fazla log göstermek için
const isDebugMode = process.env.NODE_ENV !== 'production';

// Log stillerini tanımla
const LOG_STYLES = {
  DEBUG: 'color: #9E9E9E',
  INFO: 'color: #2196F3',
  WARN: 'color: #FF9800',
  ERROR: 'color: #F44336; font-weight: bold',
};

// Log zamanı için yardımcı fonksiyon
const getLogTime = () => {
  const now = new Date();
  return now.toISOString();
};

// Temel logger fonksiyonu
const log = (level, message, data = {}) => {
  // Eğer log seviyesi aktif seviyeden düşükse, log kayıtlarını gösterme
  if (level < ACTIVE_LOG_LEVEL) {
    return;
  }

  const timestamp = getLogTime();
  const levelName = Object.keys(LOG_LEVEL).find(key => LOG_LEVEL[key] === level);
  
  // Üretim ortamında konsola log atmamak için ek kontrol
  if (process.env.NODE_ENV === 'production' && level === LOG_LEVEL.DEBUG) {
    return;
  }

  try {
    // Hata nesnelerinin daha iyi gösterilmesi için özel işlem
    let formattedData = data;
    if (data instanceof Error) {
      formattedData = {
        name: data.name,
        message: data.message,
        stack: data.stack,
      };
    } else if (data.error instanceof Error) {
      formattedData = {
        ...data,
        error: {
          name: data.error.name,
          message: data.error.message,
          stack: data.error.stack,
        },
      };
    }

    // Log mesajını biçimlendir
    const logPrefix = `[${timestamp}] [${APP_NAME}] [${levelName}]:`;
    
    if (isDebugMode) {
      // Development modunda renkli loglar
      console.log(`%c${logPrefix} ${message}`, LOG_STYLES[levelName], formattedData);
    } else {
      // Üretim modunda daha basit loglar
      console.log(`${logPrefix} ${message}`, formattedData);
    }
    
    // Browser console'dan ayırmak için network veya backend logları eklenebilir
    if (level === LOG_LEVEL.ERROR) {
      // Üretim ortamında hataları bir error tracking servisine gönder
      // Örnek: sendToErrorTrackingService(message, formattedData);
    }
  } catch (err) {
    // Logger içinde bir hata olmasını engellemek için
    console.error('Logger hatası:', err);
  }
};

// Dışa aktarılacak API
const logger = {
  debug: (message, data) => log(LOG_LEVEL.DEBUG, message, data),
  info: (message, data) => log(LOG_LEVEL.INFO, message, data),
  warn: (message, data) => log(LOG_LEVEL.WARN, message, data),
  error: (message, data) => log(LOG_LEVEL.ERROR, message, data),
  
  // Belirli modüller için özel logger oluştur
  getLogger: (moduleName) => ({
    debug: (message, data) => log(LOG_LEVEL.DEBUG, `[${moduleName}] ${message}`, data),
    info: (message, data) => log(LOG_LEVEL.INFO, `[${moduleName}] ${message}`, data),
    warn: (message, data) => log(LOG_LEVEL.WARN, `[${moduleName}] ${message}`, data),
    error: (message, data) => log(LOG_LEVEL.ERROR, `[${moduleName}] ${message}`, data),
  }),
  
  // Network istekleri için özel logger
  network: {
    request: (url, method, data) => log(LOG_LEVEL.DEBUG, `[Network] İstek: ${method} ${url}`, data),
    response: (url, status, data) => log(LOG_LEVEL.DEBUG, `[Network] Yanıt: ${status} ${url}`, data),
    error: (url, error) => log(LOG_LEVEL.ERROR, `[Network] Hata: ${url}`, error),
  },
  
  // Auth işlemleri için özel logger
  auth: {
    login: (email) => log(LOG_LEVEL.INFO, `[Auth] Kullanıcı giriş yaptı`, { email }),
    logout: (email) => log(LOG_LEVEL.INFO, `[Auth] Kullanıcı çıkış yaptı`, { email }),
    register: (email) => log(LOG_LEVEL.INFO, `[Auth] Yeni kullanıcı kaydoldu`, { email }),
    error: (operation, error) => log(LOG_LEVEL.ERROR, `[Auth] Hata: ${operation}`, error),
  }
};

export default logger;