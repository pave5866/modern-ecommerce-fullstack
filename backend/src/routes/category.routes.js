const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Genel kategori rotaları
router.get('/', categoryController.getAllCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Admin kategori rotaları (yetkilendirme gerekir)
router.post('/', protect, admin, categoryController.createCategory);
router.put('/:id', protect, admin, categoryController.updateCategory);
router.delete('/:id', protect, admin, categoryController.deleteCategory);

module.exports = router;