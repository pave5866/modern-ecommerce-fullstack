const Order = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const logger = require('../utils/logger');

/**
 * Tüm siparişleri getir (sadece admin)
 */
exports.getAllOrders = catchAsync(async (req, res) => {
  // Filtre, sıralama ve sayfalama
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Sıralama seçenekleri
  const sortField = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortOrder };
  
  // Filtreleme seçenekleri
  const filter = {};
  
  // Sipariş durumu filtresi
  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }
  
  // Tarih aralığı filtresi
  if (req.query.startDate && req.query.endDate) {
    filter.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }
  
  // Kullanıcı filtresi
  if (req.query.userId) {
    filter.user = req.query.userId;
  }

  // Sipariş no filtresi
  if (req.query.orderNumber) {
    filter.orderNumber = { $regex: req.query.orderNumber, $options: 'i' };
  }
  
  // Siparişleri getir
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter)
  ]);
  
  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: orders
  });
});

/**
 * Kullanıcının kendi siparişlerini getir
 */
exports.getMyOrders = catchAsync(async (req, res) => {
  // Filtre, sıralama ve sayfalama
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Filtreleme seçenekleri
  const filter = { user: req.user._id };
  
  // Sipariş durumu filtresi
  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }
  
  // Siparişleri getir
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter)
  ]);
  
  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: orders
  });
});

/**
 * Belirli bir siparişi getir (admin)
 */
exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('items.product', 'name price images')
    .lean();
  
  if (!order) {
    return next(new AppError('Sipariş bulunamadı', 404));
  }
  
  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * Kullanıcının kendi siparişini getir
 */
exports.getMyOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id
  })
    .populate('items.product', 'name price images')
    .lean();
  
  if (!order) {
    return next(new AppError('Sipariş bulunamadı', 404));
  }
  
  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * Yeni sipariş oluştur
 */
exports.createOrder = catchAsync(async (req, res, next) => {
  // Gerekli verileri al
  const {
    items,
    shippingAddress,
    paymentMethod,
    shippingMethod,
    note
  } = req.body;
  
  // Sepet öğelerini doğrula
  if (!items || items.length === 0) {
    return next(new AppError('Sipariş öğeleri gereklidir', 400));
  }
  
  // Ürün bilgilerini getir ve toplam fiyatı hesapla
  const productIds = items.map(item => item.product);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  
  // Ürün haritası oluştur
  const productMap = {};
  products.forEach(product => {
    productMap[product._id.toString()] = product;
  });
  
  // Sipariş öğelerini oluştur ve toplam hesapla
  const orderItems = [];
  let totalPrice = 0;
  
  for (const item of items) {
    const product = productMap[item.product.toString()];
    
    if (!product) {
      return next(new AppError(`Ürün bulunamadı: ${item.product}`, 400));
    }
    
    // Stok kontrolü
    if (product.countInStock < item.quantity) {
      return next(new AppError(`Ürün stokta yok: ${product.name}`, 400));
    }
    
    const price = product.discountPrice || product.price;
    const itemTotal = price * item.quantity;
    
    orderItems.push({
      product: product._id,
      name: product.name,
      quantity: item.quantity,
      price: price,
      image: product.images[0]?.url || '',
      total: itemTotal,
      attributes: item.attributes || {}
    });
    
    totalPrice += itemTotal;
  }
  
  // Kargo ücreti
  const shippingPrice = 0; // TODO: Kargo fiyatı hesaplama
  
  // Toplam sipariş tutarı
  const orderTotal = totalPrice + shippingPrice;
  
  // Sipariş numarası oluştur
  const orderNumber = `ORD-${Date.now()}-${req.user._id.toString().slice(-4)}`;
  
  // Siparişi oluştur
  const order = await Order.create({
    user: req.user._id,
    orderNumber,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    shippingMethod,
    shippingPrice,
    totalPrice,
    orderTotal,
    note,
    status: 'pending',
    paymentStatus: 'pending'
  });
  
  // Ürün stoklarını güncelle
  for (const item of orderItems) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { countInStock: -item.quantity, totalSales: item.quantity } }
    );
  }
  
  logger.info(`Yeni sipariş oluşturuldu: ${order.orderNumber} (${order._id})`);
  
  res.status(201).json({
    success: true,
    data: order
  });
});

/**
 * Sipariş durumunu güncelle (admin)
 */
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return next(new AppError('Sipariş durumu gereklidir', 400));
  }
  
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return next(new AppError('Geçersiz sipariş durumu', 400));
  }
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError('Sipariş bulunamadı', 404));
  }
  
  // Tamamlanmış siparişlerin durumu değiştirilemez
  if (order.status === 'delivered' && status !== 'delivered') {
    return next(new AppError('Tamamlanmış siparişin durumu değiştirilemez', 400));
  }
  
  // İptal edilmiş siparişlerin durumu değiştirilemez
  if (order.status === 'cancelled' && status !== 'cancelled') {
    return next(new AppError('İptal edilmiş siparişin durumu değiştirilemez', 400));
  }
  
  // Sipariş durumunu güncelle
  order.status = status;
  
  // Sipariş tamamlandığında ödeme durumunu da güncelle
  if (status === 'delivered') {
    order.paymentStatus = 'completed';
    order.deliveredAt = Date.now();
  }
  
  // Sipariş iptal edildiğinde stokları geri ekle
  if (status === 'cancelled' && order.status !== 'cancelled') {
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { countInStock: item.quantity, totalSales: -item.quantity } }
      );
    }
    
    order.cancelledAt = Date.now();
  }
  
  await order.save();
  
  logger.info(`Sipariş durumu güncellendi: ${order.orderNumber} (${order._id}) -> ${status}`);
  
  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * Siparişi güncelle (admin)
 */
exports.updateOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError('Sipariş bulunamadı', 404));
  }
  
  // Güncellenebilir alanlar
  const updatableFields = ['shippingAddress', 'note', 'trackingNumber'];
  
  updatableFields.forEach(field => {
    if (req.body[field] !== undefined) {
      order[field] = req.body[field];
    }
  });
  
  await order.save();
  
  logger.info(`Sipariş güncellendi: ${order.orderNumber} (${order._id})`);
  
  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * Siparişi iptal et (kullanıcı)
 */
exports.cancelOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id
  });
  
  if (!order) {
    return next(new AppError('Sipariş bulunamadı', 404));
  }
  
  // Sadece bekleyen siparişler iptal edilebilir
  if (order.status !== 'pending' && order.status !== 'processing') {
    return next(new AppError('Bu sipariş artık iptal edilemez', 400));
  }
  
  // Sipariş durumunu güncelle
  order.status = 'cancelled';
  order.cancelledAt = Date.now();
  
  // Stokları geri ekle
  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { countInStock: item.quantity, totalSales: -item.quantity } }
    );
  }
  
  await order.save();
  
  logger.info(`Sipariş iptal edildi: ${order.orderNumber} (${order._id})`);
  
  res.status(200).json({
    success: true,
    message: 'Sipariş başarıyla iptal edildi',
    data: order
  });
});

/**
 * Siparişi sil (admin)
 */
exports.deleteOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError('Sipariş bulunamadı', 404));
  }
  
  await order.remove();
  
  logger.info(`Sipariş silindi: ${order.orderNumber} (${order._id})`);
  
  res.status(200).json({
    success: true,
    message: 'Sipariş başarıyla silindi'
  });
});

/**
 * Ödeme doğrulama
 */
exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { orderId, paymentId, paymentDetails } = req.body;
  
  if (!orderId || !paymentId) {
    return next(new AppError('Sipariş ID ve ödeme ID gereklidir', 400));
  }
  
  const order = await Order.findOne({
    _id: orderId,
    user: req.user._id
  });
  
  if (!order) {
    return next(new AppError('Sipariş bulunamadı', 404));
  }
  
  // Sipariş zaten ödenmişse
  if (order.paymentStatus === 'completed') {
    return next(new AppError('Bu sipariş zaten ödenmiş', 400));
  }
  
  // Ödeme bilgilerini güncelle
  order.paymentStatus = 'completed';
  order.paymentResult = {
    id: paymentId,
    status: 'completed',
    update_time: Date.now(),
    details: paymentDetails || {}
  };
  
  await order.save();
  
  logger.info(`Ödeme doğrulandı: ${order.orderNumber} (${order._id})`);
  
  res.status(200).json({
    success: true,
    message: 'Ödeme başarıyla doğrulandı',
    data: order
  });
});