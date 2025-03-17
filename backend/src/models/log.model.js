const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now
    },
    level: {
      type: String,
      enum: ['debug', 'info', 'warn', 'error', 'fatal'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    source: {
      type: String,
      enum: ['server', 'client'],
      default: 'server'
    },
    meta: {
      user: String,
      ip: String,
      userAgent: String,
      url: String,
      method: String,
      statusCode: Number,
      responseTime: Number,
      stackTrace: String,
      additionalInfo: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    collection: 'logs'
  }
);

// Index tanımları
logSchema.index({ timestamp: -1 }, { background: true });
logSchema.index({ level: 1, timestamp: -1 }, { background: true });
logSchema.index({ 'meta.user': 1, timestamp: -1 }, { background: true });
logSchema.index({ 'meta.ip': 1, timestamp: -1 }, { background: true });

// TTL index - logları otomatik olarak sil (30 gün sonra)
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, background: true });

// Büyük loglarda performans sağlamak için bazı alanları seçme
logSchema.pre('find', function() {
  // Tüm eski logları getirirken stackTrace gibi büyük alanları alma
  if (!this._fields || Object.keys(this._fields).length === 0) {
    this.select('-meta.stackTrace');
  }
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;