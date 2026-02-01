import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import English translations
import enCommon from './locales/en/common.json'
import enHome from './locales/en/home.json'
import enTests from './locales/en/tests.json'
import enResults from './locales/en/results.json'
import enLegal from './locales/en/legal.json'

// Import German translations
import deCommon from './locales/de/common.json'
import deHome from './locales/de/home.json'
import deTests from './locales/de/tests.json'
import deResults from './locales/de/results.json'
import deLegal from './locales/de/legal.json'

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
        legal: enLegal,
      },
      de: {
        common: deCommon,
        home: deHome,
        tests: deTests,
        results: deResults,
        legal: deLegal,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'home', 'tests', 'results', 'legal'],
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
