/**
 * Frontend için güvenli bir logger modülü
 * Üretim ortamında logları kapatabilir veya sadece belirli seviyeleri gösterebiliriz
 */

import { logAPI } from '../services';

// Ortam değişkenine göre log seviyesini belirleme
const LOG_LEVEL = import.meta.env.NODE_ENV === 'production' ? 'error' : 'debug';

// Log seviyeleri ve öncelikleri
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Seçilen log seviyesine göre logları gösterme/gizleme
const shouldLog = (level) => {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
};

// Zaman damgası oluşturma
const timestamp = () => {
  return new Date().toISOString();
};

// Log formatını oluşturma
const formatLog = (level, message, meta = {}) => {
  const ts = timestamp();
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${ts} [${level.toUpperCase()}]: ${message} ${metaStr}`;
};

// Backend'e log gönderme
const sendLogToBackend = async (level, message, meta = {}) => {
  try {
    // Sadece üretim ortamında backend'e gönder
    if (import.meta.env.PROD) {
      await logAPI.sendLog({
        level,
        message,
        meta,
        source: 'frontend',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    // Log gönderme hatası durumunda sessizce devam et
  }
};

// Güvenli log fonksiyonu - console kullanmadan
const safeLog = (level, formattedMessage, message, meta) => {
  // Üretim ortamında console kullanımını engelle
  if (import.meta.env.PROD) {
    // Üretim ortamında logları backend'e gönder
    sendLogToBackend(level, message, meta);
    return;
  }
  
  // Geliştirme ortamında konsola yaz (ama üretimde değil)
  if (!import.meta.env.PROD) {
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }
  
  // Geliştirme ortamında DOM'a log ekleyebiliriz (opsiyonel)
  if (typeof document !== 'undefined') {
    let logContainer = document.getElementById('app-logs');
    if (!logContainer) {
      logContainer = document.createElement('div');
      logContainer.id = 'app-logs';
      logContainer.style.display = 'none'; // Gizli tut
      document.body.appendChild(logContainer);
    }
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${level}`;
    logEntry.textContent = formattedMessage;
    logContainer.appendChild(logEntry);
  }
};

// Logger fonksiyonları
const logger = {
  debug: (message, meta) => {
    if (shouldLog('debug')) {
      const formattedMessage = formatLog('debug', message, meta);
      safeLog('debug', formattedMessage, message, meta);
    }
  },
  
  info: (message, meta) => {
    if (shouldLog('info')) {
      const formattedMessage = formatLog('info', message, meta);
      safeLog('info', formattedMessage, message, meta);
    }
  },
  
  warn: (message, meta) => {
    if (shouldLog('warn')) {
      const formattedMessage = formatLog('warn', message, meta);
      safeLog('warn', formattedMessage, message, meta);
    }
  },
  
  error: (message, meta) => {
    if (shouldLog('error')) {
      const formattedMessage = formatLog('error', message, meta);
      safeLog('error', formattedMessage, message, meta);
      
      // Hata loglarını her zaman backend'e gönder
      sendLogToBackend('error', message, meta);
    }
  }
};

export default logger;