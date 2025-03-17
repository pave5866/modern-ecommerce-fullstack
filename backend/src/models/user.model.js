const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Schema = mongoose.Schema;

// Kullanıcı şeması
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'İsim alanı zorunludur'],
      trim: true,
      maxlength: [50, 'İsim 50 karakterden uzun olamaz']
    },
    email: {
      type: String,
      required: [true, 'E-posta alanı zorunludur'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Lütfen geçerli bir e-posta adresi girin']
    },
    password: {
      type: String,
      required: [true, 'Şifre alanı zorunludur'],
      minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
      select: false // Varsayılan olarak şifreyi sorgu sonuçlarında gösterme
    },
    role: {
      type: String,
      enum: ['user', 'seller', 'admin'],
      default: 'user'
    },
    avatar: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/v1/sample'
    },
    phone: String,
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: Date,
    addresses: [
      {
        title: {
          type: String,
          required: true
        },
        fullName: {
          type: String,
          required: true
        },
        address: {
          type: String,
          required: true
        },
        city: {
          type: String,
          required: true
        },
        state: String,
        postalCode: {
          type: String,
          required: true
        },
        country: {
          type: String,
          required: true
        },
        phone: {
          type: String,
          required: true
        },
        isDefault: {
          type: Boolean,
          default: false
        }
      }
    ],
    newsletters: {
      type: Boolean,
      default: false
    },
    birthday: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', '']
    },
    passwordChangedAt: Date
  },
  { 
    timestamps: true 
  }
);

// İndeksler
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Şifreyi hashleme (kaydetmeden önce)
userSchema.pre('save', async function(next) {
  // Şifre değişmediyse hash işlemi yapma
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Şifre değiştirildiyse tarih güncelle
    if (this.isModified('password')) {
      this.passwordChangedAt = Date.now() - 1000;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Şifre karşılaştırma metodu
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Email doğrulama token'ı oluştur
userSchema.methods.generateEmailVerificationToken = function() {
  // Rastgele token oluştur
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  // Token'ı hashleme
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Token'ın geçerlilik süresini 1 saat olarak ayarla
  this.emailVerificationExpire = Date.now() + 60 * 60 * 1000;
  
  return verificationToken;
};

// Şifre sıfırlama token'ı oluştur
userSchema.methods.generateResetPasswordToken = function() {
  // Rastgele token oluştur
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Token'ı hashleme
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Token'ın geçerlilik süresini 1 saat olarak ayarla
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  
  return resetToken;
};

// JWT token'ının verildiği tarihten sonra şifre değiştirildi mi kontrol et
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    
    return JWTTimestamp < changedTimestamp;
  }
  
  // False döndür, şifre değiştirilmemiş
  return false;
};

// Modeli oluştur
const User = mongoose.model('User', userSchema);

module.exports = User;