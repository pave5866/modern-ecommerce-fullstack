const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');

// Kullanıcı kaydı
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Supabase Auth ile kayıt
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'user'
        }
      }
    });

    if (authError) {
      logger.error(`Supabase kayıt hatası: ${authError.message}`);
      return res.status(400).json({
        success: false,
        message: authError.message
      });
    }

    // Supabase'e kullanıcı profili ekle
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([
        { 
          id: authData.user.id,
          name, 
          email,
          role: 'user',
          created_at: new Date().toISOString()
        }
      ]);

    if (profileError) {
      logger.error(`Supabase profil oluşturma hatası: ${profileError.message}`);
      // Profil oluşturulamadı, kayıt olan kullanıcıyı sil
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return res.status(500).json({
        success: false,
        message: 'Kullanıcı profili oluşturulamadı'
      });
    }

    logger.info(`Yeni kullanıcı oluşturuldu: ${email} (ID: ${authData.user.id})`);
    
    // JWT token oluştur
    const token = jwt.sign(
      { id: authData.user.id, email: authData.user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: authData.user.id,
        name,
        email,
        role: 'user'
      }
    });
  } catch (error) {
    logger.error(`Kayıt işleminde hata: ${error.message}`);
    next(error);
  }
};

// Kullanıcı girişi
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // E-posta ve şifre kontrolü
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen e-posta ve şifrenizi giriniz'
      });
    }

    // Supabase Auth ile giriş
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.warn(`Başarısız giriş denemesi: ${email}, hata: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Geçersiz giriş bilgileri'
      });
    }

    // Kullanıcı profil bilgilerini getir
    const { data: user, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      logger.error(`Kullanıcı profili getirme hatası: ${profileError.message}`);
      return res.status(500).json({
        success: false,
        message: 'Kullanıcı profili alınamadı'
      });
    }

    // Son giriş tarihini güncelle
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    logger.info(`Kullanıcı giriş yaptı: ${email} (ID: ${data.user.id})`);

    // JWT token oluştur
    const token = jwt.sign(
      { id: data.user.id, email: data.user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: data.user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(`Giriş işleminde hata: ${error.message}`);
    next(error);
  }
};

// Kullanıcı çıkışı
exports.logout = async (req, res, next) => {
  try {
    // Supabase oturumunu sonlandır
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error(`Çıkış hatası: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Çıkış işlemi başarısız oldu'
      });
    }

    // Cookie'yi temizle
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    logger.info('Kullanıcı çıkış yaptı');
    res.status(200).json({
      success: true,
      message: 'Çıkış başarılı'
    });
  } catch (error) {
    logger.error(`Çıkış işleminde hata: ${error.message}`);
    next(error);
  }
};

// Mevcut kullanıcı bilgisini getir
exports.getMe = async (req, res, next) => {
  try {
    // Kullanıcı bilgisi auth middleware tarafından req.user içine yerleştirildi
    logger.info(`Kullanıcı bilgisi alındı: ${req.user.email}`);
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    logger.error(`Kullanıcı bilgisi alınırken hata: ${error.message}`);
    next(error);
  }
};

// Token yenileme
exports.refreshToken = async (req, res, next) => {
  try {
    // Mevcut oturumu kontrol et
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return res.status(401).json({
        success: false,
        message: 'Geçerli oturum bulunamadı'
      });
    }

    // Yeni JWT token oluştur
    const token = jwt.sign(
      { 
        id: data.session.user.id, 
        email: data.session.user.email,
        role: data.session.user.user_metadata.role || 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
        name: data.session.user.user_metadata.name,
        role: data.session.user.user_metadata.role || 'user'
      }
    });
  } catch (error) {
    logger.error(`Token yenileme hatası: ${error.message}`);
    next(error);
  }
};

// Şifre sıfırlama isteği
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen e-posta adresinizi giriniz'
      });
    }

    // Supabase ile şifre sıfırlama e-postası gönder
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.PASSWORD_RESET_URL
    });

    if (error) {
      logger.error(`Şifre sıfırlama hatası: ${error.message}`);
      // Kullanıcıya hata vermemek için başarılı gibi göster
    }

    logger.info(`Şifre sıfırlama e-postası gönderildi: ${email}`);
    res.status(200).json({
      success: true,
      message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi (eğer hesap mevcutsa)'
    });
  } catch (error) {
    logger.error(`Şifre sıfırlama işleminde hata: ${error.message}`);
    next(error);
  }
};

// Şifre sıfırlama
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz şifre sıfırlama isteği'
      });
    }

    // Supabase ile şifre güncelle
    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      logger.error(`Şifre sıfırlama hatası: ${error.message}`);
      return res.status(400).json({
        success: false,
        message: 'Şifre sıfırlama başarısız oldu'
      });
    }

    logger.info('Şifre başarıyla sıfırlandı');
    res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla sıfırlandı'
    });
  } catch (error) {
    logger.error(`Şifre sıfırlama işleminde hata: ${error.message}`);
    next(error);
  }
};

// Şifre güncelleme
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Şifre güncelleme
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      logger.error(`Şifre güncelleme hatası: ${error.message}`);
      return res.status(400).json({
        success: false,
        message: 'Şifre güncelleme başarısız oldu'
      });
    }

    logger.info(`Kullanıcı şifresini güncelledi: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi'
    });
  } catch (error) {
    logger.error(`Şifre güncelleme işleminde hata: ${error.message}`);
    next(error);
  }
};

// E-posta güncelleme
exports.updateEmail = async (req, res, next) => {
  try {
    const { newEmail, password } = req.body;

    // E-posta güncelleme
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    });

    if (error) {
      logger.error(`E-posta güncelleme hatası: ${error.message}`);
      return res.status(400).json({
        success: false,
        message: 'E-posta güncelleme başarısız oldu'
      });
    }

    // Profil tablosunda da güncelle
    await supabase
      .from('users')
      .update({ email: newEmail })
      .eq('id', req.user.id);

    logger.info(`Kullanıcı e-postasını güncelledi: ${req.user.email} -> ${newEmail}`);
    res.status(200).json({
      success: true,
      message: 'E-posta adresiniz başarıyla güncellendi, lütfen yeni e-postanızı doğrulayın'
    });
  } catch (error) {
    logger.error(`E-posta güncelleme işleminde hata: ${error.message}`);
    next(error);
  }
};

// Hesap silme
exports.deleteAccount = async (req, res, next) => {
  try {
    // Supabase Auth ile kullanıcıyı sil
    const { error } = await supabase.auth.admin.deleteUser(req.user.id);

    if (error) {
      logger.error(`Kullanıcı silme hatası: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Hesap silme işlemi başarısız oldu'
      });
    }

    // Profil tablosundan da sil (cascade delete yapılmışsa gerekli olmayabilir)
    await supabase
      .from('users')
      .delete()
      .eq('id', req.user.id);

    logger.info(`Kullanıcı hesabı silindi: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Hesabınız başarıyla silindi'
    });
  } catch (error) {
    logger.error(`Hesap silme işleminde hata: ${error.message}`);
    next(error);
  }
};