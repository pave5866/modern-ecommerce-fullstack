const mongoose = require('mongoose');
// Slugify yerine kendi slug fonksiyonumuzu kullanacağız
const Schema = mongoose.Schema;

// Slugify benzeri basit fonksiyon
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Boşlukları tire ile değiştir
    .replace(/[^\w\-]+/g, '')   // Alfanumerik olmayan karakterleri kaldır
    .replace(/\-\-+/g, '-')     // Birden fazla tireyi tek tire yap
    .replace(/^-+/, '')         // Baştaki tireleri kaldır
    .replace(/-+$/, '');        // Sondaki tireleri kaldır
};

// Kategori Şeması
const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Kategori adı zorunludur'],
      trim: true,
      unique: true,
      maxlength: [100, 'Kategori adı 100 karakterden uzun olamaz']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      maxlength: [500, 'Açıklama 500 karakterden uzun olamaz']
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    ancestors: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          ref: 'Category',
          required: true
        },
        name: {
          type: String,
          required: true
        },
        slug: {
          type: String,
          required: true
        }
      }
    ],
    image: String,
    icon: String,
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    showInMenu: {
      type: Boolean,
      default: true
    },
    showInHome: {
      type: Boolean,
      default: false
    },
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Arama için indeksler
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ parent: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ order: 1 });

// Kategori oluşturulduğunda veya güncellendiğinde slug oluştur
categorySchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    return next();
  }
  
  // Slug oluştur
  this.slug = createSlug(this.name);
  
  // Aynı slug'a sahip başka bir kategori var mı kontrol et
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const categoryWithSlug = await this.constructor.find({ slug: slugRegEx });
  
  if (categoryWithSlug.length > 0) {
    this.slug = `${this.slug}-${categoryWithSlug.length + 1}`;
  }
  
  // Eğer bir üst kategori varsa, atalarını güncelle
  if (this.parent) {
    const parentCategory = await this.constructor.findById(this.parent);
    
    if (parentCategory) {
      // Üst kategori ve onun atalarını ekle
      this.ancestors = [
        {
          _id: parentCategory._id,
          name: parentCategory.name,
          slug: parentCategory.slug
        },
        ...parentCategory.ancestors
      ];
    }
  } else {
    // Üst kategori yoksa, atalar boş array
    this.ancestors = [];
  }
  
  next();
});

// Alt kategorileri getiren virtual alan
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Alt kategorilerin sayısını bulan statik metot
categorySchema.statics.countSubcategories = async function(categoryId) {
  return this.countDocuments({ parent: categoryId });
};

// Belirli bir kategori ve alt kategorilerine ait ürünlerin sayısını bulan statik metot
categorySchema.statics.countProducts = async function(categoryId) {
  const Product = mongoose.model('Product');
  
  // İlgili kategori ve alt kategorilerini bul
  const category = await this.findById(categoryId);
  if (!category) return 0;
  
  const subcategories = await this.find({ parent: categoryId });
  const subcategoryIds = subcategories.map(subcat => subcat._id);
  
  // Kategori ID'lerini içeren dizi
  const categoryIds = [categoryId, ...subcategoryIds];
  
  // Bu kategorilere ait ürünlerin sayısını bul
  return Product.countDocuments({ category: { $in: categoryIds } });
};

// Model oluştur
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;