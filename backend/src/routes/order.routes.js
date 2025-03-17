const express = require('express');
const router = express.Router();

// Örnek rota tanımları
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Siparişler listelendi' });
});

router.get('/:id', (req, res) => {
  res.status(200).json({ message: `Sipariş detayı: ${req.params.id}` });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'Yeni sipariş oluşturuldu' });
});

router.put('/:id', (req, res) => {
  res.status(200).json({ message: `Sipariş güncellendi: ${req.params.id}` });
});

router.delete('/:id', (req, res) => {
  res.status(200).json({ message: `Sipariş silindi: ${req.params.id}` });
});

module.exports = router;