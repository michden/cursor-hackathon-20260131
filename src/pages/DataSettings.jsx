import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useConsent } from '../context/ConsentContext'

// All visioncheck localStorage keys
const STORAGE_KEYS = [
  'visioncheck-results',
  'visioncheck-history',
  'visioncheck-achievements',
  'visioncheck-onboarded',
  'visioncheck-language',
  'visioncheck-theme',
  'visioncheck-tts-settings',
  'visioncheck-voice-enabled',
  'visioncheck-location-consent',
  'visioncheck-consent'
]

/**
 * Get all stored data from localStorage
 */
function getAllStoredData() {
  const data = {}
  STORAGE_KEYS.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      if (value) {
        data[key] = JSON.parse(value)
      }
    } catch {
      const value = localStorage.getItem(key)
      if (value) {
        data[key] = value
      }
    }
  })
  return data
}

/**
 * Delete all visioncheck data from localStorage
 */
function deleteAllData() {
  STORAGE_KEYS.forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.warn(`Failed to remove ${key}:`, e)
    }
  })
}

/**
 * Data Settings page component.
 * Allows users to view, export, and delete their data.
 */
export default function DataSettings() {
  const { t } = useTranslation('legal')
  const { consentGiven, giveConsent, revokeConsent } = useConsent()
  const [expandedSection, setExpandedSection] = useState(null)
  const [storedData, setStoredData] = useState(() => getAllStoredData())

  const refreshData = () => {
    setStoredData(getAllStoredData())
  }

  const handleExport = () => {
    const data = getAllStoredData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `visioncheck-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDeleteAll = () => {
    if (confirm(t('dataSettings.sections.deleteData.confirm'))) {
      deleteAllData()
      refreshData()
      alert(t('dataSettings.sections.deleteData.success'))
    }
  }

  const handleRevokeConsent = () => {
    if (confirm(t('dataSettings.sections.deleteData.confirm'))) {
      revokeConsent()
      refreshData()
    }
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const hasData = Object.keys(storedData).length > 0

  // Format data for display
  const formatValue = (value) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-sky-500 hover:text-sky-600 mb-4"
          >
            <span className="mr-2">←</span> {t('dataSettings.backHome')}
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {t('dataSettings.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {t('dataSettings.description')}
          </p>
        </header>

        {/* Consent Status */}
        <section className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {t('dataSettings.sections.consent.title')}
          </h2>
          
          {consentGiven ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                <span className="text-slate-600 dark:text-slate-300">
                  {t('dataSettings.sections.consent.granted')}
                </span>
              </div>
              <button
                onClick={handleRevokeConsent}
                className="px-4 py-2 text-red-500 hover:text-red-600 text-sm font-medium"
              >
                {t('dataSettings.sections.consent.revokeButton')}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-amber-500 rounded-full mr-3"></span>
                <span className="text-slate-600 dark:text-slate-300">
                  {t('dataSettings.sections.consent.denied')}
                </span>
              </div>
              <button
                onClick={giveConsent}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg"
              >
                {t('dataSettings.sections.consent.grantButton')}
              </button>
            </div>
          )}
        </section>

        {/* View Data */}
        <section className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {t('dataSettings.sections.viewData.title')}
          </h2>
          
          {!hasData ? (
            <p className="text-slate-500 dark:text-slate-400 italic">
              {t('dataSettings.sections.viewData.noData')}
            </p>
          ) : (
            <div className="space-y-2">
              {/* Results */}
              {storedData['visioncheck-results'] && (
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('results')}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-left"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {t('dataSettings.sections.viewData.categories.results')}
                    </span>
                    <span>{expandedSection === 'results' ? '▲' : '▼'}</span>
                  </button>
                  {expandedSection === 'results' && (
                    <pre className="p-3 text-xs text-slate-600 dark:text-slate-300 overflow-x-auto bg-slate-50 dark:bg-slate-900">
                      {formatValue(storedData['visioncheck-results'])}
                    </pre>
                  )}
                </div>
              )}

              {/* History */}
              {storedData['visioncheck-history'] && (
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('history')}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-left"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {t('dataSettings.sections.viewData.categories.history')} ({storedData['visioncheck-history'].length || 0})
                    </span>
                    <span>{expandedSection === 'history' ? '▲' : '▼'}</span>
                  </button>
                  {expandedSection === 'history' && (
                    <pre className="p-3 text-xs text-slate-600 dark:text-slate-300 overflow-x-auto bg-slate-50 dark:bg-slate-900 max-h-64 overflow-y-auto">
                      {formatValue(storedData['visioncheck-history'])}
                    </pre>
                  )}
                </div>
              )}

              {/* Achievements */}
              {storedData['visioncheck-achievements'] && (
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('achievements')}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-left"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {t('dataSettings.sections.viewData.categories.achievements')}
                    </span>
                    <span>{expandedSection === 'achievements' ? '▲' : '▼'}</span>
                  </button>
                  {expandedSection === 'achievements' && (
                    <pre className="p-3 text-xs text-slate-600 dark:text-slate-300 overflow-x-auto bg-slate-50 dark:bg-slate-900">
                      {formatValue(storedData['visioncheck-achievements'])}
                    </pre>
                  )}
                </div>
              )}

              {/* Preferences */}
              <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('preferences')}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-left"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {t('dataSettings.sections.viewData.categories.preferences')}
                  </span>
                  <span>{expandedSection === 'preferences' ? '▲' : '▼'}</span>
                </button>
                {expandedSection === 'preferences' && (
                  <div className="p-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 space-y-1">
                    {storedData['visioncheck-theme'] && (
                      <p><strong>Theme:</strong> {storedData['visioncheck-theme']}</p>
                    )}
                    {storedData['visioncheck-language'] && (
                      <p><strong>Language:</strong> {storedData['visioncheck-language']}</p>
                    )}
                    {storedData['visioncheck-tts-settings'] && (
                      <p><strong>TTS Settings:</strong> {formatValue(storedData['visioncheck-tts-settings'])}</p>
                    )}
                    {storedData['visioncheck-voice-enabled'] !== undefined && (
                      <p><strong>Voice Enabled:</strong> {String(storedData['visioncheck-voice-enabled'])}</p>
                    )}
                    {storedData['visioncheck-onboarded'] !== undefined && (
                      <p><strong>Onboarded:</strong> {String(storedData['visioncheck-onboarded'])}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Export Data */}
        <section className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
            {t('dataSettings.sections.exportData.title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            {t('dataSettings.sections.exportData.description')}
          </p>
          <button
            onClick={handleExport}
            disabled={!hasData}
            className="w-full py-3 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('dataSettings.sections.exportData.button')}
          </button>
        </section>

        {/* Delete All Data */}
        <section className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-800">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            {t('dataSettings.sections.deleteData.title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            {t('dataSettings.sections.deleteData.description')}
          </p>
          <button
            onClick={handleDeleteAll}
            disabled={!hasData}
            className="w-full py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('dataSettings.sections.deleteData.button')}
          </button>
        </section>

        {/* Footer Links */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link 
            to="/privacy" 
            className="text-sky-500 hover:text-sky-600 underline"
          >
            {t('footer.privacy')}
          </Link>
          <Link 
            to="/terms" 
            className="text-sky-500 hover:text-sky-600 underline"
          >
            {t('footer.terms')}
          </Link>
        </div>
      </div>
    </div>
  )
}
