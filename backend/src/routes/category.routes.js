const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const categoryController = require('../controllers/category.controller');

// Herkese açık rotalar
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategory);
router.get('/:slug/products', categoryController.getCategoryProducts);

// Koruma middleware'i - Yalnızca giriş yapan kullanıcılar
router.use(protect);

// Admin middleware'i - Yalnızca admin kullanıcılar
router.use(authorize('admin'));

// Admin rotaları
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;