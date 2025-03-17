const Log = require('../models/log.model');
const { catchAsync } = require('../utils/catchAsync');
const logger = require('../utils/logger');

/**
 * Logları getir (Admin için)
 */
exports.getLogs = catchAsync(async (req, res) => {
  // Filtre, sıralama ve sayfalama
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  
  // Sıralama (varsayılan: en yeni önce)
  const sort = { timestamp: -1 };
  
  // Filtreleme
  const filter = {};
  
  if (req.query.level) {
    filter.level = req.query.level;
  }
  
  if (req.query.startDate && req.query.endDate) {
    filter.timestamp = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }
  
  if (req.query.search) {
    filter.$or = [
      { message: { $regex: req.query.search, $options: 'i' } },
      { 'meta.user': { $regex: req.query.search, $options: 'i' } },
      { 'meta.ip': { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Logları getir
  const [logs, total] = await Promise.all([
    Log.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Log.countDocuments(filter)
  ]);
  
  res.status(200).json({
    success: true,
    count: logs.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: logs
  });
});

/**
 * Yeni log oluştur (manuel)
 */
exports.createLog = catchAsync(async (req, res) => {
  const { level, message, meta } = req.body;
  
  if (!level || !message) {
    return res.status(400).json({
      success: false,
      message: 'Level ve message alanları zorunludur'
    });
  }
  
  const log = await Log.create({
    level,
    message,
    meta: {
      ...meta,
      user: req.user.email,
      ip: req.ip
    }
  });
  
  res.status(201).json({
    success: true,
    data: log
  });
});

/**
 * Tüm logları temizle (Admin için)
 */
exports.clearLogs = catchAsync(async (req, res) => {
  const { before } = req.query;
  
  const filter = {};
  if (before) {
    filter.timestamp = { $lt: new Date(before) };
  }
  
  const result = await Log.deleteMany(filter);
  
  res.status(200).json({
    success: true,
    message: `${result.deletedCount} log kaydı silindi`,
    deletedCount: result.deletedCount
  });
});

/**
 * Client tarafından gönderilen hataları kaydet
 * Bu endpoint publice açık, kullanıcı hesabı gerekmiyor
 */
exports.logClientError = catchAsync(async (req, res) => {
  const { level, message, meta, userAgent, url, stackTrace } = req.body;
  
  if (!level || !message) {
    return res.status(400).json({
      success: false,
      message: 'Level ve message alanları zorunludur'
    });
  }
  
  // IP adresini al
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Log oluştur
  const log = await Log.create({
    source: 'client',
    level: level,
    message: message,
    meta: {
      ...meta,
      ip: ip,
      userAgent: userAgent || req.headers['user-agent'],
      url: url,
      stackTrace: stackTrace
    }
  });
  
  // Ayrıca server loglarına da ekle
  logger.error(`Client error: ${message}`, {
    ip,
    userAgent: userAgent || req.headers['user-agent'],
    url
  });
  
  res.status(201).json({
    success: true,
    message: 'Log kaydedildi'
  });
});