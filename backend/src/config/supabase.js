const { createClient } = require('@supabase/supabase-js');
const winston = require('winston');

// Winston logger yapılandırması
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Supabase bağlantı bilgileri
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
let supabaseAdmin = null;

// Supabase istemcilerini oluştur
try {
  if (!supabaseUrl || !supabaseServiceKey) {
    logger.error('Supabase bağlantı bilgileri eksik. SUPABASE_URL ve SUPABASE_SERVICE_KEY env değişkenleri gerekli.');
    // Uygulama başlangıcında kritik ancak çalışmayı engellemek istemiyorsak default değerler atayabiliriz
    supabase = createClient('https://placeholder-url.supabase.co', 'placeholder-key');
    supabaseAdmin = createClient('https://placeholder-url.supabase.co', 'placeholder-key');
  } else {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    logger.info('Supabase bağlantısı başarıyla kuruldu');
  }
} catch (error) {
  logger.error(`Supabase bağlantısı oluşturulurken hata oluştu: ${error.message}`);
  // Hata durumunda boş client oluştur, uygulama çalışmaya devam etsin
  supabase = createClient('https://placeholder-url.supabase.co', 'placeholder-key');
  supabaseAdmin = createClient('https://placeholder-url.supabase.co', 'placeholder-key');
}

module.exports = { supabase, supabaseAdmin };