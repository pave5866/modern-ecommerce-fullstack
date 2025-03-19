const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const fetch = require('node-fetch');
const https = require('https');
const dns = require('dns').promises;

// DNS ayarlarını zorla değiştir
require('dns').setServers([
  '8.8.8.8',      // Google DNS
  '1.1.1.1',      // Cloudflare DNS
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

// Supabase bağlantı bilgileri - Doğru anahtarlarla güncellendi
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ssewetlrirroabaohdduk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZXd0bHJpcnJvYWJhb2hkZHVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMzNTM1MCwiZXhwIjoyMDU3OTExMzUwfQ.bqlStX6sBBOmb881X5BalqDRGvl9p8rGNMspWk34V4U';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZXd0bHJpcnJvYWJhb2hkZHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMzUzNTAsImV4cCI6MjA1NzkxMTM1MH0.asAHLpi0pp20AKcTHxzRbB57sM4qRZidBsY_0qSG43Q';
const JWT_SECRET = process.env.JWT_SECRET || 'eyaM51ZPwTQJr5J8J7e3Nrf0HYuaIyaTnrrunP9up1fiGk4dUXgfMVKAeZozhWsuYB/tIwppfZ0Y7GUyYKkWqQ==';

// Hata kontrolü
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  logger.warn('ÇEVRE DEĞİŞKENLERİ: Supabase bağlantı bilgileri env dosyasında tanımlanmamış, yerleşik test değerleri kullanılıyor.');
  logger.warn('Eksik çevre değişkenleri: ' + 
    (!process.env.SUPABASE_URL ? 'SUPABASE_URL ' : '') + 
    (!process.env.SUPABASE_SERVICE_KEY ? 'SUPABASE_SERVICE_KEY ' : '') +
    (!process.env.SUPABASE_ANON_KEY ? 'SUPABASE_ANON_KEY' : '')
  );
}

// Bağlantı URL'sini kontrol et ve düzelt
const fixSupabaseUrl = (url) => {
  if (!url) return 'https://ssewetlrirroabaohdduk.supabase.co';
  if (!url.startsWith('http')) return `https://${url}`;
  return url;
};

// URL'leri düzelt
const fixedSupabaseUrl = fixSupabaseUrl(SUPABASE_URL);

// Supabase istemcilerini oluştur
let supabase;
let supabaseAdmin;

try {
  // Normal kullanıcılar için istemci (anonim anahtar)
  supabase = createClient(
    fixedSupabaseUrl,
    SUPABASE_ANON_KEY,
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
            timeout: 30000,
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
    fixedSupabaseUrl,
    SUPABASE_SERVICE_KEY,
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
            timeout: 30000,
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

  logger.info('Supabase bağlantısı başarıyla kuruldu');
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

// Supabase domain adresini IP adresine çözümle
const resolveSupabaseDomain = async () => {
  try {
    // URL'den alan adını çıkar
    let domain = SUPABASE_URL;
    domain = domain.replace(/^https?:\/\//, '');
    domain = domain.split('/')[0];
    
    logger.info(`Supabase domain adresini çözümlüyorum: ${domain}`);
    
    try {
      // DNS çözümlemesi dene
      const result = await dns.lookup(domain);
      logger.info(`Domain çözümlendi: ${domain} -> ${result.address}`);
      return result.address;
    } catch (dnsError) {
      logger.error(`DNS çözümleme hatası: ${dnsError.message}`);
      
      // IP adresi doğrudan kontrol et
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
        logger.info(`Domain zaten bir IP adresi: ${domain}`);
        return domain;
      }
      
      return null;
    }
  } catch (error) {
    logger.error(`Domain çözümleme hatası: ${error.message}`);
    return null;
  }
};

// Supabase bağlantısını kontrol et
const checkSupabaseConnection = async () => {
  try {
    // Önce DNS çözümlemesi yap - hata olursa atlayıp devam et
    try {
      const ipAddress = await resolveSupabaseDomain();
      if (ipAddress) {
        logger.info(`Supabase domain IP adresi: ${ipAddress}`);
      }
    } catch (dnsError) {
      logger.warn(`DNS çözümleme atlandı: ${dnsError.message}`);
    }
    
    // Basit bir sorgu deneyin
    try {
      const { data, error } = await supabase
        .from('products')
        .select('count')
        .limit(1);
      
      if (error) {
        logger.warn(`Supabase bağlantısı başarısız: Bağlantı hatası: ${error.message}`);
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
      logger.warn(`Supabase bağlantısı başarısız: Bağlantı hatası: ${queryError.message}`);
      return {
        connected: false,
        message: `Sorgu hatası: ${queryError.message}`
      };
    }
  } catch (error) {
    logger.warn(`Supabase bağlantısı başarısız: Bağlantı hatası: ${error.message}`);
    return {
      connected: false,
      message: `Bağlantı hatası: ${error.message}`
    };
  }
};

// Alternatif bağlantı test fonksiyonu (doğrudan fetch ile)
const testSupabaseConnection = async () => {
  try {
    // URL'yi oluştur
    const url = `${fixedSupabaseUrl}/rest/v1/products?limit=1`;
    
    // Bağlantı dene
    const response = await fetch(url, {
      method: 'GET',
      agent: httpsAgent,
      timeout: 15000,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      logger.info('Supabase doğrudan bağlantı başarılı');
      return true;
    } else {
      logger.warn(`Supabase doğrudan bağlantı uyarısı: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    logger.warn(`Supabase doğrudan bağlantı hatası: ${error.message}`);
    return false;
  }
};

// Bağlantı sorunlarını düzelt
const fixConnectionIssues = async () => {
  try {
    // DNS çözümle
    const ipAddress = await resolveSupabaseDomain();
    if (!ipAddress) {
      logger.warn('DNS çözümlemesi başarısız, IP adresi bulunamadı');
      return false;
    }
    
    // Hosts dosyasına eklemek için kullanılabilir
    logger.info(`Supabase domain -> IP: ${SUPABASE_URL.replace(/^https?:\/\//, '').split('/')[0]} -> ${ipAddress}`);
    
    return true;
  } catch (error) {
    logger.error(`Bağlantı düzeltme hatası: ${error.message}`);
    return false;
  }
};

// Doğrudan IP ile bağlantı dene
const connectWithIP = async () => {
  try {
    const ipAddress = await resolveSupabaseDomain();
    if (!ipAddress) return false;
    
    const ipUrl = SUPABASE_URL.replace(
      /^(https?:\/\/)[^\/]+(.*)$/,
      `$1${ipAddress}$2`
    );
    
    logger.info(`IP URL: ${ipUrl}`);
    
    const response = await fetch(`${ipUrl}/rest/v1/products?limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      agent: httpsAgent
    });
    
    return response.ok;
  } catch (error) {
    logger.error(`IP ile bağlantı hatası: ${error.message}`);
    return false;
  }
};

module.exports = { 
  supabase, 
  supabaseAdmin, 
  checkSupabaseConnection,
  testSupabaseConnection,
  resolveSupabaseDomain,
  fixConnectionIssues,
  connectWithIP
};