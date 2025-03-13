const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ürün adı zorunludur'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Ürün açıklaması zorunludur']
  },
  price: {
    type: Number,
    required: [true, 'Ürün fiyatı zorunludur'],
    min: [0, 'Fiyat 0\'dan küçük olamaz'],
    index: true
  },
  images: [{
    type: String
  }],
  category: {
    type: String,
    required: [true, 'Kategori zorunludur'],
    index: true
  },
  stock: {
    type: Number,
    required: [true, 'Stok miktarı zorunludur'],
    min: [0, 'Stok miktarı 0\'dan küçük olamaz']
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  specifications: [{
    name: String,
    value: String
  }],
  variants: [{
    name: String,
    options: [String],
    price: Number,
    stock: Number
  }],
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    value: Number,
    startDate: Date,
    endDate: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ürün fiyatını indirimli hesaplama
productSchema.virtual('discountedPrice').get(function() {
  if (!this.discount || !this.discount.value) return this.price

  const now = new Date()
  if (this.discount.startDate && now < this.discount.startDate) return this.price
  if (this.discount.endDate && now > this.discount.endDate) return this.price

  if (this.discount.type === 'percentage') {
    return this.price - (this.price * this.discount.value / 100)
  }
  return this.price - this.discount.value
})

// Ürün puanını güncelleme
productSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.rating.average = 0
    this.rating.count = 0
    return
  }

  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0)
  this.rating.average = sum / this.reviews.length
  this.rating.count = this.reviews.length
}

// Yorum ekleme
productSchema.methods.addReview = function(userId, rating, comment) {
  // Kullanıcının daha önce yorum yapıp yapmadığını kontrol et
  const existingReviewIndex = this.reviews.findIndex(
    review => review.user.toString() === userId.toString()
  )

  if (existingReviewIndex > -1) {
    // Varolan yorumu güncelle
    this.reviews[existingReviewIndex].rating = rating
    this.reviews[existingReviewIndex].comment = comment
  } else {
    // Yeni yorum ekle
    this.reviews.push({ user: userId, rating, comment })
  }

  // Ürün puanını güncelle
  this.updateRating()
  return this.save()
}

// Yorum silme
productSchema.methods.removeReview = function(userId) {
  this.reviews = this.reviews.filter(
    review => review.user.toString() !== userId.toString()
  )
  this.updateRating()
  return this.save()
}

// Stok güncelleme
productSchema.methods.updateStock = function(quantity) {
  this.stock += quantity
  return this.save()
}

// İndirim ekleme
productSchema.methods.addDiscount = function(type, value, startDate, endDate) {
  this.discount = {
    type,
    value,
    startDate,
    endDate
  }
  return this.save()
}

// İndirimi kaldırma
productSchema.methods.removeDiscount = function() {
  this.discount = undefined
  return this.save()
}

module.exports = mongoose.model('Product', productSchema); 