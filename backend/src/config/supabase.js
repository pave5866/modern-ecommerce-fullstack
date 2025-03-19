const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const fetch = require('node-fetch'); // Node.js'de fetch kullanımı için

// Supabase bağlantı bilgileri
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Çevre değişkenleri logla (debugging için)
logger.info('Supabase çevre değişkenleri kontrol ediliyor');
logger.info(`SUPABASE_URL mevcut: ${!!SUPABASE_URL}`);
logger.info(`SUPABASE_SERVICE_KEY mevcut: ${!!SUPABASE_SERVICE_KEY}`);

// Supabase bilgilerini kontrol et
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  logger.error('Supabase bağlantı bilgileri eksik. .env dosyasını kontrol edin.');
  logger.error('Eksik çevre değişkenleri: ' + 
    (!SUPABASE_URL ? 'SUPABASE_URL ' : '') + 
    (!SUPABASE_SERVICE_KEY ? 'SUPABASE_SERVICE_KEY' : '')
  );
}

// URL güvenlik kontrolü
const isValidUrl = (url) => {
  try {
    if (!url) return false;
    new URL(url); // URL geçerli mi kontrol et
    return true;
  } catch (e) {
    return false;
  }
};

// Supabase URL'sini kontrol et
if (!isValidUrl(SUPABASE_URL)) {
  logger.error(`Geçersiz Supabase URL formatı: ${SUPABASE_URL || 'undefined'}`);
}

// Global fetch değişkenini ayarla - eski versiyonlar için gerekli
global.fetch = fetch;

// Supabase istemcisini oluştur
let supabase;
let supabaseAdmin;

try {
  // Varsayılan URL (gerçek URL geçersizse kullanılır)
  const fallbackUrl = 'https://xyznonexistent.supabase.co';
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  // Normal kullanıcılar için istemci
  supabase = createClient(
    isValidUrl(SUPABASE_URL) ? SUPABASE_URL : fallbackUrl,
    SUPABASE_SERVICE_KEY || fallbackKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Admin işlemleri için istemci (tam erişim)
  supabaseAdmin = createClient(
    isValidUrl(SUPABASE_URL) ? SUPABASE_URL : fallbackUrl,
    SUPABASE_SERVICE_KEY || fallbackKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  logger.info('Supabase istemcisi başarıyla oluşturuldu');
  
  // Bağlantıyı test et ve durumu logla
  setTimeout(async () => {
    try {
      const { error } = await supabase.auth.getSession();
      if (error) {
        logger.warn(`Supabase bağlantı testi hatası: ${error.message}`);
      } else {
        logger.info('Supabase bağlantı testi başarılı');
      }
    } catch (e) {
      logger.error(`Supabase bağlantı testi exception: ${e.message}`);
    }
  }, 1000);
  
} catch (error) {
  logger.error(`Supabase bağlantı hatası: ${error.message}`);
  
  // Hata durumunda bile uygulamanın çalışması için sahte bir istemci oluştur
  const createFakeClient = () => {
    return {
      from: () => ({ 
        select: () => Promise.resolve({ data: [], error: new Error('Supabase bağlantısı kurulamadı') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase bağlantısı kurulamadı') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase bağlantısı kurulamadı') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase bağlantısı kurulamadı') }),
        eq: () => ({ select: () => Promise.resolve({ data: null, error: new Error('Supabase bağlantısı kurulamadı') }) }),
        order: () => ({ range: () => Promise.resolve({ data: [], error: new Error('Supabase bağlantısı kurulamadı') }) }),
        range: () => Promise.resolve({ data: [], error: new Error('Supabase bağlantısı kurulamadı') }),
        single: () => Promise.resolve({ data: null, error: new Error('Supabase bağlantısı kurulamadı') }),
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
  };
  
  supabase = createFakeClient();
  supabaseAdmin = createFakeClient();
  
  logger.info('Supabase için yedek istemci oluşturuldu');
}

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
    try {
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
    } catch (e) {
      logger.error(`safeFetch exception: ${e.message}`);
      return { data: [], error: new Error(`safeFetch exception: ${e.message}`) };
    }
  });
};

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

// Test fonksiyonları
const getTestData = (table) => {
  const testData = {
    products: [
      {
        id: 'test-1',
        name: 'Test Ürünü 1',
        description: 'Bu bir test ürünüdür',
        price: 99.99,
        stock: 10,
        is_active: true,
        images: ['https://via.placeholder.com/150'],
        categories: { name: 'Test Kategori' }
      },
      {
        id: 'test-2',
        name: 'Test Ürünü 2',
        description: 'Bu bir başka test ürünüdür',
        price: 149.99,
        stock: 5,
        is_active: true,
        images: ['https://via.placeholder.com/150'],
        categories: { name: 'Test Kategori' }
      }
    ],
    users: [
      {
        id: 'test-user-1',
        email: 'test@example.com',
        full_name: 'Test Kullanıcı',
        role: 'user'
      }
    ],
    categories: [
      {
        id: 'test-cat-1',
        name: 'Test Kategori',
        description: 'Test kategorisi açıklaması'
      }
    ]
  };
  
  return { data: testData[table] || [] };
};

module.exports = { 
  supabase, 
  supabaseAdmin, 
  checkSupabaseConnection,
  safeFetch,
  safeQuery,
  getTestData
};