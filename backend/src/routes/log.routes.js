const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const logController = require('../controllers/log.controller');

// Tüm log işlemleri için authentication ve admin yetkileri gerekli
router.use(protect);
router.use(authorize('admin'));

// Log rotaları
router.get('/', logController.getLogs);
router.post('/', logController.createLog);
router.delete('/clear', logController.clearLogs);

// Client logları için publice açık endpoint
router.post('/client', logController.logClientError);

module.exports = router;