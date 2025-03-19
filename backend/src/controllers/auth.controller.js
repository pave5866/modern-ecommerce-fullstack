const { User } = require('../models/user.model');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');

// Kullanıcı kaydı
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // MongoDB'ye bağlı değilsek Supabase ile çalışalım
    const { connectDB, checkConnection } = require('../db/mongodb');
    await connectDB();
    
    if (!checkConnection()) {
      // MongoDB bağlantısı yoksa Supabase kullan
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role: 'user'
            }
          }
        });

        if (error) {
          logger.error(`Supabase kayıt hatası: ${error.message}`);
          return res.status(400).json({
            success: false,
            message: error.message
          });
        }

        logger.info(`Yeni kullanıcı Supabase ile oluşturuldu: ${email}`);
        return res.status(201).json({
          success: true,
          message: 'Kullanıcı kaydı başarılı',
          data: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata.name
          }
        });
      } catch (supabaseError) {
        logger.error(`Supabase kayıt işleminde hata: ${supabaseError.message}`);
        return res.status(500).json({
          success: false,
          message: 'Kayıt işlemi başarısız oldu'
        });
      }
    }

    // E-posta adresi ile kullanıcı kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Kayıt denemesi - E-posta adresi zaten kullanımda: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Bu e-posta adresi ile kayıtlı bir kullanıcı zaten var'
      });
    }

    // Yeni kullanıcı oluştur
    const user = await User.create({
      name,
      email,
      password
    });

    logger.info(`Yeni kullanıcı oluşturuldu: ${user.email} (ID: ${user._id})`);
    sendTokenResponse(user, 201, res);
  } catch (error) {
    logger.error(`Kayıt işleminde hata: ${error.message}`);
    next(error);
  }
};

// Kullanıcı girişi
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // MongoDB'ye bağlı değilsek Supabase ile çalışalım
    const { connectDB, checkConnection } = require('../db/mongodb');
    await connectDB();
    
    if (!checkConnection()) {
      // MongoDB bağlantısı yoksa Supabase kullan
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          logger.error(`Supabase giriş hatası: ${error.message}`);
          return res.status(401).json({
            success: false,
            message: 'Geçersiz giriş bilgileri'
          });
        }

        logger.info(`Kullanıcı Supabase ile giriş yaptı: ${email}`);
        return res.status(200).json({
          success: true,
          message: 'Giriş başarılı',
          data: {
            token: data.session.access_token,
            user: {
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata.name,
              role: data.user.user_metadata.role || 'user'
            }
          }
        });
      } catch (supabaseError) {
        logger.error(`Supabase giriş işleminde hata: ${supabaseError.message}`);
        return res.status(500).json({
          success: false,
          message: 'Giriş işlemi başarısız oldu'
        });
      }
    }

    // E-posta ve şifre kontrolü
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen e-posta ve şifrenizi giriniz'
      });
    }

    // Kullanıcıyı e-posta ile bul ve şifreyi dahil et
    const user = await User.findOne({ email }).select('+password');

    // Kullanıcı bulunamadıysa
    if (!user) {
      logger.warn(`Başarısız giriş denemesi - Kullanıcı bulunamadı: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Geçersiz giriş bilgileri'
      });
    }

    // Şifre eşleşiyor mu?
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      logger.warn(`Başarısız giriş denemesi - Yanlış şifre: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Geçersiz giriş bilgileri'
      });
    }

    // Son giriş tarihini güncelle
    user.lastLogin = Date.now();
    await user.save();

    logger.info(`Kullanıcı giriş yaptı: ${user.email} (ID: ${user._id})`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error(`Giriş işleminde hata: ${error.message}`);
    next(error);
  }
};

// Kullanıcı çıkışı
exports.logout = (req, res) => {
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
  // Bu fonksiyon için token yenileme mantığını ekleyin
  res.status(200).json({
    success: true,
    message: 'Token yenilendi',
    data: {}
  });
};

// Şifre sıfırlama isteği
exports.forgotPassword = async (req, res, next) => {
  // Bu fonksiyon için şifre sıfırlama mantığını ekleyin
  res.status(200).json({
    success: true,
    message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi',
    data: {}
  });
};

// Şifre sıfırlama
exports.resetPassword = async (req, res, next) => {
  // Bu fonksiyon için şifre sıfırlama mantığını ekleyin
  res.status(200).json({
    success: true,
    message: 'Şifreniz başarıyla sıfırlandı',
    data: {}
  });
};

// Şifre güncelleme
exports.updatePassword = async (req, res, next) => {
  // Bu fonksiyon için şifre güncelleme mantığını ekleyin
  res.status(200).json({
    success: true,
    message: 'Şifreniz başarıyla güncellendi',
    data: {}
  });
};

// E-posta güncelleme
exports.updateEmail = async (req, res, next) => {
  // Bu fonksiyon için e-posta güncelleme mantığını ekleyin
  res.status(200).json({
    success: true,
    message: 'E-posta adresiniz başarıyla güncellendi',
    data: {}
  });
};

// Hesap silme
exports.deleteAccount = async (req, res, next) => {
  // Bu fonksiyon için hesap silme mantığını ekleyin
  res.status(200).json({
    success: true,
    message: 'Hesabınız başarıyla silindi',
    data: {}
  });
};

// Token oluşturma ve yanıt gönderme
const sendTokenResponse = (user, statusCode, res) => {
  // JWT token oluştur
  const token = user.generateAuthToken();

  // Cookie seçenekleri
  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // HTTPS ise secure seçeneğini ekle
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Token'ı cookie olarak gönder
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
};