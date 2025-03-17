const express = require('express');
const router = express.Router();
const multer = require('multer');

// Dosya yükleme için bellekte geçici olarak sakla
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Tekli resim yükleme
router.post('/image', upload.single('image'), (req, res) => {
  res.status(201).json({ message: 'Resim yüklendi', url: 'https://example.com/image.jpg' });
});

// Çoklu resim yükleme
router.post('/images', upload.array('images', 10), (req, res) => {
  res.status(201).json({ 
    message: 'Çoklu resim yüklendi', 
    urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'] 
  });
});

// Base64 formatında resim yükleme
router.post('/base64', (req, res) => {
  res.status(201).json({ message: 'Base64 resim yüklendi', url: 'https://example.com/base64.jpg' });
});

// URL'den resim yükleme
router.post('/url', (req, res) => {
  res.status(201).json({ message: 'URL\'den resim yüklendi', url: 'https://example.com/fromurl.jpg' });
});

// Resim silme
router.delete('/image/:publicId', (req, res) => {
  res.status(200).json({ message: `${req.params.publicId} ID'li resim silindi` });
});

module.exports = router;