// Bu dosya, react-toastify uyumluluğu için bir shim görevi görüyor
// Eğer herhangi bir dosya react-toastify'ı import etmeye çalışırsa, 
// aslında react-hot-toast'u kullanarak işlevi yerine getirecek

import toast from 'react-hot-toast';

// Toast komponentlerini taklit et
export const ToastContainer = () => null; // Boş bileşen

// react-toastify export'larını taklit et
export const Bounce = { DEFAULT: 'bounce' };
export const Flip = { DEFAULT: 'flip' };
export const Slide = { DEFAULT: 'slide' };
export const Zoom = { DEFAULT: 'zoom' };

// Ana toast fonksiyonu
export default {
  success: (message, options = {}) => toast.success(message, options),
  error: (message, options = {}) => toast.error(message, options),
  info: (message, options = {}) => toast.success(message, options),
  warn: (message, options = {}) => toast(message, { ...options, icon: '⚠️' }),
  loading: (message, options = {}) => toast.loading(message, options),
  dismiss: () => toast.dismiss(),
};

// Bireysel fonksiyonları da export et
export const { success, error, info, warn, loading, dismiss } = toast;