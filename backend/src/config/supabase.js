const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const fetch = require('node-fetch'); // Node.js'de fetch kullanımı için

// Global fetch değişkenini ayarla
global.fetch = fetch;

// Supabase bağlantı bilgileri
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Hata kontrolü
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  logger.error('Supabase bağlantı bilgileri eksik. .env dosyasını kontrol edin.');
  logger.error('Eksik çevre değişkenleri: ' + 
    (!SUPABASE_URL ? 'SUPABASE_URL ' : '') + 
    (!SUPABASE_SERVICE_KEY ? 'SUPABASE_SERVICE_KEY' : '')
  );
}

// Supabase istemcisini oluştur
let supabase;
let supabaseAdmin;

try {
  // Normal kullanıcılar için istemci
  supabase = createClient(
    SUPABASE_URL || 'https://placeholder-url.supabase.co',
    SUPABASE_SERVICE_KEY || 'placeholder-key-for-initialization',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Admin işlemleri için istemci (tam erişim)
  supabaseAdmin = createClient(
    SUPABASE_URL || 'https://placeholder-url.supabase.co',
    SUPABASE_SERVICE_KEY || 'placeholder-key-for-initialization',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    logger.info('Supabase bağlantısı başarıyla kuruldu');
  } else {
    logger.warn('Supabase geçici olarak başlatıldı, ancak geçerli kimlik bilgileri eksik');
  }
} catch (error) {
  logger.error(`Supabase bağlantı hatası: ${error.message}`);
  
  // Hata durumunda bile uygulamanın çalışması için sahte bir istemci oluştur
  supabase = {
    from: () => ({ 
      select: () => Promise.resolve({ data: [], error: new Error('Supabase bağlantısı kurulamadı') }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase bağlantısı kurulamadı') }),
      update: () => Promise.resolve({ data: null, error: new Error('Supabase bağlantısı kurulamadı') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Supabase bağlantısı kurulamadı') }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: new Error('Supabase bağlantısı kurulamadı') }),
        download: () => Promise.resolve({ data: null, error: new Error('Supabase bağlantısı kurulamadı') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: () => Promise.resolve({ data: null, error: new Error('Supabase bağlantısı kurulamadı') })
      })
    },
    auth: {
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase bağlantısı kurulamadı') }),
      signIn: () => Promise.resolve({ data: null, error: new Error('Supabase bağlantısı kurulamadı') }),
      signOut: () => Promise.resolve({ error: new Error('Supabase bağlantısı kurulamadı') }),
      getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase bağlantısı kurulamadı') }),
      getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Supabase bağlantısı kurulamadı') })
    }
  };
  
  supabaseAdmin = supabase;
}

// Sağlık kontrolü fonksiyonu
const checkSupabaseConnection = async () => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return {
        connected: false,
        message: 'Supabase bağlantı bilgileri eksik'
      };
    }
    
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        connected: false,
        message: `Bağlantı hatası: ${error.message}`
      };
    }
    
    return {
      connected: true,
      message: 'Bağlantı başarılı'
    };
  } catch (error) {
    return {
      connected: false,
      message: `Bağlantı hatası: ${error.message}`
    };
  }
};

// Supabase kullanımı için yardımcı fonksiyonlar

// Try-catch ile Supabase sorgularını çalıştır
const safeQuery = async (queryFn) => {
  try {
    return await queryFn();
  } catch (error) {
    logger.error(`Supabase sorgu hatası: ${error.message}`);
    return { data: null, error: new Error(`Sorgu hatası: ${error.message}`) };
  }
};

// Güvenli veri alım fonksiyonu
const safeFetch = async (table, query = {}) => {
  return safeQuery(async () => {
    const builder = supabase.from(table).select(query.select || '*');
    
    if (query.where) {
      Object.entries(query.where).forEach(([key, value]) => {
        builder.eq(key, value);
      });
    }
    
    if (query.order) {
      builder.order(query.order.column, { ascending: query.order.ascending });
    }
    
    if (query.limit) {
      builder.limit(query.limit);
    }
    
    if (query.offset) {
      builder.range(query.offset, query.offset + (query.limit || 10) - 1);
    }
    
    return await builder;
  });
};

module.exports = { 
  supabase, 
  supabaseAdmin, 
  checkSupabaseConnection,
  safeFetch,
  safeQuery
};