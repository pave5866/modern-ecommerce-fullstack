/**
 * Fallback Sistemleri
 * 
 * Bu modül, bazı servisler veya bağımlılıklar kullanılamadığında
 * sistemin çalışmaya devam etmesi için fallback mekanizmaları sağlar.
 */

const logger = require('./logger');

/**
 * Supabase için fallback istemcisi
 * Gerçek bir Supabase istemcisi olmadığında kullanılır
 */
const createSupabaseFallback = () => {
  logger.warn('Supabase fallback istemcisi kullanılıyor');
  
  return {
    storage: { 
      from: (bucket) => ({ 
        upload: (path, file) => {
          logger.info(`[FALLBACK] Supabase upload çağrıldı: ${bucket}/${path}`);
          return { data: { path }, error: null };
        },
        getPublicUrl: (path) => { 
          return { 
            data: { publicUrl: `https://placeholder-image.com/${path}` },
            error: null
          };
        },
        remove: (paths) => {
          logger.info(`[FALLBACK] Supabase remove çağrıldı: ${paths}`);
          return { data: { path: paths }, error: null };
        }
      })
    },
    from: (table) => ({
      select: (columns) => ({ 
        eq: (field, value) => ({
          single: () => {
            logger.info(`[FALLBACK] Supabase sorgusu çağrıldı: ${table}.${field}=${value}`);
            return Promise.resolve({ data: null, error: null });
          },
          order: () => ({
            range: () => {
              logger.info(`[FALLBACK] Supabase sorgusu çağrıldı: ${table}.${field}=${value}`);
              return Promise.resolve({ data: [], error: null });
            }
          })
        })
      }),
      insert: (data) => {
        logger.info(`[FALLBACK] Supabase insert çağrıldı: ${table}`);
        return Promise.resolve({ data, error: null });
      },
      update: (data) => ({
        eq: (field, value) => {
          logger.info(`[FALLBACK] Supabase update çağrıldı: ${table}.${field}=${value}`);
          return Promise.resolve({ data, error: null });
        }
      }),
      delete: () => ({
        eq: (field, value) => {
          logger.info(`[FALLBACK] Supabase delete çağrıldı: ${table}.${field}=${value}`);
          return Promise.resolve({ data: null, error: null });
        }
      })
    }),
    auth: {
      signUp: () => Promise.resolve({ data: null, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null })
    }
  };
};

/**
 * MongoDB için basit bir bellek içi veritabanı fallback'i
 * MongoDB bağlantısı olmadığında basit işlemler için kullanılabilir
 */
const createMongoDBFallback = () => {
  logger.warn('MongoDB fallback veritabanı kullanılıyor');
  
  // Basit bellek içi veritabanı
  const collections = {};
  
  return {
    collection: (name) => {
      if (!collections[name]) {
        collections[name] = [];
      }
      
      return {
        insertOne: (doc) => {
          const _id = Math.random().toString(36).substring(2, 15);
          const newDoc = { ...doc, _id };
          collections[name].push(newDoc);
          return Promise.resolve({ insertedId: _id });
        },
        
        find: (query = {}) => {
          const results = collections[name].filter(item => {
            // Basit bir query eşleştirme
            return Object.keys(query).every(key => {
              if (typeof query[key] === 'object' && query[key].$in) {
                return query[key].$in.includes(item[key]);
              }
              return item[key] === query[key];
            });
          });
          
          return {
            toArray: () => Promise.resolve(results),
            sort: () => ({ limit: () => ({ toArray: () => Promise.resolve(results.slice(0, 10)) }) })
          };
        },
        
        findOne: (query) => {
          const result = collections[name].find(item => {
            return Object.keys(query).every(key => item[key] === query[key]);
          });
          return Promise.resolve(result || null);
        },
        
        updateOne: (query, update) => {
          const index = collections[name].findIndex(item => {
            return Object.keys(query).every(key => item[key] === query[key]);
          });
          
          if (index !== -1) {
            if (update.$set) {
              collections[name][index] = { ...collections[name][index], ...update.$set };
            }
            return Promise.resolve({ modifiedCount: 1 });
          }
          return Promise.resolve({ modifiedCount: 0 });
        },
        
        deleteOne: (query) => {
          const initialLength = collections[name].length;
          collections[name] = collections[name].filter(item => {
            return !Object.keys(query).every(key => item[key] === query[key]);
          });
          return Promise.resolve({ deletedCount: initialLength - collections[name].length });
        }
      };
    }
  };
};

/**
 * Stripe için fallback API
 */
const createStripeFallback = () => {
  logger.warn('Stripe fallback API kullanılıyor');
  
  return {
    customers: {
      create: (data) => Promise.resolve({ id: `cus_${Math.random().toString(36).substring(2, 10)}`, ...data }),
      retrieve: (id) => Promise.resolve({ id, name: 'Test Customer', email: 'test@example.com' })
    },
    paymentIntents: {
      create: (data) => Promise.resolve({ 
        id: `pi_${Math.random().toString(36).substring(2, 10)}`, 
        amount: data.amount,
        currency: data.currency,
        status: 'requires_payment_method',
        client_secret: `pi_secret_${Math.random().toString(36).substring(2, 15)}`
      }),
      retrieve: (id) => Promise.resolve({ id, status: 'succeeded' }),
      update: (id, data) => Promise.resolve({ id, ...data })
    },
    checkout: {
      sessions: {
        create: (data) => Promise.resolve({
          id: `cs_${Math.random().toString(36).substring(2, 10)}`,
          url: 'https://checkout.stripe.com/test-payment',
          payment_status: 'unpaid'
        })
      }
    },
    webhooks: {
      constructEvent: (body, signature, secret) => {
        return { type: 'test_event', data: { object: JSON.parse(body) } };
      }
    }
  };
};

module.exports = {
  createSupabaseFallback,
  createMongoDBFallback,
  createStripeFallback
};