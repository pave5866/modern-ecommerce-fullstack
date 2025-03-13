const app = require('./app');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    logger.info('MongoDB bağlantısı başarılı');
    logger.debug('Database URI:', { uri: process.env.MONGODB_URI });
    
    // Sunucuyu başlat
    app.listen(PORT, () => {
        logger.info(`Server ${PORT} portunda çalışıyor`);
        logger.info(`API: http://localhost:${PORT}`);
    });
})
.catch((err) => {
    logger.error('MongoDB bağlantı hatası:', { error: err.message });
    process.exit(1);
}); 