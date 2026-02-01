import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

/**
 * Privacy Policy page component.
 * Displays the app's privacy policy with i18n support.
 * 
 * Note: File renamed from PrivacyPolicy.jsx to LegalInfo.jsx to avoid
 * being blocked by ad blockers that filter URLs containing "privacy".
 */
export default function LegalInfo() {
  const { t } = useTranslation('legal')
  const lastUpdated = new Date().toLocaleDateString()

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
            {t('privacy.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {t('privacy.lastUpdated', { date: lastUpdated })}
          </p>
        </header>

        {/* Introduction */}
        <section className="mb-8">
          <p className="text-slate-600 dark:text-slate-300">
            {t('privacy.intro')}
          </p>
        </section>

        {/* What Data We Collect */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {t('privacy.sections.dataCollection.title')}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            {t('privacy.sections.dataCollection.description')}
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-300">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t('privacy.sections.dataCollection.items.results')}
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t('privacy.sections.dataCollection.items.history')}
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t('privacy.sections.dataCollection.items.achievements')}
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t('privacy.sections.dataCollection.items.preferences')}
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t('privacy.sections.dataCollection.items.consent')}
            </li>
          </ul>
        </section>

        {/* How Data is Stored */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {t('privacy.sections.dataStorage.title')}
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            {t('privacy.sections.dataStorage.description')}
          </p>
        </section>

        {/* Third-Party Services */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {t('privacy.sections.thirdParty.title')}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-3">
            {t('privacy.sections.thirdParty.description')}
          </p>
          <a 
            href="https://openai.com/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sky-500 hover:text-sky-600 underline"
          >
            {t('privacy.sections.thirdParty.openaiLink')}
          </a>
        </section>

        {/* Your Rights */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {t('privacy.sections.rights.title')}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            {t('privacy.sections.rights.description')}
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-300">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              {t('privacy.sections.rights.access')}
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              {t('privacy.sections.rights.export')}
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              {t('privacy.sections.rights.delete')}
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              {t('privacy.sections.rights.withdraw')}
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {t('privacy.sections.contact.title')}
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            {t('privacy.sections.contact.description')}
          </p>
          <p className="text-slate-500 dark:text-slate-400 italic mt-2">
            [Contact email placeholder]
          </p>
        </section>

        {/* Manage Data Link */}
        <div className="mt-8 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-xl">
          <Link 
            to="/settings/data" 
            className="flex items-center justify-between text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium"
          >
            <span>{t('privacy.dataSettingsLink')}</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
