import { supabase } from '../../lib/supabase';
import logger from '../../utils/logger';
import { getUserProfile } from '../profile';

/**
 * Kullanıcı kaydı için fonksiyon
 * @param {string} email - Kullanıcı e-postası 
 * @param {string} password - Kullanıcı şifresi
 * @param {object} userData - İsim gibi ek kullanıcı bilgileri
 */
export const registerUser = async (email, password, userData) => {
  try {
    logger.info('Yeni kullanıcı kaydı oluşturuluyor', { email });

    // Kullanıcı oluştur
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.name,
        },
      },
    });

    if (error) {
      logger.error('Kayıt hatası', { error: error.message });
      return { success: false, error: error.message };
    }

    // Profil oluştur (Supabase trigger ile otomatik olarak oluşturulacak)
    logger.info('Kayıt başarılı, e-posta doğrulaması bekleniyor', { userId: data.user.id });
    return { success: true, data: data.user, emailConfirmation: true };
  } catch (error) {
    logger.error('Kayıt işleminde beklenmeyen hata', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Kayıt olurken bir hata oluştu' 
    };
  }
};

/**
 * E-posta ve şifre ile giriş yapma
 * @param {string} email - Kullanıcı e-postası
 * @param {string} password - Kullanıcı şifresi
 */
export const loginWithEmail = async (email, password) => {
  try {
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
    return { success: true, data: data.user };
  } catch (error) {
    logger.error('Giriş işleminde beklenmeyen hata', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Giriş yaparken bir hata oluştu' 
    };
  }
};

/**
 * Google ile giriş yapma
 */
export const loginWithGoogle = async () => {
  try {
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
    return { 
      success: false, 
      error: error.message || 'Google ile giriş yaparken bir hata oluştu' 
    };
  }
};

/**
 * Kullanıcı çıkışı
 */
export const logout = async () => {
  try {
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
    return { 
      success: false, 
      error: error.message || 'Çıkış yaparken bir hata oluştu' 
    };
  }
};

/**
 * Mevcut oturum bilgisini alma
 */
export const getCurrentSession = async () => {
  try {
    logger.info('Mevcut oturum kontrol ediliyor');

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      logger.error('Oturum kontrol hatası', { error: error.message });
      return { success: false, error: error.message };
    }

    if (!data.session) {
      logger.info('Aktif oturum bulunamadı');
      return { success: true, session: null, user: null };
    }

    logger.info('Aktif oturum bulundu', { userId: data.session.user.id });
    return { 
      success: true, 
      session: data.session, 
      user: data.session.user 
    };
  } catch (error) {
    logger.error('Oturum kontrol işleminde beklenmeyen hata', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Oturum kontrolü sırasında bir hata oluştu' 
    };
  }
};

/**
 * Mevcut kullanıcı bilgisini alma
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      logger.error('Kullanıcı bilgisi alınamadı', { error: error.message });
      return { success: false, error: error.message };
    }

    logger.info('Kullanıcı bilgisi alındı', { userId: data.user?.id });
    return { success: true, data: data.user };
  } catch (error) {
    logger.error('Kullanıcı bilgisi alma hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Kullanıcı bilgisi alınırken bir hata oluştu' 
    };
  }
};

/**
 * Şifre sıfırlama e-postası gönderme
 * @param {string} email - Kullanıcı e-postası
 */
export const sendPasswordResetEmail = async (email) => {
  try {
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
    return { 
      success: false, 
      error: error.message || 'Şifre sıfırlama e-postası gönderilirken bir hata oluştu' 
    };
  }
};

/**
 * Şifre güncelleme işlemi
 * @param {string} newPassword - Yeni şifre
 */
export const updatePassword = async (newPassword) => {
  try {
    logger.info('Şifre güncelleniyor');

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      logger.error('Şifre güncelleme hatası', { error: error.message });
      return { success: false, error: error.message };
    }

    logger.info('Şifre başarıyla güncellendi');
    return { success: true, data: data.user };
  } catch (error) {
    logger.error('Şifre güncelleme işleminde beklenmeyen hata', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Şifre güncellenirken bir hata oluştu' 
    };
  }
};

/**
 * Kullanıcı profil bilgilerini güncelleme
 * @param {object} userData - Güncellenecek kullanıcı bilgileri
 */
export const updateUserProfile = async (userData) => {
  try {
    logger.info('Kullanıcı profili güncelleniyor');

    // Supabase auth üzerinde güncellenebilecek bilgiler
    if (userData.email) {
      const { error } = await supabase.auth.updateUser({
        email: userData.email,
      });

      if (error) {
        logger.error('Email güncelleme hatası', { error: error.message });
        return { success: false, error: error.message };
      }
    }

    // Profiles tablosundaki profil bilgilerini güncelle
    const { data: userSession } = await supabase.auth.getSession();
    const userId = userSession?.session?.user?.id;

    if (!userId) {
      return { 
        success: false, 
        error: 'Oturum bulunamadı, lütfen tekrar giriş yapın' 
      };
    }

    // Profil servisini kullanarak profil bilgilerini güncelle
    const { success, data, error } = await getUserProfile(userId);
    
    if (!success) {
      return { success: false, error };
    }

    // Güncel kullanıcı bilgilerini döndür
    logger.info('Kullanıcı profili başarıyla güncellendi', { userId });
    return { success: true, data };
  } catch (error) {
    logger.error('Profil güncelleme işleminde beklenmeyen hata', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Profil güncellenirken bir hata oluştu' 
    };
  }
}; 