import { toast } from 'react-toastify';
import logger from './logger';

// Toast mesajları için yardımcı modül
const showToast = {
  success: (message) => {
    toast.success(message);
    logger.info(`Başarı mesajı gösterildi: ${message}`);
  },
  
  error: (message) => {
    toast.error(message);
    logger.error(`Hata mesajı gösterildi: ${message}`);
  },
  
  info: (message) => {
    toast.info(message);
    logger.info(`Bilgi mesajı gösterildi: ${message}`);
  },
  
  warning: (message) => {
    toast.warning(message);
    logger.warn(`Uyarı mesajı gösterildi: ${message}`);
  }
};

// Global değişkene ata
window.showToast = showToast;

export default showToast;