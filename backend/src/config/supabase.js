/**
 * Supabase bağlantı konfigürasyonu
 */
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Supabase bağlantı bilgileri
const supabaseUrl = process.env.SUPABASE_URL || 'https://sswetlrirroabaohdduk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzd2V0bHJpcnJvYWJhb2hkZHVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNjQxMjUzOCwiZXhwIjoyMDMxOTg4NTM4fQ.MmfoE9s6cBaI7YwV9gPQn0wDQJdMEQVbwVmE2JEjwlM';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzd2V0bHJpcnJvYWJhb2hkZHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY0MTI1MzgsImV4cCI6MjAzMTk4ODUzOH0.WQNLxG9gIQY7PaXW6BtxHDhqLQBN1HRyKc9fYEU2c88';

// Bağlantı bilgilerini loglama (güvenlik için kısmi görüntüleme)
logger.info('Supabase bağlantı bilgileri:', { 
  url: supabaseUrl, 
  serviceKey: supabaseServiceKey ? '***' + supabaseServiceKey.slice(-5) : 'Tanımlanmamış',
  anonKey: supabaseAnonKey ? '***' + supabaseAnonKey.slice(-5) : 'Tanımlanmamış'
});

// Supabase istemcisini oluştur (servis rolü ile - tam yetkili)
let supabase;
let supabaseAnon;

try {
  // Tam yetkili istemci
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Anonim kullanıcı için istemci
  supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  });

  logger.info('Supabase istemcisi başarıyla oluşturuldu', { url: supabaseUrl });
} catch (error) {
  logger.error('Supabase istemcisi oluşturulurken hata:', { error: error.message });
  
  // Default olarak basit bir istemci oluştur
  supabase = {
    storage: { from: () => ({ upload: () => ({}), getPublicUrl: () => ({ data: { publicUrl: '' } }), remove: () => ({}) }) },
    from: () => ({ select: () => ({ eq: () => ({ single: () => ({}) }) }), insert: () => ({}), update: () => ({}), delete: () => ({}) })
  };
  supabaseAnon = supabase;
  
  logger.warn('Supabase istemcisi oluşturulamadı, test modu etkinleştirildi');
}

module.exports = { supabase, supabaseAnon };