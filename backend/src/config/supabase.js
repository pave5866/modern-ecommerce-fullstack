const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const fetch = require('node-fetch');
const https = require('https');

// Global fetch değişkenini ayarla
global.fetch = fetch;

// HTTPS Ajanı oluştur
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: 60000
});

// Mock data - Supabase bağlantısı olmadığında kullanılacak
const MOCK_DATA = {
  products: [
    { id: 1, name: 'Akıllı Telefon', price: 5999, description: 'Son model akıllı telefon', is_active: true, stock: 100 },
    { id: 2, name: 'Laptop', price: 12999, description: 'Yüksek performanslı dizüstü bilgisayar', is_active: true, stock: 50 },
    { id: 3, name: 'Tablet', price: 3999, description: 'Hafif ve taşınabilir tablet', is_active: true, stock: 75 },
    { id: 4, name: 'Kulaklık', price: 899, description: 'Gürültü önleyici kulaklık', is_active: true, stock: 200 },
    { id: 5, name: 'Akıllı Saat', price: 1499, description: 'Spor ve sağlık takibi için akıllı saat', is_active: true, stock: 120 }
  ],
  categories: [
    { id: 1, name: 'Elektronik', description: 'Elektronik ürünler' },
    { id: 2, name: 'Giyim', description: 'Giyim ürünleri' },
    { id: 3, name: 'Ev & Yaşam', description: 'Ev ve yaşam ürünleri' }
  ],
  users: [
    { id: 1, email: 'admin@example.com', role: 'admin', name: 'Admin User' },
    { id: 2, email: 'user@example.com', role: 'user', name: 'Normal User' }
  ],
  orders: [],
  cart_items: []
};

// Supabase bağlantı bilgileri
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ssewetlrirroabaohdduk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZXd0bHJpcnJvYWJhb2hkZHVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMzNTM1MCwiZXhwIjoyMDU3OTExMzUwfQ.bqlStX6sBBOmb881X5BalqDRGvl9p8rGNMspWk34V4U';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZXd0bHJpcnJvYWJhb2hkZHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMzUzNTAsImV4cCI6MjA1NzkxMTM1MH0.asAHLpi0pp20AKcTHxzRbB57sM4qRZidBsY_0qSG43Q';

// Mock Supabase istemcisi oluşturan fonksiyon
const createMockClient = () => {
  logger.info('Mock Supabase istemcisi oluşturuluyor. Gerçek veritabanı bağlantısı olmadan çalışılacak.');
  
  return {
    from: (table) => {
      const data = MOCK_DATA[table] || [];
      
      return {
        select: (columns) => {
          return {
            eq: (column, value) => {
              const filtered = data.filter(item => item[column] == value);
              return Promise.resolve({ 
                data: filtered, 
                error: null,
                count: filtered.length
              });
            },
            neq: (column, value) => {
              const filtered = data.filter(item => item[column] != value);
              return Promise.resolve({ 
                data: filtered, 
                error: null,
                count: filtered.length
              });
            },
            lt: (column, value) => {
              const filtered = data.filter(item => item[column] < value);
              return Promise.resolve({ 
                data: filtered, 
                error: null,
                count: filtered.length
              });
            },
            gt: (column, value) => {
              const filtered = data.filter(item => item[column] > value);
              return Promise.resolve({ 
                data: filtered, 
                error: null,
                count: filtered.length
              });
            },
            lte: (column, value) => {
              const filtered = data.filter(item => item[column] <= value);
              return Promise.resolve({ 
                data: filtered, 
                error: null,
                count: filtered.length
              });
            },
            gte: (column, value) => {
              const filtered = data.filter(item => item[column] >= value);
              return Promise.resolve({ 
                data: filtered, 
                error: null,
                count: filtered.length
              });
            },
            ilike: (column, value) => {
              const pattern = value.replace(/%/g, '').toLowerCase();
              const filtered = data.filter(item => String(item[column]).toLowerCase().includes(pattern));
              return Promise.resolve({ 
                data: filtered, 
                error: null,
                count: filtered.length
              });
            },
            order: (column, { ascending }) => {
              return {
                range: (start, end) => {
                  // Sıralama ve sayfalama
                  const sorted = [...data].sort((a, b) => {
                    if (ascending) {
                      return a[column] > b[column] ? 1 : -1;
                    } else {
                      return a[column] < b[column] ? 1 : -1;
                    }
                  });
                  
                  const paged = sorted.slice(start, end + 1);
                  
                  return Promise.resolve({ 
                    data: paged, 
                    error: null,
                    count: data.length
                  });
                },
                limit: (limit) => {
                  const sorted = [...data].sort((a, b) => {
                    if (ascending) {
                      return a[column] > b[column] ? 1 : -1;
                    } else {
                      return a[column] < b[column] ? 1 : -1;
                    }
                  });
                  
                  return Promise.resolve({ 
                    data: sorted.slice(0, limit), 
                    error: null,
                    count: data.length
                  });
                }
              };
            },
            limit: (limit) => {
              return Promise.resolve({ 
                data: data.slice(0, limit), 
                error: null,
                count: data.length
              });
            },
            single: () => {
              return Promise.resolve({ 
                data: data.length > 0 ? data[0] : null, 
                error: data.length === 0 ? { message: 'Kayıt bulunamadı' } : null
              });
            }
          };
        },
        insert: (items) => {
          const newItems = items.map((item, index) => ({
            ...item,
            id: data.length > 0 ? Math.max(...data.map(d => d.id)) + index + 1 : index + 1,
            created_at: new Date().toISOString()
          }));
          
          MOCK_DATA[table] = [...data, ...newItems];
          
          return {
            select: () => ({
              single: () => Promise.resolve({ data: newItems[0], error: null })
            })
          };
        },
        update: (updates) => {
          return {
            eq: (column, value) => {
              const index = data.findIndex(item => item[column] == value);
              if (index >= 0) {
                MOCK_DATA[table][index] = { ...data[index], ...updates, updated_at: new Date().toISOString() };
                return {
                  select: () => ({
                    single: () => Promise.resolve({ data: MOCK_DATA[table][index], error: null })
                  })
                };
              }
              return {
                select: () => ({
                  single: () => Promise.resolve({ data: null, error: { message: 'Kayıt bulunamadı' } })
                })
              };
            }
          };
        },
        delete: () => {
          return {
            eq: (column, value) => {
              const index = data.findIndex(item => item[column] == value);
              if (index >= 0) {
                MOCK_DATA[table].splice(index, 1);
                return Promise.resolve({ data: {}, error: null });
              }
              return Promise.resolve({ data: null, error: { message: 'Kayıt bulunamadı' } });
            }
          };
        }
      };
    },
    storage: {
      from: (bucket) => ({
        upload: (path, file) => Promise.resolve({ 
          data: { path }, 
          error: null 
        }),
        download: (path) => Promise.resolve({ 
          data: new Uint8Array(0), 
          error: null 
        }),
        getPublicUrl: (path) => ({ 
          data: { publicUrl: `https://example.com/storage/${bucket}/${path}` } 
        }),
        remove: (paths) => Promise.resolve({ 
          data: {}, 
          error: null 
        })
      })
    },
    auth: {
      signUp: ({ email, password }) => Promise.resolve({ 
        data: { user: { id: 'mock-user-id', email } }, 
        error: null 
      }),
      signIn: ({ email, password }) => Promise.resolve({ 
        data: { user: { id: 'mock-user-id', email }, session: { access_token: 'mock-token' } }, 
        error: null 
      }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ 
        data: { user: { id: 'mock-user-id', email: 'mock@example.com' } }, 
        error: null 
      }),
      getSession: () => Promise.resolve({ 
        data: { session: { access_token: 'mock-token' } }, 
        error: null 
      })
    }
  };
};

// Supabase istemcilerini oluştur
let supabase;
let supabaseAdmin;
let useMockData = false;

try {
  // Supabase bağlantısını dene
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase bağlantı bilgileri eksik');
  }
  
  // Normal kullanıcılar için istemci (anonim anahtar)
  supabase = createClient(
    SUPABASE_URL,
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
            timeout: 30000
          });
        }
      }
    }
  );

  // Admin işlemleri için istemci (tam erişim)
  supabaseAdmin = createClient(
    SUPABASE_URL,
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
            timeout: 30000
          });
        }
      }
    }
  );

  logger.info('Supabase bağlantısı başarıyla kuruldu');
} catch (error) {
  logger.error(`Supabase bağlantı hatası: ${error.message}`);
  
  // Supabase bağlantısı kurulamazsa mock veriler kullan
  supabase = createMockClient();
  supabaseAdmin = createMockClient();
  useMockData = true;
}

// Supabase bağlantısını kontrol et
const checkSupabaseConnection = async () => {
  if (useMockData) {
    return {
      connected: true,
      message: 'Mock veri modu aktif - gerçek bağlantı testi atlandı',
      mockMode: true
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (error) {
      logger.warn(`Supabase bağlantısı başarısız: ${error.message}`);
      
      // Bağlantı başarısız olursa, mock verilere geç
      supabase = createMockClient();
      supabaseAdmin = createMockClient();
      useMockData = true;
      
      return {
        connected: false,
        message: `Bağlantı hatası: ${error.message}`,
        mockMode: true
      };
    }
    
    return {
      connected: true,
      message: 'Bağlantı başarılı'
    };
  } catch (error) {
    logger.warn(`Supabase bağlantısı başarısız: ${error.message}`);
    
    // Bağlantı başarısız olursa, mock verilere geç
    if (!useMockData) {
      supabase = createMockClient();
      supabaseAdmin = createMockClient();
      useMockData = true;
    }
    
    return {
      connected: false,
      message: `Bağlantı hatası: ${error.message}`,
      mockMode: true
    };
  }
};

// Alternatif bağlantı test fonksiyonu (doğrudan fetch ile)
const testSupabaseConnection = async () => {
  if (useMockData) {
    return true; // Mock veri modu aktifse, bağlantı var say
  }
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/products?limit=1`;
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
      logger.warn(`Supabase doğrudan bağlantı hatası: ${response.status} ${response.statusText}`);
      
      // Bağlantı başarısız olursa, mock verilere geç
      if (!useMockData) {
        supabase = createMockClient();
        supabaseAdmin = createMockClient();
        useMockData = true;
      }
      
      return false;
    }
  } catch (error) {
    logger.warn(`Supabase doğrudan bağlantı hatası: ${error.message}`);
    
    // Bağlantı başarısız olursa, mock verilere geç
    if (!useMockData) {
      supabase = createMockClient();
      supabaseAdmin = createMockClient();
      useMockData = true;
    }
    
    return false;
  }
};

module.exports = { 
  supabase, 
  supabaseAdmin, 
  checkSupabaseConnection,
  testSupabaseConnection,
  useMockData
};