import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationTR from './locales/tr.json';
import translationEN from './locales/en.json';

// Mevcut dili tarayıcıdan veya yerel depolamadan alma
const savedLanguage = localStorage.getItem('language');
const browserLanguage = navigator.language.split('-')[0];
const defaultLanguage = savedLanguage || (browserLanguage === 'tr' ? 'tr' : 'en');

const resources = {
  en: {
    translation: translationEN,
  },
  tr: {
    translation: translationTR,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;