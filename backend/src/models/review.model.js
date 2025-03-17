const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    pros: [String],
    cons: [String],
    images: [String],
    upvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    downvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false
    },
    adminResponse: {
      response: String,
      date: Date,
      admin: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Her kullanıcı bir ürün için sadece bir inceleme yapabilir
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Diğer indeksler
reviewSchema.index({ product: 1, status: 1, createdAt: -1 }); // Ürün sayfası sıralaması için
reviewSchema.index({ user: 1, createdAt: -1 }); // Kullanıcının incelemelerini listelemek için
reviewSchema.index({ status: 1 }); // Admin onay filtresi için

// Ürün ortalama puanını hesaplama statik metodu
reviewSchema.statics.getAverageRating = async function(productId) {
  try {
    const result = await this.aggregate([
      {
        $match: {
          product: productId,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          numReviews: { $sum: 1 }
        }
      }
    ]);

    if (result.length > 0) {
      return {
        averageRating: parseFloat(result[0].averageRating.toFixed(1)),
        numReviews: result[0].numReviews
      };
    } else {
      return {
        averageRating: 0,
        numReviews: 0
      };
    }
  } catch (error) {
    console.error('Derecelendirme hesaplanırken hata oluştu:', error);
    throw error;
  }
};

// Puan dağılımını hesaplama
reviewSchema.statics.getRatingDistribution = async function(productId) {
  try {
    const result = await this.aggregate([
      {
        $match: {
          product: productId,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    // Tüm değerlendirme seviyelerini (1-5) içerecek şekilde format
    const distribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    result.forEach(item => {
      distribution[item._id] = item.count;
    });

    return distribution;
  } catch (error) {
    console.error('Puan dağılımı hesaplanırken hata oluştu:', error);
    throw error;
  }
};

// İnceleme oluşturulduğunda veya güncellendiğinde ürünün puanını güncelle
reviewSchema.post('save', async function() {
  try {
    // Ürün modelini dinamik olarak import et (döngüsel bağımlılıktan kaçınmak için)
    const Product = mongoose.model('Product');
    const stats = await this.constructor.getAverageRating(this.product);

    await Product.findByIdAndUpdate(this.product, {
      rating: stats.averageRating,
      numReviews: stats.numReviews
    });
  } catch (error) {
    console.error('İnceleme sonrası ürün güncelleme hatası:', error);
  }
});

// Silme işlemi sonrası ürün puanını güncelle
reviewSchema.post('remove', async function() {
  try {
    const Product = mongoose.model('Product');
    const stats = await this.constructor.getAverageRating(this.product);

    await Product.findByIdAndUpdate(this.product, {
      rating: stats.averageRating,
      numReviews: stats.numReviews
    });
  } catch (error) {
    console.error('İnceleme silme sonrası ürün güncelleme hatası:', error);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;