const { Cart, Wishlist } = require('../models/cart.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Sepet işlemleri
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price stock images');
    
    if (!cart) {
      // Sepet bulunamadıysa yeni bir sepet oluştur
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });
    }
    
    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    logger.error(`Sepet getirilirken hata: ${error.message}`, { userId: req.user.id, error });
    return res.status(500).json({
      success: false,
      message: 'Sepet bilgileri alınırken bir hata oluştu',
      error: error.message
    });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variants = [] } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Ürün ID\'si gereklidir'
      });
    }
    
    // Ürün kontrolü
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Yeterli stok bulunmamaktadır'
      });
    }
    
    // Sepeti bul veya oluştur
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: []
      });
    }
    
    // Ürün sepette var mı kontrol et
    const itemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId &&
      JSON.stringify(item.variants) === JSON.stringify(variants)
    );
    
    if (itemIndex > -1) {
      // Ürün zaten sepette, miktarı güncelle
      cart.items[itemIndex].quantity += quantity;
      cart.items[itemIndex].totalPrice = cart.items[itemIndex].price * cart.items[itemIndex].quantity;
    } else {
      // Sepete yeni ürün ekle
      const price = product.salePrice > 0 ? product.salePrice : product.price;
      cart.items.push({
        product: productId,
        name: product.name,
        quantity,
        price,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        variants,
        totalPrice: price * quantity
      });
    }
    
    await cart.save();
    
    return res.status(200).json({
      success: true,
      message: 'Ürün sepete eklendi',
      data: cart
    });
  } catch (error) {
    logger.error(`Sepete ürün eklenirken hata: ${error.message}`, { userId: req.user.id, error });
    return res.status(500).json({
      success: false,
      message: 'Ürün sepete eklenirken bir hata oluştu',
      error: error.message
    });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    
    if (!itemId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Ürün ID ve miktar gereklidir'
      });
    }
    
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Sepet bulunamadı'
      });
    }
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ürün sepette bulunamadı'
      });
    }
    
    // Stok kontrolü
    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Yeterli stok bulunmamaktadır'
      });
    }
    
    if (quantity <= 0) {
      // Ürünü sepetten kaldır
      cart.items.splice(itemIndex, 1);
    } else {
      // Miktarı güncelle
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].totalPrice = cart.items[itemIndex].price * quantity;
    }
    
    await cart.save();
    
    return res.status(200).json({
      success: true,
      message: 'Sepet güncellendi',
      data: cart
    });
  } catch (error) {
    logger.error(`Sepet güncellenirken hata: ${error.message}`, { userId: req.user.id, error });
    return res.status(500).json({
      success: false,
      message: 'Sepet güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Ürün ID\'si gereklidir'
      });
    }
    
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Sepet bulunamadı'
      });
    }
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ürün sepette bulunamadı'
      });
    }
    
    // Ürünü sepetten kaldır
    cart.items.splice(itemIndex, 1);
    await cart.save();
    
    return res.status(200).json({
      success: true,
      message: 'Ürün sepetten kaldırıldı',
      data: cart
    });
  } catch (error) {
    logger.error(`Sepetten ürün kaldırılırken hata: ${error.message}`, { userId: req.user.id, error });
    return res.status(500).json({
      success: false,
      message: 'Ürün sepetten kaldırılırken bir hata oluştu',
      error: error.message
    });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Sepet bulunamadı'
      });
    }
    
    cart.items = [];
    await cart.save();
    
    return res.status(200).json({
      success: true,
      message: 'Sepet temizlendi',
      data: cart
    });
  } catch (error) {
    logger.error(`Sepet temizlenirken hata: ${error.message}`, { userId: req.user.id, error });
    return res.status(500).json({
      success: false,
      message: 'Sepet temizlenirken bir hata oluştu',
      error: error.message
    });
  }
};

// İstek listesi işlemleri
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate('items.product', 'name price salePrice stock images');
    
    if (!wishlist) {
      // İstek listesi bulunamadıysa yeni bir liste oluştur
      wishlist = await Wishlist.create({
        user: req.user.id,
        items: []
      });
    }
    
    return res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    logger.error(`İstek listesi getirilirken hata: ${error.message}`, { userId: req.user.id, error });
    return res.status(500).json({
      success: false,
      message: 'İstek listesi alınırken bir hata oluştu',
      error: error.message
    });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Ürün ID\'si gereklidir'
      });
    }
    
    // Ürün kontrolü
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }
    
    // İstek listesini bul veya oluştur
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user.id,
        items: []
      });
    }
    
    // Ürün listede var mı kontrol et
    const itemExists = wishlist.items.some(item => item.product.toString() === productId);
    
    if (itemExists) {
      return res.status(400).json({
        success: false,
        message: 'Ürün zaten istek listenizde bulunuyor'
      });
    }
    
    // İstek listesine ekle
    wishlist.items.push({
      product: productId,
      addedAt: Date.now()
    });
    
    await wishlist.save();
    
    return res.status(200).json({
      success: true,
      message: 'Ürün istek listesine eklendi',
      data: wishlist
    });
  } catch (error) {
    logger.error(`İstek listesine ürün eklenirken hata: ${error.message}`, { userId: req.user.id, error });
    return res.status(500).json({
      success: false,
      message: 'Ürün istek listesine eklenirken bir hata oluştu',
      error: error.message
    });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Ürün ID\'si gereklidir'
      });
    }
    
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'İstek listesi bulunamadı'
      });
    }
    
    // Ürünü listeden kaldır
    const itemIndex = wishlist.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ürün istek listenizde bulunamadı'
      });
    }
    
    wishlist.items.splice(itemIndex, 1);
    await wishlist.save();
    
    return res.status(200).json({
      success: true,
      message: 'Ürün istek listesinden kaldırıldı',
      data: wishlist
    });
  } catch (error) {
    logger.error(`İstek listesinden ürün kaldırılırken hata: ${error.message}`, { userId: req.user.id, error });
    return res.status(500).json({
      success: false,
      message: 'Ürün istek listesinden kaldırılırken bir hata oluştu',
      error: error.message
    });
  }
};