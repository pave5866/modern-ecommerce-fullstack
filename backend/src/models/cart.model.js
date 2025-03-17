const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sepet öğesi alt şeması
const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Miktar en az 1 olmalıdır'],
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  image: String,
  variants: [{
    name: String,
    value: String
  }],
  totalPrice: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Ana sepet şeması
const cartSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  appliedCoupon: {
    code: String,
    discountAmount: Number,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    expiresAt: Date
  },
  shippingAddress: {
    fullName: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
    phone: String
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'banka_havale', 'paypal', 'kapida_odeme']
  },
  notes: String
}, { 
  timestamps: true 
});

// İstek listesi şeması
const wishlistSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { 
  timestamps: true 
});

// Toplam fiyat ve öğe sayısı hesaplama
cartSchema.pre('save', function(next) {
  let totalItems = 0;
  let totalPrice = 0;

  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      totalItems += item.quantity;
      totalPrice += item.totalPrice;
    });
  }

  // İndirim uygulanmışsa toplam fiyattan düş
  if (this.appliedCoupon && this.appliedCoupon.discountAmount) {
    if (this.appliedCoupon.discountType === 'percentage') {
      const discountAmount = (totalPrice * this.appliedCoupon.discountAmount) / 100;
      totalPrice = totalPrice - discountAmount;
    } else if (this.appliedCoupon.discountType === 'fixed') {
      totalPrice = totalPrice - this.appliedCoupon.discountAmount;
    }
    
    // Toplam fiyat negatif olmasın
    totalPrice = Math.max(0, totalPrice);
  }

  this.totalItems = totalItems;
  this.totalPrice = totalPrice;
  next();
});

// İndeks oluşturma
cartSchema.index({ user: 1 }, { unique: true });
wishlistSchema.index({ user: 1 }, { unique: true });
wishlistSchema.index({ 'items.product': 1 });

const Cart = mongoose.model('Cart', cartSchema);
const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = { Cart, Wishlist };