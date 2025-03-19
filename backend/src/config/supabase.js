/**
 * Supabase bağlantı konfigürasyonu
 */
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Supabase bağlantı bilgileri
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Ortam değişkenlerini kontrol et
if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Supabase bağlantı bilgileri eksik! .env dosyanızı kontrol edin.');
  throw new Error('Supabase URL veya servis anahtarı bulunamadı.');
}

// Supabase istemcisini oluştur (servis rolü ile - tam yetkili)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Anonim kullanıcı için istemci
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// Bağlantı durumunu kaydet
logger.info('Supabase istemcisi oluşturuldu', { url: supabaseUrl });

module.exports = { supabase, supabaseAnon }; 