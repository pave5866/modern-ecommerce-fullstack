const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const dashboardController = require('../controllers/dashboard.controller');

// Tüm dashboard işlemleri için authentication ve admin yetkileri gerekli
router.use(protect);
router.use(authorize('admin'));

// Dashboard rotaları
router.get('/summary', dashboardController.getSummary);
router.get('/sales', dashboardController.getSalesStats);
router.get('/products', dashboardController.getProductStats);
router.get('/users', dashboardController.getUserStats);
router.get('/orders', dashboardController.getOrderStats);
router.get('/recent-orders', dashboardController.getRecentOrders);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/top-customers', dashboardController.getTopCustomers);

module.exports = router;