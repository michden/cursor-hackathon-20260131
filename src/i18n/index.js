import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import English translations
import enCommon from './locales/en/common.json'
import enHome from './locales/en/home.json'
import enTests from './locales/en/tests.json'
import enResults from './locales/en/results.json'

// Import German translations
import deCommon from './locales/de/common.json'
import deHome from './locales/de/home.json'
import deTests from './locales/de/tests.json'
import deResults from './locales/de/results.json'

// Import Spanish translations
import esCommon from './locales/es/common.json'
import esHome from './locales/es/home.json'
import esTests from './locales/es/tests.json'
import esResults from './locales/es/results.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        home: enHome,
        tests: enTests,
        results: enResults,
      },
      de: {
        common: deCommon,
        home: deHome,
        tests: deTests,
        results: deResults,
      },
      es: {
        common: esCommon,
        home: esHome,
        tests: esTests,
        results: esResults,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'home', 'tests', 'results'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'visioncheck-language',
    },
  })

export default i18n
