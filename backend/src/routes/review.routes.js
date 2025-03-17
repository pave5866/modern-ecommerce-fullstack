const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const reviewController = require('../controllers/review.controller');

// Herkese açık rotalar
router.get('/product/:productId', reviewController.getProductReviews);

// Kullanıcı girişi gerektiren rotalar
router.use(protect);
router.post('/product/:productId', reviewController.createReview);
router.get('/my-reviews', reviewController.getMyReviews);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

// Admin rotaları
router.use(authorize('admin'));
router.get('/', reviewController.getAllReviews);
router.put('/:id/approve', reviewController.approveReview);
router.put('/:id/reject', reviewController.rejectReview);

module.exports = router;