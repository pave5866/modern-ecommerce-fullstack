import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';
import { getUserProfile } from '../services/profile';

// Context oluştur
const AuthContext = createContext(null);

// Provider bileşeni
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // İlk yüklemede ve auth durumu değişikliklerinde session kontrolü
  useEffect(() => {
    const fetchSessionAndUser = async () => {
      try {
        // Mevcut oturumu al
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        
        if (currentSession) {
          setUser(currentSession.user);
          
          // Kullanıcı profilini getir
          const { success, data } = await getUserProfile(currentSession.user.id);
          if (success && data) {
            setProfile(data);
          }
        }
      } catch (error) {
        logger.error('Auth oturumu alınırken hata oluştu', { error: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndUser();

    // Auth değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      logger.info('Auth durumu değişti', { event });
      
      setSession(currentSession);
      
      if (currentSession) {
        setUser(currentSession.user);
        
        // Kullanıcı profilini getir
        if (event === 'SIGNED_IN') {
          const { success, data } = await getUserProfile(currentSession.user.id);
          if (success && data) {
            setProfile(data);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      
      setLoading(false);
    });

    // Temizlik fonksiyonu
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Email ve şifre ile giriş
  const signInWithEmail = async (email, password) => {
    try {
      setLoading(true);
      logger.info('Email ile giriş yapılıyor', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error('Giriş hatası', { error: error.message });
        return { success: false, error: error.message };
      }

      logger.info('Giriş başarılı', { userId: data.user.id });
      return { success: true };
    } catch (error) {
      logger.error('Giriş işleminde beklenmeyen hata', { error: error.message });
      return { success: false, error: error.message || 'Giriş yaparken bir hata oluştu' };
    } finally {
      setLoading(false);
    }
  };

  // Google ile giriş
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      logger.info('Google ile giriş başlatılıyor');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logger.error('Google giriş hatası', { error: error.message });
        return { success: false, error: error.message };
      }

      // Redirect sonrası otomatik olarak session güncellenecek
      return { success: true };
    } catch (error) {
      logger.error('Google giriş işleminde beklenmeyen hata', { error: error.message });
      return { success: false, error: error.message || 'Google ile giriş yaparken bir hata oluştu' };
    } finally {
      setLoading(false);
    }
  };

  // Kayıt olma
  const signUp = async (email, password, name) => {
    try {
      setLoading(true);
      logger.info('Yeni kullanıcı kaydı oluşturuluyor', { email });
      
      // Kullanıcı oluştur
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        logger.error('Kayıt hatası', { error: error.message });
        return { success: false, error: error.message };
      }

      logger.info('Kayıt başarılı, e-posta doğrulaması bekleniyor', { userId: data.user.id });
      return { success: true, emailConfirmation: true };
    } catch (error) {
      logger.error('Kayıt işleminde beklenmeyen hata', { error: error.message });
      return { success: false, error: error.message || 'Kayıt olurken bir hata oluştu' };
    } finally {
      setLoading(false);
    }
  };

  // Şifre sıfırlama
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      logger.info('Şifre sıfırlama e-postası gönderiliyor', { email });
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        logger.error('Şifre sıfırlama hatası', { error: error.message });
        return { success: false, error: error.message };
      }

      logger.info('Şifre sıfırlama e-postası gönderildi', { email });
      return { success: true };
    } catch (error) {
      logger.error('Şifre sıfırlama işleminde beklenmeyen hata', { error: error.message });
      return { success: false, error: error.message || 'Şifre sıfırlama e-postası gönderilirken bir hata oluştu' };
    } finally {
      setLoading(false);
    }
  };

  // Şifre değiştirme (resetleme sonrası)
  const updatePassword = async (newPassword) => {
    try {
      setLoading(true);
      logger.info('Şifre güncelleniyor');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        logger.error('Şifre güncelleme hatası', { error: error.message });
        return { success: false, error: error.message };
      }

      logger.info('Şifre başarıyla güncellendi');
      return { success: true };
    } catch (error) {
      logger.error('Şifre güncelleme işleminde beklenmeyen hata', { error: error.message });
      return { success: false, error: error.message || 'Şifre güncellenirken bir hata oluştu' };
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yapma
  const signOut = async () => {
    try {
      setLoading(true);
      logger.info('Çıkış yapılıyor');
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Çıkış hatası', { error: error.message });
        return { success: false, error: error.message };
      }

      logger.info('Çıkış başarılı');
      return { success: true };
    } catch (error) {
      logger.error('Çıkış işleminde beklenmeyen hata', { error: error.message });
      return { success: false, error: error.message || 'Çıkış yaparken bir hata oluştu' };
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı profilini güncelleme
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      logger.info('Profil güncelleniyor', { userId: user?.id });
      
      // Profil servisi üzerinden profil güncellenir
      const result = await updateUserProfile(user?.id, profileData);
      
      if (!result.success) {
        return result;
      }
      
      // Context'teki profil bilgisini güncelle
      setProfile((prev) => ({
        ...prev,
        ...profileData,
      }));
      
      return result;
    } catch (error) {
      logger.error('Profil güncelleme işleminde beklenmeyen hata', { error: error.message });
      return { success: false, error: error.message || 'Profil güncellenirken bir hata oluştu' };
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      logger.info('Profil yenileniyor', { userId: user.id });
      
      const { success, data } = await getUserProfile(user.id);
      
      if (success && data) {
        setProfile(data);
        logger.info('Profil başarıyla yenilendi');
      }
    } catch (error) {
      logger.error('Profil yenileme hatası', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Context değeri
  const value = {
    session,
    user,
    profile,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Auth context kullanımı için hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 