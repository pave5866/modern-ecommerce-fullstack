const express = require('express');
const router = express.Router();

// Log rotaları
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Loglar listelendi' });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'Log oluşturuldu' });
});

router.delete('/clear', (req, res) => {
  res.status(200).json({ message: 'Loglar temizlendi' });
});

// Client logları için publice açık endpoint
router.post('/client', (req, res) => {
  res.status(201).json({ message: 'Client log kaydedildi' });
});

module.exports = router;