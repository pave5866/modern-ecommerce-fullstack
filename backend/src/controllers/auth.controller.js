const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
const createError = require('http-errors');
const logger = require('../utils/logger');

// JWT Token oluşturma
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Token oluştur ve cookie'ye kaydet
const createSendToken = (user, statusCode, req, res) => {
  const token = createToken(user);

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: { user }
  });
};

// Register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    logger.info('Register isteği alındı:', { email });

    // Email kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Email zaten kullanımda:', { email });
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kullanımda'
      });
    }

    logger.info('Yeni kullanıcı oluşturuluyor...');
    
    // Yeni kullanıcı oluştur
    const user = await User.create({
      name,
      email,
      password
    });

    logger.info('Kullanıcı başarıyla oluşturuldu:', { userId: user._id });
    
    createSendToken(user, 201, req, res);
  } catch (error) {
    logger.error('Kullanıcı kaydı hatası:', { error: error.message });
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Email ve şifre kontrolü
    if (!email || !password) {
      throw createError(400, 'Lütfen email ve şifre giriniz');
    }

    // Kullanıcı kontrolü ve şifre doğrulama
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      throw createError(401, 'Email veya şifre hatalı');
    }

    // Son giriş tarihini güncelle
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Token oluştur
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        email: user.email 
      }, 
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );

    // Kullanıcı bilgilerini hazırla (password hariç)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin
    };

    // Yanıtı gönder
    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Forgot Password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Get user
    const user = await User.findOne({ email });
    if (!user) {
      throw createError(404, 'Bu email adresine sahip kullanıcı bulunamadı');
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send email
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    
    const message = `
      Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:
      ${resetURL}
      
      Bu link 10 dakika sonra geçersiz olacaktır.
      
      Eğer şifre sıfırlama talebinde bulunmadıysanız, bu emaili görmezden gelin.
    `;

    await sendEmail({
      email: user.email,
      subject: 'Şifre Sıfırlama Talebi (10 dakika geçerli)',
      message
    });

    res.status(200).json({
      success: true,
      message: 'Şifre sıfırlama linki email adresinize gönderildi'
    });
  } catch (error) {
    // If error occurs, reset passwordResetToken fields
    if (error.name !== 'HttpError') {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }
    next(error);
  }
};

// Reset Password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // Check if token is valid and not expired
    if (!user) {
      throw createError(400, 'Token geçersiz veya süresi dolmuş');
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: 'Başarıyla çıkış yapıldı'
  });
};

// Update Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // Email değiştiriliyorsa, yeni email'in başka bir kullanıcı tarafından kullanılmadığından emin ol
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw createError(400, 'Bu email adresi zaten kullanılıyor');
      }
    }

    // Kullanıcıyı güncelle
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Update Password
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Kullanıcıyı bul ve şifresini seç
    const user = await User.findById(req.user._id).select('+password');

    // Mevcut şifreyi kontrol et
    if (!(await user.comparePassword(currentPassword))) {
      throw createError(401, 'Mevcut şifreniz yanlış');
    }

    // Şifreyi güncelle
    user.password = newPassword;
    await user.save();

    createSendToken(user, 200, req, res);
  } catch (error) {
    next(error);
  }
}; 