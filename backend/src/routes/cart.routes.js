const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const cartController = require('../controllers/cart.controller');

// Tüm cart işlemleri için authentication gerekli
router.use(protect);

// Sepet işlemleri
router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/update/:itemId', cartController.updateCartItem);
router.delete('/remove/:itemId', cartController.removeCartItem);
router.delete('/clear', cartController.clearCart);

// Sepeti önbelleğe alma
router.post('/save', cartController.saveCart);

// İstek listesi işlemleri
router.get('/wishlist', cartController.getWishlist);
router.post('/wishlist/add/:productId', cartController.addToWishlist);
router.delete('/wishlist/remove/:productId', cartController.removeFromWishlist);

module.exports = router;