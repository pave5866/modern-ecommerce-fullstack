const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');

// Örnek ürünler için
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ürünler başarıyla getirildi',
    data: [
      {
        id: 1,
        name: 'Örnek Ürün 1',
        price: 99.99,
        description: 'Bu bir örnek ürün açıklamasıdır.',
        image: 'https://via.placeholder.com/300',
        category: 'Elektronik'
      },
      {
        id: 2,
        name: 'Örnek Ürün 2',
        price: 149.99,
        description: 'Bu bir başka örnek ürün açıklamasıdır.',
        image: 'https://via.placeholder.com/300',
        category: 'Giyim'
      }
    ]
  });
});

// Tek bir ürünü getir
router.get('/:id', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ürün başarıyla getirildi',
    data: {
      id: req.params.id,
      name: 'Örnek Ürün',
      price: 99.99,
      description: 'Bu bir örnek ürün açıklamasıdır.',
      image: 'https://via.placeholder.com/300',
      category: 'Elektronik'
    }
  });
});

// Yeni ürün ekle (admin yetkisi gerekli)
router.post('/', protect, authorize('admin'), (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Ürün başarıyla eklendi',
    data: {
      id: 3,
      ...req.body
    }
  });
});

// Ürün güncelle (admin yetkisi gerekli)
router.put('/:id', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ürün başarıyla güncellendi',
    data: {
      id: req.params.id,
      ...req.body
    }
  });
});

// Ürün sil (admin yetkisi gerekli)
router.delete('/:id', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ürün başarıyla silindi',
    data: {}
  });
});

module.exports = router;