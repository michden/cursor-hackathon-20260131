import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

/**
 * Terms of Service page component.
 * Displays the app's terms of service with i18n support.
 */
export default function TermsOfService() {
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
            {t('terms.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {t('terms.lastUpdated', { date: lastUpdated })}
          </p>
        </header>

        {/* Introduction */}
        <section className="mb-8">
          <p className="text-slate-600 dark:text-slate-300">
            {t('terms.intro')}
          </p>
        </section>

        {/* Service Description */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {t('terms.sections.service.title')}
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            {t('terms.sections.service.description')}
          </p>
        </section>

        {/* Medical Disclaimer */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {t('terms.sections.disclaimer.title')}
          </h2>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
            <p className="text-amber-800 dark:text-amber-200 font-medium mb-2">
              ⚠️ {t('terms.sections.disclaimer.important')}
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              {t('terms.sections.disclaimer.description')}
            </p>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">
            {t('terms.sections.disclaimer.warning')}
          </p>
        </section>

        {/* User Responsibilities */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {t('terms.sections.responsibilities.title')}
          </h2>
          <ul className="space-y-2 text-slate-600 dark:text-slate-300">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t('terms.sections.responsibilities.items.accuracy')}
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t('terms.sections.responsibilities.items.environment')}
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t('terms.sections.responsibilities.items.professional')}
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t('terms.sections.responsibilities.items.apiKey')}
            </li>
          </ul>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {t('terms.sections.liability.title')}
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            {t('terms.sections.liability.description')}
          </p>
        </section>

        {/* Changes to Terms */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {t('terms.sections.changes.title')}
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            {t('terms.sections.changes.description')}
          </p>
        </section>

        {/* Links */}
        <div className="mt-8 flex gap-4">
          <Link 
            to="/privacy" 
            className="text-sky-500 hover:text-sky-600 underline"
          >
            {t('footer.privacy')}
          </Link>
          <Link 
            to="/settings/data" 
            className="text-sky-500 hover:text-sky-600 underline"
          >
            {t('footer.data')}
          </Link>
        </div>
      </div>
    </div>
  )
}
