const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const fetch = require('node-fetch');
const https = require('https');
const dns = require('dns');

// DNS ayarlarını yapılandır - DNS çözümlemesi için
dns.setServers([
  '8.8.8.8',  // Google DNS
  '1.1.1.1',  // Cloudflare DNS
  '208.67.222.222' // OpenDNS
]);

// Global fetch değişkenini ayarla
global.fetch = fetch;

// HTTPS Ajanı oluştur - bağlantı sorunlarını çözmek için
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // SSL sertifika doğrulamasını geçici olarak devre dışı bırakır
  keepAlive: true,
  timeout: 60000,
  family: 4 // IPv4 kullan
});

// Supabase bağlantı bilgileri
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY; 

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
  // Normal kullanıcılar için istemci (anonim anahtar)
  supabase = createClient(
    SUPABASE_URL || 'https://sswetlrirroabaohdduk.supabase.co',
    SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzd2V0bHJpcnJvYWJhb2hkZHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMzUzNTAsImV4cCI6MjA1NzkxMTM1MH0.asAHLpi0pp20AKcTHxzRbB57sM4qRZidBsY_0qSG43Q',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: (url, options) => {
          return fetch(url, { 
            ...options,
            agent: httpsAgent,
            headers: {
              ...options?.headers,
              'X-Client-Info': 'nodejs-backend'
            }
          });
        }
      },
      db: {
        schema: 'public'
      }
    }
  );

  // Admin işlemleri için istemci (tam erişim)
  supabaseAdmin = createClient(
    SUPABASE_URL || 'https://sswetlrirroabaohdduk.supabase.co',
    SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzd2V0bHJpcnJvYWJhb2hkZHVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMzNTM1MCwiZXhwIjoyMDU3OTExMzUwfQ.JqE_Wl6CHpqg9xCJ0R0g5NhkR2Fq-XPz5D3oTb-JJfA',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: (url, options) => {
          return fetch(url, { 
            ...options,
            agent: httpsAgent,
            headers: {
              ...options?.headers,
              'X-Client-Info': 'nodejs-backend-admin'
            }
          });
        }
      },
      db: {
        schema: 'public'
      }
    }
  );

  if (SUPABASE_URL && (SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)) {
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

// IP adresini çöz
const resolveSupabaseDomain = async () => {
  try {
    // URL'den alan adını çıkar
    let domain = SUPABASE_URL || 'https://sswetlrirroabaohdduk.supabase.co';
    domain = domain.replace(/^https?:\/\//, '');
    domain = domain.split('/')[0];
    
    logger.info(`Supabase domain adresini çözümlüyorum: ${domain}`);
    
    return new Promise((resolve) => {
      dns.lookup(domain, (err, address) => {
        if (err) {
          logger.error(`DNS çözümleme hatası: ${err.message}`);
          resolve(null);
        } else {
          logger.info(`Domain çözümlendi: ${domain} -> ${address}`);
          resolve(address);
        }
      });
    });
  } catch (error) {
    logger.error(`Domain çözümleme hatası: ${error.message}`);
    return null;
  }
};

// Sağlık kontrolü fonksiyonu
const checkSupabaseConnection = async () => {
  try {
    if (!SUPABASE_URL || (!SUPABASE_SERVICE_KEY && !SUPABASE_ANON_KEY)) {
      return {
        connected: false,
        message: 'Supabase bağlantı bilgileri eksik'
      };
    }
    
    // Önce DNS çözümlemesi yap
    const ipAddress = await resolveSupabaseDomain();
    if (!ipAddress) {
      return {
        connected: false,
        message: 'Supabase domain adı çözümlenemedi'
      };
    }
    
    // Basit bir sorgu deneyin (hata yönetimini iyileştir)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('count')
        .limit(1);
      
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
    } catch (queryError) {
      return {
        connected: false,
        message: `Sorgu hatası: ${queryError.message}`
      };
    }
  } catch (error) {
    return {
      connected: false,
      message: `Bağlantı hatası: ${error.message}`
    };
  }
};

// Alternatif bağlantı test fonksiyonu (doğrudan fetch ile)
const testSupabaseConnection = async () => {
  try {
    const url = `${SUPABASE_URL || 'https://sswetlrirroabaohdduk.supabase.co'}/rest/v1/products?limit=1`;
    const response = await fetch(url, {
      method: 'GET',
      agent: httpsAgent,
      headers: {
        'apikey': SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzd2V0bHJpcnJvYWJhb2hkZHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMzUzNTAsImV4cCI6MjA1NzkxMTM1MH0.asAHLpi0pp20AKcTHxzRbB57sM4qRZidBsY_0qSG43Q',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.ok) {
      logger.info('Supabase doğrudan bağlantı başarılı');
      return true;
    } else {
      logger.error(`Supabase doğrudan bağlantı hatası: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    logger.error(`Supabase doğrudan bağlantı hatası: ${error.message}`);
    return false;
  }
};

module.exports = { 
  supabase, 
  supabaseAdmin, 
  checkSupabaseConnection,
  testSupabaseConnection,
  resolveSupabaseDomain
};