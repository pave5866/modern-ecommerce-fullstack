import { createClient } from '@supabase/supabase-js';

// Supabase proje bilgileri
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL veya Anahtar bulunamadı. .env dosyasını kontrol edin.');
}

// Supabase istemcisini oluştur
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}); 