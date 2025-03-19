/**
 * Async fonksiyonları try-catch bloğu ile sarmalayan yardımcı fonksiyon
 * Express middleware'leri için async hata yakalama
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { catchAsync };