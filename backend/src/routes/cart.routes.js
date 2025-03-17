const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

// Sepet işlemleri
router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/update/:itemId', cartController.updateCartItem);
router.delete('/remove/:itemId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);

// İstek listesi işlemleri
router.get('/wishlist', cartController.getWishlist);
router.post('/wishlist/add', cartController.addToWishlist);
router.delete('/wishlist/remove/:productId', cartController.removeFromWishlist);

module.exports = router;