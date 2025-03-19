const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');

// Tüm kategorileri getir
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logger.error('Kategori listeleme hatası:', { error: error.message });
      return res.status(500).json({
        status: 'error',
        message: 'Kategoriler alınamadı',
        error: error.message
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        categories: data || []
      }
    });
  } catch (error) {
    logger.error('Kategori listeleme hatası:', { error: error.message });
    next(error);
  }
});

// Belirli bir kategoriyi getir
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Kategori getirme hatası:', { error: error.message, id });
      return res.status(error.code === 'PGRST116' ? 404 : 500).json({
        status: 'error',
        message: error.code === 'PGRST116' ? 'Kategori bulunamadı' : 'Kategori alınamadı',
        error: error.message
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        category: data
      }
    });
  } catch (error) {
    logger.error('Kategori getirme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

// Yeni kategori oluştur (sadece admin)
router.post('/', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { name, description, slug, parent_id, is_active } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Kategori adı gereklidir'
      });
    }

    const categoryData = {
      name,
      description,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      parent_id: parent_id || null,
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select();

    if (error) {
      logger.error('Kategori oluşturma hatası:', { error: error.message, category: categoryData });
      return res.status(500).json({
        status: 'error',
        message: 'Kategori oluşturulamadı',
        error: error.message
      });
    }

    logger.info('Yeni kategori oluşturuldu:', { category: data[0] });

    res.status(201).json({
      status: 'success',
      data: {
        category: data[0]
      }
    });
  } catch (error) {
    logger.error('Kategori oluşturma hatası:', { error: error.message });
    next(error);
  }
});

// Kategoriyi güncelle (sadece admin)
router.put('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, slug, parent_id, is_active } = req.body;

    const categoryData = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(slug && { slug }),
      ...(parent_id !== undefined && { parent_id }),
      ...(is_active !== undefined && { is_active }),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select();

    if (error) {
      logger.error('Kategori güncelleme hatası:', { error: error.message, id, category: categoryData });
      return res.status(500).json({
        status: 'error',
        message: 'Kategori güncellenemedi',
        error: error.message
      });
    }

    if (data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Kategori bulunamadı'
      });
    }

    logger.info('Kategori güncellendi:', { id, category: data[0] });

    res.status(200).json({
      status: 'success',
      data: {
        category: data[0]
      }
    });
  } catch (error) {
    logger.error('Kategori güncelleme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

// Kategoriyi sil (sadece admin)
router.delete('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // İlk olarak, bu kategoriye ait ürünleri kontrol et
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id);

    if (productsError) {
      logger.error('Kategori silme öncesi ürün kontrolü hatası:', { error: productsError.message, id });
      return res.status(500).json({
        status: 'error',
        message: 'Kategori silinemiyor: Ürünler kontrol edilemiyor',
        error: productsError.message
      });
    }

    // Eğer kategoriye bağlı ürünler varsa, silme işlemi yapma
    if (products && products.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Bu kategoriye bağlı ürünler var. Önce ürünleri silmeli veya başka bir kategoriye taşımalısınız.',
        data: {
          productCount: products.length
        }
      });
    }

    // Alt kategorileri kontrol et
    const { data: subCategories, error: subCategoriesError } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', id);

    if (subCategoriesError) {
      logger.error('Kategori silme öncesi alt kategori kontrolü hatası:', { error: subCategoriesError.message, id });
      return res.status(500).json({
        status: 'error',
        message: 'Kategori silinemiyor: Alt kategoriler kontrol edilemiyor',
        error: subCategoriesError.message
      });
    }

    // Eğer alt kategoriler varsa, silme işlemi yapma
    if (subCategories && subCategories.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Bu kategorinin alt kategorileri var. Önce alt kategorileri silmelisiniz.',
        data: {
          subCategoryCount: subCategories.length
        }
      });
    }

    // Kategoriyi sil
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Kategori silme hatası:', { error: error.message, id });
      return res.status(500).json({
        status: 'error',
        message: 'Kategori silinemedi',
        error: error.message
      });
    }

    logger.info('Kategori silindi:', { id });

    res.status(204).send();
  } catch (error) {
    logger.error('Kategori silme hatası:', { error: error.message, id: req.params.id });
    next(error);
  }
});

logger.info('category.routes.js başarıyla yüklendi');

module.exports = router;