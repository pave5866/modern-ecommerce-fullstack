// Doğrudan react-hot-toast'u kullanıyoruz
import toast from 'react-hot-toast';
import logger from './logger';

// Toast özelleştirmelerini tanımla
export const showToast = {
  success: (message) =>
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
    }),
  error: (message) =>
    toast.error(message, {
      duration: 3000,
      position: 'top-right',
    }),
  info: (message) =>
    toast(message, {
      duration: 3000,
      position: 'top-right',
    }),
  warning: (message) =>
    toast(message, {
      duration: 3000,
      position: 'top-right',
      icon: '⚠️',
    }),
  loading: (message) =>
    toast.loading(message, {
      position: 'top-right',
    }),
};