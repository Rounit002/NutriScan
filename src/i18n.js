import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import hi from './locales/hi/translation.json';
import es from './locales/es/translation.json';
import de from './locales/de/translation.json';

const legacyLanguageMap = {
  English: 'en',
  Hindi: 'hi',
  Spanish: 'es',
  German: 'de',
};

if (typeof window !== 'undefined') {
  const savedLanguage = window.localStorage.getItem('fitscan_language');
  if (legacyLanguageMap[savedLanguage]) {
    window.localStorage.setItem('fitscan_language', legacyLanguageMap[savedLanguage]);
  }
}

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  es: { translation: es },
  de: { translation: de },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'es', 'de'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'fitscan_language',
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
