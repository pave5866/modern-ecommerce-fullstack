const validator = require('validator');
const mongoose = require('mongoose');

/**
 * Geçerli bir ObjectId olup olmadığını kontrol eder
 * @param {string} id - ObjectId olarak kontrol edilecek string
 * @returns {boolean}
 */
exports.isValidObjectId = (id) => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Geçerli bir e-posta adresi olup olmadığını kontrol eder
 * @param {string} email - Kontrol edilecek e-posta adresi
 * @returns {boolean}
 */
exports.isValidEmail = (email) => {
  if (!email) return false;
  return validator.isEmail(email);
};

/**
 * Güçlü bir şifre olup olmadığını kontrol eder
 * @param {string} password - Kontrol edilecek şifre
 * @returns {boolean}
 */
exports.isStrongPassword = (password) => {
  if (!password) return false;
  
  // En az 8 karakter, en az 1 büyük harf, 1 küçük harf, 1 sayı ve 1 özel karakter
  return validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  });
};

/**
 * Geçerli bir URL olup olmadığını kontrol eder
 * @param {string} url - Kontrol edilecek URL
 * @returns {boolean}
 */
exports.isValidUrl = (url) => {
  if (!url) return false;
  return validator.isURL(url);
};

/**
 * Geçerli bir telefon numarası olup olmadığını kontrol eder
 * @param {string} phone - Kontrol edilecek telefon numarası
 * @returns {boolean}
 */
exports.isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  return validator.isMobilePhone(phone);
};

/**
 * Geçerli bir JSON formatı olup olmadığını kontrol eder
 * @param {string} jsonString - Kontrol edilecek JSON string
 * @returns {boolean}
 */
exports.isValidJson = (jsonString) => {
  if (!jsonString) return false;
  
  try {
    JSON.parse(jsonString);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Geçerli bir tarih formatı olup olmadığını kontrol eder
 * @param {string} date - Kontrol edilecek tarih string'i
 * @returns {boolean}
 */
exports.isValidDate = (date) => {
  if (!date) return false;
  return validator.isDate(date);
};

/**
 * Geçerli bir UUID olup olmadığını kontrol eder
 * @param {string} uuid - Kontrol edilecek UUID string'i
 * @returns {boolean}
 */
exports.isValidUUID = (uuid) => {
  if (!uuid) return false;
  return validator.isUUID(uuid);
};

/**
 * Geçerli bir kredi kartı numarası olup olmadığını kontrol eder
 * @param {string} cardNumber - Kontrol edilecek kredi kartı numarası
 * @returns {boolean}
 */
exports.isValidCreditCard = (cardNumber) => {
  if (!cardNumber) return false;
  return validator.isCreditCard(cardNumber);
};

/**
 * Geçerli bir Base64 formatı olup olmadığını kontrol eder
 * @param {string} base64String - Kontrol edilecek Base64 string'i
 * @returns {boolean}
 */
exports.isValidBase64 = (base64String) => {
  if (!base64String) return false;
  
  // Base64 format kontrolü
  // data:image/ ile başlayan base64 formatlarını da kabul eder
  if (base64String.startsWith('data:image/')) {
    const base64Data = base64String.split(',')[1];
    return validator.isBase64(base64Data);
  }
  
  return validator.isBase64(base64String);
};

/**
 * Geçerli bir renk kodu olup olmadığını kontrol eder
 * @param {string} color - Kontrol edilecek renk kodu
 * @returns {boolean}
 */
exports.isValidColor = (color) => {
  if (!color) return false;
  return validator.isHexColor(color);
};

/**
 * Güvenli bir dosya adı olup olmadığını kontrol eder
 * @param {string} filename - Kontrol edilecek dosya adı
 * @returns {boolean}
 */
exports.isSafeFilename = (filename) => {
  if (!filename) return false;
  
  // Dosya adında tehlikeli karakterler olmadığından emin ol
  const dangerousChars = /[\\/:*?"<>|]/;
  return !dangerousChars.test(filename);
};

/**
 * Geçerli bir slug olup olmadığını kontrol eder
 * @param {string} slug - Kontrol edilecek slug
 * @returns {boolean}
 */
exports.isValidSlug = (slug) => {
  if (!slug) return false;
  
  // Slug formatı kontrolü (sadece küçük harfler, sayılar ve tire)
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};