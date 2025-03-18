const mongoose = require('mongoose')
const logger = require('../utils/logger')

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Kategori adı zorunludur'],
    trim: true,
    unique: true,
    maxlength: [50, 'Kategori adı 50 karakterden uzun olamaz']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    maxlength: [500, 'Açıklama 500 karakterden uzun olamaz']
  },
  image: {
    type: String,
    default: 'default-category.jpg'
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  ancestors: [{
    _id: {
      type: mongoose.Schema.ObjectId,
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
  }],
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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
})

// Alt kategorileri getir
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
})

// Slug oluştur
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
  next()
})

// Atalarını güncelle
categorySchema.pre('save', async function(next) {
  if (!this.isModified('parent')) return next()
  
  if (!this.parent) {
    this.ancestors = []
    return next()
  }

  try {
    const parent = await this.constructor.findById(this.parent)
    if (!parent) return next()

    this.ancestors = [
      ...parent.ancestors,
      {
        _id: parent._id,
        name: parent.name,
        slug: parent.slug
      }
    ]
    next()
  } catch (error) {
    next(error)
  }
})

// Alt kategorileri getir
categorySchema.methods.getChildren = async function() {
  return await this.constructor.find({ parent: this._id })
}

// Tüm alt kategorileri getir (recursive)
categorySchema.methods.getAllChildren = async function() {
  try {
    const children = await this.getChildren()
    let allChildren = [...children]

    for (const child of children) {
      const grandchildren = await child.getAllChildren()
      allChildren = [...allChildren, ...grandchildren]
    }

    return allChildren
  } catch (error) {
    logger.error(`Alt kategorileri bulma hatası: ${error.message}`)
    throw error
  }
}

// Kategoriyi taşı
categorySchema.methods.moveTo = async function(newParentId) {
  this.parent = newParentId
  return await this.save()
}

// Sırasını güncelle
categorySchema.methods.updateOrder = async function(newOrder) {
  this.order = newOrder
  return await this.save()
}

// Durumunu güncelle
categorySchema.methods.updateStatus = async function(isActive) {
  this.isActive = isActive
  return await this.save()
}

// İsim veya slug ile kategori bulma
categorySchema.statics.findByNameOrSlug = async function(identifier) {
  try {
    const category = await this.findOne({
      $or: [
        { name: identifier },
        { slug: identifier }
      ]
    })
    
    return category
  } catch (error) {
    logger.error(`Kategori bulma hatası: ${error.message}`)
    throw error
  }
}

const Category = mongoose.model('Category', categorySchema)

module.exports = Category 