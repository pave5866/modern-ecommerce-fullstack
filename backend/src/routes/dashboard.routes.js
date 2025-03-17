const express = require('express');
const router = express.Router();

// Örnek dashboard rotaları
router.get('/summary', (req, res) => {
  res.status(200).json({ message: 'Özet istatistikler' });
});

router.get('/sales', (req, res) => {
  res.status(200).json({ message: 'Satış istatistikleri' });
});

router.get('/products', (req, res) => {
  res.status(200).json({ message: 'Ürün istatistikleri' });
});

router.get('/users', (req, res) => {
  res.status(200).json({ message: 'Kullanıcı istatistikleri' });
});

router.get('/orders', (req, res) => {
  res.status(200).json({ message: 'Sipariş istatistikleri' });
});

router.get('/recent-orders', (req, res) => {
  res.status(200).json({ message: 'Son siparişler' });
});

router.get('/top-products', (req, res) => {
  res.status(200).json({ message: 'En çok satan ürünler' });
});

router.get('/top-customers', (req, res) => {
  res.status(200).json({ message: 'En çok alışveriş yapan müşteriler' });
});

module.exports = router;