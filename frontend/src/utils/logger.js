/**
 * Basit bir logger implementasyonu.
 * İsteğe bağlı olarak daha gelişmiş bir logger (winston, pino vb.) ile değiştirilebilir.
 */

// Ortam değişkeni kontrolü
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Log seviyelerini tanımla
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Varsayılan log seviyesi (production ortamında sadece ERROR ve WARN, development ortamında hepsi)
const defaultLogLevel = isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

// Ortam değişkeninden log seviyesini al veya varsayılan kullan
const getCurrentLogLevel = () => {
  const envLevel = import.meta.env.VITE_LOG_LEVEL?.toUpperCase();
  return envLevel && LOG_LEVELS[envLevel] !== undefined 
    ? LOG_LEVELS[envLevel] 
    : defaultLogLevel;
};

// Console için farklı stillerde loglar oluştur
const formatLogWithStyle = (level, message, data) => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  
  let style = '';
  let prefix = '';
  
  switch (level) {
    case 'ERROR':
      style = 'background: #f44336; color: white; padding: 2px 4px; border-radius: 2px;';
      prefix = '%c[ERROR]';
      break;
    case 'WARN':
      style = 'background: #ff9800; color: white; padding: 2px 4px; border-radius: 2px;';
      prefix = '%c[WARN]';
      break;
    case 'INFO':
      style = 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 2px;';
      prefix = '%c[INFO]';
      break;
    case 'DEBUG':
      style = 'background: #9e9e9e; color: white; padding: 2px 4px; border-radius: 2px;';
      prefix = '%c[DEBUG]';
      break;
    default:
      style = '';
      prefix = `[${level}]`;
  }
  
  return {
    prefix,
    style,
    text: `${timestamp} ${message}${dataStr}`
  };
};

/**
 * Hata logu oluşturur
 * @param {string} message Log mesajı
 * @param {object} data İlave log verisi
 */
const error = (message, data) => {
  if (getCurrentLogLevel() >= LOG_LEVELS.ERROR) {
    const { prefix, style, text } = formatLogWithStyle('ERROR', message, data);
    console.error(prefix, style, text);
    
    // İsteğe bağlı: Hataları bir hata izleme servisine göndermek için buraya kod eklenebilir
  }
};

/**
 * Uyarı logu oluşturur
 * @param {string} message Log mesajı
 * @param {object} data İlave log verisi
 */
const warn = (message, data) => {
  if (getCurrentLogLevel() >= LOG_LEVELS.WARN) {
    const { prefix, style, text } = formatLogWithStyle('WARN', message, data);
    console.warn(prefix, style, text);
  }
};

/**
 * Bilgi logu oluşturur
 * @param {string} message Log mesajı
 * @param {object} data İlave log verisi
 */
const info = (message, data) => {
  if (getCurrentLogLevel() >= LOG_LEVELS.INFO) {
    const { prefix, style, text } = formatLogWithStyle('INFO', message, data);
    console.info(prefix, style, text);
  }
};

/**
 * Debug logu oluşturur
 * @param {string} message Log mesajı
 * @param {object} data İlave log verisi
 */
const debug = (message, data) => {
  if (getCurrentLogLevel() >= LOG_LEVELS.DEBUG) {
    const { prefix, style, text } = formatLogWithStyle('DEBUG', message, data);
    console.debug(prefix, style, text);
  }
};

// Logger metodlarını dışa aktar
export default {
  error,
  warn,
  info,
  debug,
};