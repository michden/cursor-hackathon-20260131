import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
]

/**
 * LanguageSelector - Dropdown for selecting app language
 * 
 * Features:
 * - Flag icons for each language
 * - Keyboard accessible
 * - Click outside to close
 */
export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleSelect = (langCode) => {
    setLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 flex items-center gap-1"
        aria-label={t('language.select')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <svg 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50"
          role="menu"
        >
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`
                  w-full px-3 py-2 text-left flex items-center gap-2 text-sm
                  hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors
                  ${isSelected 
                    ? 'text-sky-600 dark:text-sky-400 font-medium' 
                    : 'text-slate-700 dark:text-slate-300'
                  }
                `}
                role="menuitem"
              >
                <span className="text-lg">{lang.flag}</span>
                {lang.label}
                {isSelected && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
