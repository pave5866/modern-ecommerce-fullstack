/**
 * AppError - Özel hata sınıfı
 * API'miz genelinde tutarlı hata işleme için bu sınıfı kullanıyoruz
 */
class AppError extends Error {
  /**
   * @param {string} message - Hata mesajı
   * @param {number} statusCode - HTTP durum kodu
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // İşletimsel hatalar için flag

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;