const express = require('express');
const router = express.Router();

// Herkese açık rotalar
router.get('/product/:productId', (req, res) => {
  res.status(200).json({ message: `${req.params.productId} ürününün değerlendirmeleri` });
});

// Kullanıcı rotaları
router.post('/product/:productId', (req, res) => {
  res.status(201).json({ message: `${req.params.productId} ürünü için değerlendirme oluşturuldu` });
});

router.get('/my-reviews', (req, res) => {
  res.status(200).json({ message: 'Kullanıcı değerlendirmeleri listelendi' });
});

router.put('/:id', (req, res) => {
  res.status(200).json({ message: `${req.params.id} değerlendirmesi güncellendi` });
});

router.delete('/:id', (req, res) => {
  res.status(200).json({ message: `${req.params.id} değerlendirmesi silindi` });
});

// Admin rotaları
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Tüm değerlendirmeler listelendi' });
});

router.put('/:id/approve', (req, res) => {
  res.status(200).json({ message: `${req.params.id} değerlendirmesi onaylandı` });
});

router.put('/:id/reject', (req, res) => {
  res.status(200).json({ message: `${req.params.id} değerlendirmesi reddedildi` });
});

module.exports = router;