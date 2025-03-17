const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sipariş modeli alt şemaları
const OrderItemSchema = new Schema({
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
    min: [1, 'Miktar en az 1 olmalıdır']
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
});

const ShippingAddressSchema = new Schema({
  fullName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  }
});

const PaymentResultSchema = new Schema({
  id: String,
  status: String,
  update_time: String,
  email_address: String,
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'banka_havale', 'paypal', 'kapida_odeme'],
    default: 'credit_card'
  },
  details: Schema.Types.Mixed
});

// Ana Sipariş Şeması
const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    orderItems: [OrderItemSchema],
    shippingAddress: ShippingAddressSchema,
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'banka_havale', 'paypal', 'kapida_odeme'],
      required: true
    },
    paymentResult: PaymentResultSchema,
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    discountPrice: {
      type: Number,
      default: 0.0
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    orderNumber: {
      type: String,
      unique: true
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      required: true,
      default: false
    },
    deliveredAt: Date,
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending'
    },
    notes: String,
    trackingNumber: String,
    couponCode: String,
    invoiceUrl: String
  },
  {
    timestamps: true
  }
);

// Sipariş numarası oluştur
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    // SIPRIS-YYMMDDHHMM-XXXX formatında bir sipariş numarası oluştur
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const random = Math.floor(1000 + Math.random() * 9000); // 1000-9999 arası rastgele sayı
    
    this.orderNumber = `SIPARIS-${year}${month}${day}${hours}${minutes}-${random}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;