const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const orderController = require('../controllers/order.controller');

// Kullanıcı rotaları - Kullanıcının kendi siparişleri
router.use(protect);
router.get('/my-orders', orderController.getMyOrders);
router.get('/my-orders/:id', orderController.getMyOrder);
router.post('/', orderController.createOrder);
router.post('/verify-payment', orderController.verifyPayment);
router.put('/cancel/:id', orderController.cancelOrder);

// Admin rotaları
router.use(authorize('admin'));
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrder);
router.put('/:id', orderController.updateOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;