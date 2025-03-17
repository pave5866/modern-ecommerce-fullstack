// Bu dosya projenin ilerleyen aşamalarında doldurulacak
// Şimdilik boş bir middleware yapısı

exports.protect = (req, res, next) => {
  // Oturum kontrolü
  req.user = { id: 'dummy-user-id', role: 'user' };
  next();
};

exports.authorize = (role) => {
  return (req, res, next) => {
    // Yetki kontrolü
    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi gerçekleştirmek için yetkiniz yok'
      });
    }
    next();
  };
};