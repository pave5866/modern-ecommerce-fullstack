const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Kullanıcı şeması
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lütfen isminizi giriniz'],
    trim: true,
    maxlength: [50, 'İsim 50 karakterden uzun olamaz']
  },
  email: {
    type: String,
    required: [true, 'Lütfen e-posta adresinizi giriniz'],
    unique: true,
    lowercase: true,
    match: [
      /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
      'Lütfen geçerli bir e-posta adresi giriniz'
    ]
  },
  password: {
    type: String,
    required: [true, 'Lütfen şifrenizi giriniz'],
    minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
    select: false // Sorgu sonuçlarında şifreyi gösterme
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  avatarUrl: String,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Şifreyi hashle
userSchema.pre('save', async function(next) {
  // Şifre değişmediyse yeniden hashleme
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Bcrypt ile şifreyi hashle (10 round)
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// JWT Token oluşturma metodu
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Kullanıcı şifre kontrolü
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Şifre sıfırlama tokeni oluşturma
userSchema.methods.generateResetPasswordToken = function() {
  // Rastgele bir token oluştur
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Token'ı hashle ve kullanıcıya kaydet
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token'ın son kullanım tarihi (10 dakika)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// E-posta doğrulama tokeni oluşturma
userSchema.methods.generateEmailVerificationToken = function() {
  // Rastgele bir token oluştur
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Token'ı hashle ve kullanıcıya kaydet
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Token'ın son kullanım tarihi (24 saat)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

// Virtual field - Kullanıcının siparişleri
userSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

// Virtual field - Kullanıcının adresleri
userSchema.virtual('addresses', {
  ref: 'Address',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

// Kullanıcıyı güncellerken 'updatedAt' alanını güncelle
userSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
});

// Aktif olmayan kullanıcıları sorgularda gösterme
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = { User, userSchema };