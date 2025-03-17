const logger = require('../utils/logger');

// Panel istatistikleri özeti
exports.getSummary = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        totalSales: 15250,
        totalOrders: 124,
        totalProducts: 85,
        totalCustomers: 67,
        stockStats: { totalStock: 1500, lowStock: 12, outOfStock: 5 },
        todaySales: { total: 2450, count: 7 },
        monthlySales: { total: 12800, count: 98 }
      }
    });
  } catch (error) {
    logger.error(`Dashboard özeti alınırken hata: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Dashboard özeti alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Satış istatistikleri
exports.getSalesStats = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: [
        { date: '2025-03-01', sales: 1250 },
        { date: '2025-03-02', sales: 950 },
        { date: '2025-03-03', sales: 1400 }
      ]
    });
  } catch (error) {
    logger.error(`Satış istatistikleri alınırken hata: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Satış istatistikleri alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Ürün istatistikleri
exports.getProductStats = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        categories: [
          { name: 'Elektronik', count: 25 },
          { name: 'Giyim', count: 30 },
          { name: 'Kitap', count: 15 },
          { name: 'Ev Eşyaları', count: 20 }
        ],
        stockStatus: [
          { status: 'Stokta', count: 70 },
          { status: 'Az Stok', count: 10 },
          { status: 'Tükendi', count: 5 }
        ]
      }
    });
  } catch (error) {
    logger.error(`Ürün istatistikleri alınırken hata: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Ürün istatistikleri alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Kullanıcı istatistikleri
exports.getUserStats = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        total: 67,
        active: 45,
        new: 12,
        byRole: [
          { role: 'admin', count: 3 },
          { role: 'user', count: 64 }
        ]
      }
    });
  } catch (error) {
    logger.error(`Kullanıcı istatistikleri alınırken hata: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Kullanıcı istatistikleri alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Sipariş istatistikleri
exports.getOrderStats = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        status: [
          { status: 'Bekliyor', count: 15 },
          { status: 'İşleniyor', count: 10 },
          { status: 'Kargoda', count: 20 },
          { status: 'Tamamlandı', count: 79 },
          { status: 'İptal', count: 5 }
        ],
        averageValue: 123.45
      }
    });
  } catch (error) {
    logger.error(`Sipariş istatistikleri alınırken hata: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Sipariş istatistikleri alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Son siparişler
exports.getRecentOrders = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: [
        { id: '1', total: 125, date: '2025-03-17', status: 'Tamamlandı' },
        { id: '2', total: 250, date: '2025-03-16', status: 'Kargoda' },
        { id: '3', total: 75, date: '2025-03-15', status: 'İşleniyor' }
      ]
    });
  } catch (error) {
    logger.error(`Son siparişler alınırken hata: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Son siparişler alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// En çok satan ürünler
exports.getTopProducts = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: [
        { id: '1', name: 'Akıllı Telefon', sold: 25, revenue: 25000 },
        { id: '2', name: 'Laptop', sold: 15, revenue: 30000 },
        { id: '3', name: 'Kulaklık', sold: 50, revenue: 5000 }
      ]
    });
  } catch (error) {
    logger.error(`En çok satan ürünler alınırken hata: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'En çok satan ürünler alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// En çok alışveriş yapan müşteriler
exports.getTopCustomers = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: [
        { id: '1', name: 'Ahmet Yılmaz', spent: 5000, orders: 15 },
        { id: '2', name: 'Ayşe Demir', spent: 3500, orders: 12 },
        { id: '3', name: 'Mehmet Kaya', spent: 2800, orders: 9 }
      ]
    });
  } catch (error) {
    logger.error(`En çok alışveriş yapan müşteriler alınırken hata: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'En çok alışveriş yapan müşteriler alınırken bir hata oluştu',
      error: error.message
    });
  }
};