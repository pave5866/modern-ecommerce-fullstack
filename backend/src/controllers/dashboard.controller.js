const Order = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Panel istatistikleri özeti
exports.getDashboardSummary = async (req, res) => {
  try {
    // Toplam satış miktarı
    const totalSales = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    // Toplam sipariş sayısı
    const totalOrders = await Order.countDocuments({ isPaid: true });
    
    // Toplam ürün sayısı
    const totalProducts = await Product.countDocuments();
    
    // Stok durumu
    const stockStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$stock' },
          lowStock: {
            $sum: {
              $cond: [{ $lt: ['$stock', 10] }, 1, 0]
            }
          },
          outOfStock: {
            $sum: {
              $cond: [{ $eq: ['$stock', 0] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // Müşteri sayısı
    const totalCustomers = await User.countDocuments({ role: 'user' });
    
    // Bugünkü sipariş ve satış
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySales = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Bu ayki satışlar
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthlySales = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Son 7 gündeki sipariş durumu
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const orderStatusStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: lastWeek }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Son kayıtlı kullanıcılar
    const newCustomers = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email avatar createdAt');
    
    return res.status(200).json({
      success: true,
      data: {
        totalSales: totalSales.length > 0 ? totalSales[0].total : 0,
        totalOrders,
        totalProducts,
        totalCustomers,
        stockStats: stockStats.length > 0 ? stockStats[0] : { totalStock: 0, lowStock: 0, outOfStock: 0 },
        todaySales: todaySales.length > 0 ? todaySales[0] : { total: 0, count: 0 },
        monthlySales: monthlySales.length > 0 ? monthlySales[0] : { total: 0, count: 0 },
        orderStatusStats,
        newCustomers
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
    const { period = 'weekly' } = req.query;
    
    let groupStage;
    let matchStage;
    let startDate;
    
    const now = new Date();
    
    // Dönem seçimine göre tarihleri ve gruplama şeklini ayarla
    if (period === 'daily') {
      // Son 30 gün
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSales: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      };
    } else if (period === 'weekly') {
      // Son 12 hafta
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 84); // 12 hafta = 84 gün
      
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' }
          },
          totalSales: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      };
    } else if (period === 'monthly') {
      // Son 12 ay
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);
      
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSales: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz dönem. Kabul edilen değerler: daily, weekly, monthly'
      });
    }
    
    matchStage = {
      $match: {
        isPaid: true,
        createdAt: { $gte: startDate }
      }
    };
    
    // Verileri al
    const salesData = await Order.aggregate([
      matchStage,
      groupStage,
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);
    
    // Sonuçları formatla
    const formattedData = salesData.map(item => {
      let label;
      
      if (period === 'daily') {
        label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      } else if (period === 'weekly') {
        label = `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`;
      } else if (period === 'monthly') {
        label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      }
      
      return {
        label,
        totalSales: item.totalSales,
        count: item.count
      };
    });
    
    return res.status(200).json({
      success: true,
      period,
      data: formattedData
    });
  } catch (error) {
    logger.error(`Satış istatistikleri alınırken hata: ${error.message}`, { period: req.query.period, error });
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
    // Kategori dağılımı
    const categoryDistribution = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          categoryName: { $arrayElemAt: ['$categoryInfo.name', 0] }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Stok durumu
    const stockStatus = await Product.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$stock', 0] },
              'outOfStock',
              {
                $cond: [
                  { $lt: ['$stock', 10] },
                  'lowStock',
                  'inStock'
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Fiyat aralığı dağılımı
    const priceRangeDistribution = await Product.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ['$price', 50] },
              '0-50',
              {
                $cond: [
                  { $lt: ['$price', 100] },
                  '50-100',
                  {
                    $cond: [
                      { $lt: ['$price', 250] },
                      '100-250',
                      {
                        $cond: [
                          { $lt: ['$price', 500] },
                          '250-500',
                          '500+'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    return res.status(200).json({
      success: true,
      data: {
        categoryDistribution,
        stockStatus,
        priceRangeDistribution
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
    // Kullanıcı kayıt istatistikleri (son 6 ay)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Kullanıcı rolleri dağılımı
    const roleCounts = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Aktif kullanıcılar (son 30 gün içinde siparişi olanlar)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' }
        }
      },
      { $count: 'activeUserCount' }
    ]);
    
    // Formatlanmış kullanıcı kayıt verileri
    const formattedRegistrations = userRegistrations.map(item => {
      const monthLabel = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      return {
        month: monthLabel,
        count: item.count
      };
    });
    
    return res.status(200).json({
      success: true,
      data: {
        registrations: formattedRegistrations,
        roleCounts,
        activeUsers: activeUsers.length > 0 ? activeUsers[0].activeUserCount : 0,
        totalUsers: await User.countDocuments()
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
    // Sipariş durumu dağılımı
    const orderStatusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Ödeme yöntemi dağılımı
    const paymentMethodDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Ortalama sipariş değeri
    const averageOrderValue = await Order.aggregate([
      {
        $match: {
          isPaid: true
        }
      },
      {
        $group: {
          _id: null,
          averageValue: { $avg: '$totalPrice' }
        }
      }
    ]);
    
    // Sipariş saat dağılımı (hangi saatlerde daha çok sipariş veriliyor)
    const hourlyDistribution = await Order.aggregate([
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    return res.status(200).json({
      success: true,
      data: {
        statusDistribution: orderStatusDistribution,
        paymentMethodDistribution,
        averageOrderValue: averageOrderValue.length > 0 ? parseFloat(averageOrderValue[0].averageValue.toFixed(2)) : 0,
        hourlyDistribution
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

// Son siparişler (son 10 sipariş)
exports.getRecentOrders = async (req, res) => {
  try {
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .select('orderNumber totalPrice isPaid status createdAt user');
    
    return res.status(200).json({
      success: true,
      count: recentOrders.length,
      data: recentOrders
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
    const topProducts = await Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          productName: { $first: '$orderItems.name' },
          totalSold: { $sum: '$orderItems.quantity' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $project: {
          _id: 1,
          productName: 1,
          totalSold: 1,
          totalRevenue: 1,
          image: { $arrayElemAt: ['$productInfo.images', 0] },
          stock: { $arrayElemAt: ['$productInfo.stock', 0] },
          price: { $arrayElemAt: ['$productInfo.price', 0] }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);
    
    return res.status(200).json({
      success: true,
      count: topProducts.length,
      data: topProducts
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
    const topCustomers = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          _id: 1,
          totalSpent: 1,
          orderCount: 1,
          name: { $arrayElemAt: ['$userInfo.name', 0] },
          email: { $arrayElemAt: ['$userInfo.email', 0] },
          avatar: { $arrayElemAt: ['$userInfo.avatar', 0] }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);
    
    return res.status(200).json({
      success: true,
      count: topCustomers.length,
      data: topCustomers
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