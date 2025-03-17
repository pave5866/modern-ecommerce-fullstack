const Review = require('../models/review.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Ürün değerlendirmelerini getir
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'newest', filter = 'all' } = req.query;
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    
    // Sıralama seçenekleri
    let sortOption = {};
    if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'highest') {
      sortOption = { rating: -1 };
    } else if (sort === 'lowest') {
      sortOption = { rating: 1 };
    } else if (sort === 'helpful') {
      sortOption = { upvotes: -1 };
    }
    
    // Filtreleme seçenekleri
    let query = { product: productId, status: 'approved' };
    
    if (filter !== 'all' && !isNaN(parseInt(filter))) {
      query.rating = parseInt(filter);
    } else if (filter === 'verified') {
      query.isVerifiedPurchase = true;
    } else if (filter === 'with_images') {
      query.images = { $exists: true, $ne: [] };
    }
    
    // Değerlendirmeleri sorgula
    const reviews = await Review.find(query)
      .sort(sortOption)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate('user', 'name avatar')
      .lean();
    
    // Toplam değerlendirme sayısı
    const totalReviews = await Review.countDocuments(query);
    
    // Puan dağılımı
    const ratingDistribution = await Review.getRatingDistribution(productId);
    
    // Ortalama puan
    const ratingStats = await Review.getAverageRating(productId);
    
    return res.status(200).json({
      success: true,
      count: reviews.length,
      total: totalReviews,
      totalPages: Math.ceil(totalReviews / limitNumber),
      currentPage: pageNumber,
      ratingDistribution,
      averageRating: ratingStats.averageRating,
      numReviews: ratingStats.numReviews,
      data: reviews
    });
  } catch (error) {
    logger.error(`Ürün değerlendirmeleri getirilirken hata: ${error.message}`, { productId: req.params.productId, error });
    return res.status(500).json({
      success: false,
      message: 'Değerlendirmeler alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Kullanıcının kendi değerlendirmelerini getir
exports.getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    
    const reviews = await Review.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate('product', 'name images')
      .lean();
    
    const totalReviews = await Review.countDocuments({ user: req.user.id });
    
    return res.status(200).json({
      success: true,
      count: reviews.length,
      total: totalReviews,
      totalPages: Math.ceil(totalReviews / limitNumber),
      currentPage: pageNumber,
      data: reviews
    });
  } catch (error) {
    logger.error(`Kullanıcı değerlendirmeleri getirilirken hata: ${error.message}`, { userId: req.user.id, error });
    return res.status(500).json({
      success: false,
      message: 'Değerlendirmeleriniz alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Yeni değerlendirme oluştur
exports.createReview = async (req, res) => {
  try {
    const { 
      productId, 
      rating, 
      title, 
      comment, 
      pros = [], 
      cons = [], 
      images = [],
      orderId
    } = req.body;
    
    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen gerekli alanları doldurun (ürün, puan, başlık, yorum)'
      });
    }
    
    // Ürün kontrolü
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }
    
    // Kullanıcının bu ürünü daha önce değerlendirip değerlendirmediğini kontrol et
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: productId
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Bu ürün için zaten bir değerlendirme yapmışsınız'
      });
    }
    
    // Satın alma doğrulaması
    let isVerifiedPurchase = false;
    let orderReference = null;
    
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: req.user.id,
        'orderItems.product': productId,
        isPaid: true
      });
      
      if (order) {
        isVerifiedPurchase = true;
        orderReference = order._id;
      }
    } else {
      // Kullanıcının bu ürünü satın alıp almadığını kontrol et (sipariş ID'si belirtilmemişse)
      const orders = await Order.find({
        user: req.user.id,
        'orderItems.product': productId,
        isPaid: true
      });
      
      if (orders && orders.length > 0) {
        isVerifiedPurchase = true;
        orderReference = orders[0]._id;
      }
    }
    
    // Yeni değerlendirme oluştur
    const review = new Review({
      user: req.user.id,
      product: productId,
      order: orderReference,
      rating,
      title,
      comment,
      pros,
      cons,
      images,
      isVerifiedPurchase,
      status: 'pending' // Onay bekliyor durumu
    });
    
    await review.save();
    
    return res.status(201).json({
      success: true,
      message: 'Değerlendirmeniz başarıyla kaydedildi ve onay için gönderildi',
      data: review
    });
  } catch (error) {
    logger.error(`Değerlendirme oluşturulurken hata: ${error.message}`, { userId: req.user.id, error });
    return res.status(500).json({
      success: false,
      message: 'Değerlendirme oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

// Değerlendirme güncelle
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const {
      rating,
      title,
      comment,
      pros,
      cons,
      images
    } = req.body;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Değerlendirme bulunamadı'
      });
    }
    
    // Kullanıcının kendi değerlendirmesi mi kontrol et
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu değerlendirmeyi düzenleme yetkiniz yok'
      });
    }
    
    // Güncellenebilir alanlar
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (pros) review.pros = pros;
    if (cons) review.cons = cons;
    if (images) review.images = images;
    
    // Düzenleme bilgisi ekle
    review.isEdited = true;
    // Düzenleme sonrası tekrar onaya gönder
    review.status = 'pending';
    
    await review.save();
    
    return res.status(200).json({
      success: true,
      message: 'Değerlendirmeniz başarıyla güncellendi ve tekrar onaya gönderildi',
      data: review
    });
  } catch (error) {
    logger.error(`Değerlendirme güncellenirken hata: ${error.message}`, { userId: req.user.id, reviewId: req.params.reviewId, error });
    return res.status(500).json({
      success: false,
      message: 'Değerlendirme güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Değerlendirme sil
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Değerlendirme bulunamadı'
      });
    }
    
    // Kullanıcının kendi değerlendirmesi mi kontrol et
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu değerlendirmeyi silme yetkiniz yok'
      });
    }
    
    await review.remove();
    
    return res.status(200).json({
      success: true,
      message: 'Değerlendirme başarıyla silindi'
    });
  } catch (error) {
    logger.error(`Değerlendirme silinirken hata: ${error.message}`, { userId: req.user.id, reviewId: req.params.reviewId, error });
    return res.status(500).json({
      success: false,
      message: 'Değerlendirme silinirken bir hata oluştu',
      error: error.message
    });
  }
};

// Admin: Tüm değerlendirmeleri getir
exports.getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, productId } = req.query;
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (productId) {
      query.product = productId;
    }
    
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate('user', 'name email avatar')
      .populate('product', 'name images')
      .lean();
    
    const totalReviews = await Review.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: reviews.length,
      total: totalReviews,
      totalPages: Math.ceil(totalReviews / limitNumber),
      currentPage: pageNumber,
      data: reviews
    });
  } catch (error) {
    logger.error(`Admin: Tüm değerlendirmeler getirilirken hata: ${error.message}`, { userId: req.user.id, error });
    return res.status(500).json({
      success: false,
      message: 'Değerlendirmeler alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Admin: Değerlendirme onayla
exports.approveReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Değerlendirme bulunamadı'
      });
    }
    
    review.status = 'approved';
    review.adminResponse = {
      response: req.body.response || 'Değerlendirmeniz onaylandı',
      date: Date.now(),
      admin: req.user.id
    };
    
    await review.save();
    
    return res.status(200).json({
      success: true,
      message: 'Değerlendirme başarıyla onaylandı',
      data: review
    });
  } catch (error) {
    logger.error(`Admin: Değerlendirme onaylanırken hata: ${error.message}`, { userId: req.user.id, reviewId: req.params.reviewId, error });
    return res.status(500).json({
      success: false,
      message: 'Değerlendirme onaylanırken bir hata oluştu',
      error: error.message
    });
  }
};

// Admin: Değerlendirme reddet
exports.rejectReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    
    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'Reddetme nedeni belirtmelisiniz'
      });
    }
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Değerlendirme bulunamadı'
      });
    }
    
    review.status = 'rejected';
    review.adminResponse = {
      response,
      date: Date.now(),
      admin: req.user.id
    };
    
    await review.save();
    
    return res.status(200).json({
      success: true,
      message: 'Değerlendirme başarıyla reddedildi',
      data: review
    });
  } catch (error) {
    logger.error(`Admin: Değerlendirme reddedilirken hata: ${error.message}`, { userId: req.user.id, reviewId: req.params.reviewId, error });
    return res.status(500).json({
      success: false,
      message: 'Değerlendirme reddedilirken bir hata oluştu',
      error: error.message
    });
  }
};