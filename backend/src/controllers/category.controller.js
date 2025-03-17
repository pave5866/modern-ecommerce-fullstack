const Category = require('../models/category.model');
const Product = require('../models/product.model');
const logger = require('../utils/logger');

// Tüm kategorileri getir
exports.getAllCategories = async (req, res) => {
  try {
    const { 
      populate = false, 
      active, 
      parent, 
      showInMenu, 
      showInHome,
      sort = 'order' 
    } = req.query;
    
    let query = {};
    let sortOption = {};
    
    // Filtreler
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    if (parent === 'null') {
      // Ana kategorileri getir
      query.parent = null;
    } else if (parent) {
      // Belirli bir kategorinin alt kategorilerini getir
      query.parent = parent;
    }
    
    if (showInMenu !== undefined) {
      query.showInMenu = showInMenu === 'true';
    }
    
    if (showInHome !== undefined) {
      query.showInHome = showInHome === 'true';
    }
    
    // Sıralama
    if (sort === 'order') {
      sortOption.order = 1;
    } else if (sort === 'name') {
      sortOption.name = 1;
    } else if (sort === 'newest') {
      sortOption.createdAt = -1;
    }
    
    // Sorgu oluştur
    let categories;
    if (populate === 'true') {
      categories = await Category.find(query)
        .populate({
          path: 'parent',
          select: 'name slug'
        })
        .populate({
          path: 'subcategories',
          select: 'name slug image'
        })
        .sort(sortOption);
    } else {
      categories = await Category.find(query)
        .sort(sortOption);
    }
    
    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    logger.error(`Kategoriler getirilirken hata: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Kategoriler alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Hiyerarşik kategori yapısı getir
exports.getCategoryTree = async (req, res) => {
  try {
    // Ana kategorileri bul
    const rootCategories = await Category.find({ parent: null, isActive: true })
      .sort({ order: 1 });
    
    // Her bir kategori için alt kategorileri bul
    const categoryTree = await Promise.all(
      rootCategories.map(async rootCategory => {
        const subcategories = await Category.find({ parent: rootCategory._id, isActive: true })
          .sort({ order: 1 });
        
        // Alt kategorilerin kendi alt kategorilerini bul (3. seviye)
        const subcategoriesWithChildren = await Promise.all(
          subcategories.map(async subcat => {
            const children = await Category.find({ parent: subcat._id, isActive: true })
              .sort({ order: 1 })
              .select('_id name slug image');
            
            return {
              ...subcat.toObject(),
              children
            };
          })
        );
        
        return {
          ...rootCategory.toObject(),
          subcategories: subcategoriesWithChildren
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      data: categoryTree
    });
  } catch (error) {
    logger.error(`Kategori ağacı getirilirken hata: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Kategori ağacı alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Kategori detayını getir
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id)
      .populate({
        path: 'parent',
        select: 'name slug'
      })
      .populate({
        path: 'subcategories',
        select: 'name slug image'
      });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }
    
    // Kategori ve alt kategorilerine ait ürün sayısını bul
    const productCount = await Category.countProducts(id);
    
    const result = {
      ...category.toObject(),
      productCount
    };
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Kategori getirilirken hata: ${error.message}`, { categoryId: req.params.id, error });
    return res.status(500).json({
      success: false,
      message: 'Kategori alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Slug ile kategori getir
exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await Category.findOne({ slug })
      .populate({
        path: 'parent',
        select: 'name slug'
      })
      .populate({
        path: 'subcategories',
        select: 'name slug image'
      });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }
    
    // Kategori ve alt kategorilerine ait ürün sayısını bul
    const productCount = await Category.countProducts(category._id);
    
    const result = {
      ...category.toObject(),
      productCount
    };
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Kategori slug ile getirilirken hata: ${error.message}`, { slug: req.params.slug, error });
    return res.status(500).json({
      success: false,
      message: 'Kategori alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Yeni kategori oluştur
exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      parent,
      image,
      icon,
      isActive,
      order,
      showInMenu,
      showInHome,
      metaTitle,
      metaDescription,
      metaKeywords
    } = req.body;
    
    // Kategori adı gerekli
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Kategori adı zorunludur'
      });
    }
    
    // Aynı isimde kategori var mı kontrol et
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Bu isimde bir kategori zaten mevcut'
      });
    }
    
    // Üst kategori varsa geçerli olup olmadığını kontrol et
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Belirtilen üst kategori bulunamadı'
        });
      }
    }
    
    // Yeni kategori oluştur
    const category = new Category({
      name,
      description,
      parent,
      image,
      icon,
      isActive,
      order,
      showInMenu,
      showInHome,
      metaTitle,
      metaDescription,
      metaKeywords
    });
    
    await category.save();
    
    return res.status(201).json({
      success: true,
      message: 'Kategori başarıyla oluşturuldu',
      data: category
    });
  } catch (error) {
    logger.error(`Kategori oluşturulurken hata: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Kategori oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

// Kategori güncelle
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Kategori mevcut mu kontrol et
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }
    
    // Aynı isimde başka bir kategori var mı kontrol et
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: updateData.name,
        _id: { $ne: id } // Kendisi hariç
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Bu isimde bir kategori zaten mevcut'
        });
      }
    }
    
    // Döngüsel üst-alt kategori ilişkisi kontrolü
    if (updateData.parent) {
      // Kendisini üst kategori olarak seçemez
      if (updateData.parent === id) {
        return res.status(400).json({
          success: false,
          message: 'Bir kategori kendisini üst kategori olarak seçemez'
        });
      }
      
      // Alt kategorilerinden birini üst kategori olarak seçemez
      const subcategories = await Category.find({ parent: id });
      const subcategoryIds = subcategories.map(subcat => subcat._id.toString());
      
      if (subcategoryIds.includes(updateData.parent)) {
        return res.status(400).json({
          success: false,
          message: 'Bir kategori, alt kategorisini üst kategori olarak seçemez'
        });
      }
      
      // Üst kategori geçerli mi kontrol et
      const parentCategory = await Category.findById(updateData.parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Belirtilen üst kategori bulunamadı'
        });
      }
    }
    
    // Kategoriyi güncelle
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Kategori başarıyla güncellendi',
      data: updatedCategory
    });
  } catch (error) {
    logger.error(`Kategori güncellenirken hata: ${error.message}`, { categoryId: req.params.id, error });
    return res.status(500).json({
      success: false,
      message: 'Kategori güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Kategori sil
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kategori mevcut mu kontrol et
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }
    
    // Alt kategoriler var mı kontrol et
    const subcategories = await Category.find({ parent: id });
    if (subcategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu kategoriye bağlı alt kategoriler bulunmaktadır. Önce alt kategorileri silmelisiniz.'
      });
    }
    
    // Kategoriye ait ürünler var mı kontrol et
    const products = await Product.find({ category: id });
    if (products.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu kategoriye ait ürünler bulunmaktadır. Önce ürünleri başka bir kategoriye taşımalı veya silmelisiniz.'
      });
    }
    
    // Kategoriyi sil
    await Category.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: 'Kategori başarıyla silindi'
    });
  } catch (error) {
    logger.error(`Kategori silinirken hata: ${error.message}`, { categoryId: req.params.id, error });
    return res.status(500).json({
      success: false,
      message: 'Kategori silinirken bir hata oluştu',
      error: error.message
    });
  }
};