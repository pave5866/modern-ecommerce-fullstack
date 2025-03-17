import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Dil dosyaları
import trTranslation from './locales/tr.json';
import enTranslation from './locales/en.json';

// i18next konfigürasyonu
i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: {
        translation: trTranslation
      },
      en: {
        translation: enTranslation
      }
    },
    lng: localStorage.getItem('language') || 'tr', // Varsayılan dil
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false // React zaten XSS koruması sağlıyor
    }
  });

export default i18n;