const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, restrictTo } = require('../middlewares/auth');
const logger = require('../utils/logger');
const Category = require('../models/category.model');

// Controller yerine doğrudan rota içinde işlemleri yapıyoruz (basitlik için)
// Gerçek projede bu işlemleri controller'a taşımak daha iyi olur

// Tüm kategorileri getir
router.get('/', async (req, res) => {
  try {
    logger.info('Tüm kategoriler istendi');
    const categories = await Category.find({ isActive: true })
      .select('name slug description image')
      .sort('name');

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    logger.error(`Kategori listeleme hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Kategoriler getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

// ID ile kategori getir
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error(`Kategori getirme hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Kategori getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

// Slug ile kategori getir
router.get('/slug/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error(`Slug ile kategori getirme hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Kategori getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

// Yeni kategori ekle (sadece admin)
router.post(
  '/',
  protect,
  restrictTo('admin'),
  [
    body('name').notEmpty().withMessage('Kategori adı zorunludur'),
    body('description').optional()
  ],
  async (req, res) => {
    try {
      const { name, description, image, parent } = req.body;
      
      // Aynı isimde kategori var mı kontrol et
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Bu isimde bir kategori zaten mevcut'
        });
      }
      
      const category = await Category.create({
        name,
        description,
        image,
        parent: parent || null
      });
      
      logger.info(`Yeni kategori oluşturuldu: ${name}`);
      res.status(201).json({
        success: true,
        data: category
      });
    } catch (error) {
      logger.error(`Kategori oluşturma hatası: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Kategori oluşturulurken bir hata oluştu',
        error: error.message
      });
    }
  }
);

// Kategori güncelle (sadece admin)
router.put(
  '/:id',
  protect,
  restrictTo('admin'),
  async (req, res) => {
    try {
      const { name, description, image, parent, isActive } = req.body;
      
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Kategori bulunamadı'
        });
      }
      
      // Eğer isim değişiyorsa, aynı isimde başka kategori olmadığını kontrol et
      if (name && name !== category.name) {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
          return res.status(400).json({
            success: false,
            message: 'Bu isimde bir kategori zaten mevcut'
          });
        }
      }
      
      // Güncellenecek alanları belirle
      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (image) updateData.image = image;
      if (parent) updateData.parent = parent;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
      
      logger.info(`Kategori güncellendi: ${updatedCategory.name}`);
      res.status(200).json({
        success: true,
        data: updatedCategory
      });
    } catch (error) {
      logger.error(`Kategori güncelleme hatası: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Kategori güncellenirken bir hata oluştu',
        error: error.message
      });
    }
  }
);

// Kategori sil (sadece admin)
router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Kategori bulunamadı'
        });
      }
      
      // Alt kategorileri kontrol et
      const children = await Category.find({ parent: req.params.id });
      if (children.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu kategoriye ait alt kategoriler bulunmaktadır. Önce onları silmelisiniz.'
        });
      }
      
      await Category.findByIdAndDelete(req.params.id);
      
      logger.info(`Kategori silindi: ${category.name}`);
      res.status(200).json({
        success: true,
        message: 'Kategori başarıyla silindi'
      });
    } catch (error) {
      logger.error(`Kategori silme hatası: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Kategori silinirken bir hata oluştu',
        error: error.message
      });
    }
  }
);

// Kategori isimlerini getir (liste olarak) - ön yüz için
router.get('/list/names', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name')
      .sort('name');
    
    const categoryNames = categories.map(cat => cat.name);
    
    res.status(200).json({
      success: true,
      data: categoryNames
    });
  } catch (error) {
    logger.error(`Kategori isimleri listeleme hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Kategori isimleri getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

module.exports = router; 