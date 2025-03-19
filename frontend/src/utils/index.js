// Toast mesajları için yardımcı fonksiyon
export const showToast = {
  success: (message) => {
    if (window.toast) {
      window.toast.success(message);
    } else {
      console.log('Success:', message);
    }
  },
  error: (message) => {
    if (window.toast) {
      window.toast.error(message);
    } else {
      console.error('Error:', message);
    }
  },
  info: (message) => {
    if (window.toast) {
      window.toast.info(message);
    } else {
      console.info('Info:', message);
    }
  },
  warning: (message) => {
    if (window.toast) {
      window.toast.warning(message);
    } else {
      console.warn('Warning:', message);
    }
  },
};

// Tarih biçimlendirmesi için yardımcı fonksiyon
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

// Fiyat biçimlendirmesi için yardımcı fonksiyon
export const formatPrice = (price) => {
  if (price === null || price === undefined) return '₺0,00';
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
};

// Kırpma işlemi için yardımcı fonksiyon
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + '...';
};

// Slug oluşturma için yardımcı fonksiyon
export const slugify = (text) => {
  if (!text) return '';
  
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// Form hatalarını işleme
export const handleFormErrors = (error) => {
  if (!error) return null;
  
  if (error.response?.data?.errors) {
    return error.response.data.errors;
  }
  
  if (error.response?.data?.message) {
    return { general: error.response.data.message };
  }
  
  return { general: error.message || 'Bir hata oluştu' };
};

// URL parametrelerini alma
export const getQueryParams = () => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  return Object.fromEntries(urlSearchParams.entries());
};

// Yerel depolama işlemleri
export const storage = {
  get: (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },
};