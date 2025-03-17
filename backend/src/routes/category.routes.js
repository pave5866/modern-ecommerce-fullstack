const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

// Genel kategori rotaları
router.get('/', categoryController.getAllCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Admin kategori rotaları (yetkilendirme şimdilik devre dışı)
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;