import { supabase } from '../../lib/supabase';
import logger from '../../utils/logger';

/**
 * Kullanıcı profil bilgilerini alma
 * @param {string} userId - Kullanıcı ID'si (belirtilmezse mevcut oturum açmış kullanıcı)
 */
export const getUserProfile = async (userId) => {
  try {
    // ID belirtilmemişse mevcut kullanıcıyı kontrol et
    if (!userId) {
      const { data: authData } = await supabase.auth.getUser();
      userId = authData?.user?.id;
      
      if (!userId) {
        return { 
          success: false, 
          error: 'Oturum açmış kullanıcı bulunamadı' 
        };
      }
    }
    
    logger.info('Kullanıcı profili getiriliyor', { userId });
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      logger.error('Profil bilgisi getirilemedi', { error: error.message, userId });
      return { success: false, error: error.message };
    }
    
    logger.info('Profil bilgisi başarıyla getirildi', { userId });
    return { success: true, data };
  } catch (error) {
    logger.error('Profil bilgisi getirme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Profil bilgisi getirilirken bir hata oluştu'
    };
  }
};

/**
 * Kullanıcı profil bilgilerini güncelleme
 * @param {string} userId - Kullanıcı ID'si (belirtilmezse mevcut oturum açmış kullanıcı)
 * @param {object} profileData - Güncellenecek profil bilgileri
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    // ID belirtilmemişse mevcut kullanıcıyı kontrol et
    if (!userId) {
      const { data: authData } = await supabase.auth.getUser();
      userId = authData?.user?.id;
      
      if (!userId) {
        return { 
          success: false, 
          error: 'Oturum açmış kullanıcı bulunamadı' 
        };
      }
    }
    
    logger.info('Kullanıcı profili güncelleniyor', { userId });
    
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      logger.error('Profil bilgisi güncellenemedi', { error: error.message, userId });
      return { success: false, error: error.message };
    }
    
    // E-posta değişikliklerini auth servisine de uygula
    if (profileData.email) {
      const { error: authError } = await supabase.auth.updateUser({
        email: profileData.email
      });
      
      if (authError) {
        logger.warn('Auth e-posta güncellenemedi', { error: authError.message });
      }
    }
    
    logger.info('Profil bilgisi başarıyla güncellendi', { userId });
    return { success: true, data };
  } catch (error) {
    logger.error('Profil bilgisi güncelleme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Profil bilgisi güncellenirken bir hata oluştu'
    };
  }
};

/**
 * Kullanıcının adreslerini getirme
 * @param {string} userId - Kullanıcı ID'si (belirtilmezse mevcut oturum açmış kullanıcı)
 */
export const getUserAddresses = async (userId) => {
  try {
    // ID belirtilmemişse mevcut kullanıcıyı kontrol et
    if (!userId) {
      const { data: authData } = await supabase.auth.getUser();
      userId = authData?.user?.id;
      
      if (!userId) {
        return { 
          success: false, 
          error: 'Oturum açmış kullanıcı bulunamadı' 
        };
      }
    }
    
    logger.info('Kullanıcı adresleri getiriliyor', { userId });
    
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });
    
    if (error) {
      logger.error('Adresler getirilemedi', { error: error.message, userId });
      return { success: false, error: error.message };
    }
    
    logger.info(`${data.length} adet adres başarıyla getirildi`, { userId });
    return { success: true, data };
  } catch (error) {
    logger.error('Adresler getirme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Adresler getirilirken bir hata oluştu'
    };
  }
};

/**
 * Yeni adres ekleme
 * @param {object} addressData - Eklenecek adres bilgileri
 */
export const addAddress = async (addressData) => {
  try {
    // Kullanıcı ID kontrol et
    if (!addressData.user_id) {
      const { data: authData } = await supabase.auth.getUser();
      addressData.user_id = authData?.user?.id;
      
      if (!addressData.user_id) {
        return { 
          success: false, 
          error: 'Oturum açmış kullanıcı bulunamadı' 
        };
      }
    }
    
    logger.info('Yeni adres ekleniyor', { userId: addressData.user_id });
    
    // Eğer yeni adres varsayılan ise, diğer varsayılanları kaldır
    if (addressData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', addressData.user_id);
    }
    
    const { data, error } = await supabase
      .from('addresses')
      .insert(addressData)
      .select()
      .single();
    
    if (error) {
      logger.error('Adres eklenemedi', { error: error.message });
      return { success: false, error: error.message };
    }
    
    logger.info('Adres başarıyla eklendi', { addressId: data.id });
    return { success: true, data };
  } catch (error) {
    logger.error('Adres ekleme hatası', { error: error.message });
    return { 
      success: false, 
      error: error.message || 'Adres eklenirken bir hata oluştu'
    };
  }
};

/**
 * Adres güncelleme
 * @param {string} id - Adres ID
 * @param {object} addressData - Güncellenecek adres bilgileri
 */
export const updateAddress = async (id, addressData) => {
  try {
    logger.info('Adres güncelleniyor', { id });
    
    // Eğer adres varsayılan yapılıyorsa, diğer varsayılanları kaldır
    if (addressData.is_default) {
      // Önce mevcut adresin kullanıcı ID'sini al
      const { data: currentAddress } = await supabase
        .from('addresses')
        .select('user_id')
        .eq('id', id)
        .single();
      
      if (currentAddress) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', currentAddress.user_id)
          .neq('id', id);
      }
    }
    
    const { data, error } = await supabase
      .from('addresses')
      .update(addressData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Adres güncellenemedi', { error: error.message, id });
      return { success: false, error: error.message };
    }
    
    logger.info('Adres başarıyla güncellendi', { id });
    return { success: true, data };
  } catch (error) {
    logger.error('Adres güncelleme hatası', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Adres güncellenirken bir hata oluştu'
    };
  }
};

/**
 * Adres silme
 * @param {string} id - Adres ID
 */
export const deleteAddress = async (id) => {
  try {
    logger.info('Adres siliniyor', { id });
    
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Adres silinemedi', { error: error.message, id });
      return { success: false, error: error.message };
    }
    
    logger.info('Adres başarıyla silindi', { id });
    return { success: true };
  } catch (error) {
    logger.error('Adres silme hatası', { error: error.message, id });
    return { 
      success: false, 
      error: error.message || 'Adres silinirken bir hata oluştu'
    };
  }
}; 