const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Kategori adı gereklidir'],
      trim: true,
      maxlength: [32, 'Kategori adı en fazla 32 karakter olabilir']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      maxlength: [2000, 'Açıklama en fazla 2000 karakter olabilir']
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    ancestors: [{
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        index: true
      },
      name: String,
      slug: String
    }],
    imageUrl: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Alt kategorileri virtual olarak getir
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Slug oluştur
categorySchema.pre('save', async function(next) {
  if (!this.isModified('name') && this.slug) {
    return next();
  }
  
  this.slug = slugify(this.name, {
    lower: true,
    strict: true,
    locale: 'tr'
  });
  
  const slugRegEx = new RegExp(`^(${this.slug})((-\\d*$)?)$`, 'i');
  const categoryWithSlug = await this.constructor.find({ slug: slugRegEx });
  
  if (categoryWithSlug.length > 0) {
    this.slug = `${this.slug}-${categoryWithSlug.length + 1}`;
  }
  
  // Eğer üst kategori varsa, ancestors dizisini oluştur
  if (this.parent) {
    const parent = await this.constructor.findById(this.parent);
    
    if (!parent) {
      return next(new Error('Belirtilen üst kategori bulunamadı'));
    }
    
    this.ancestors = [
      ...parent.ancestors,
      {
        _id: parent._id,
        name: parent.name,
        slug: parent.slug
      }
    ];
  } else {
    this.ancestors = [];
  }
  
  next();
});

// Kategori silindiğinde alt kategoriler de kaldırılsın
categorySchema.pre('remove', async function(next) {
  // Alt kategorileri bul ve sil
  const childCategories = await this.constructor.find({ parent: this._id });
  
  for (const child of childCategories) {
    await child.remove();
  }
  
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;