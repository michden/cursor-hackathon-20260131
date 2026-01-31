import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SkipLink from '../components/SkipLink'
import AudioInstructions from '../components/AudioInstructions'
import ThemeToggle from '../components/ThemeToggle'
import LanguageSelector from '../components/LanguageSelector'
import { useTestResults } from '../context/TestResultsContext'
import { useLanguage } from '../context/LanguageContext'

export default function Home() {
  const { t } = useTranslation(['common', 'home'])
  const { language } = useLanguage()
  const { results } = useTestResults()

  const formatLastTested = (isoDate) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-800">
      <SkipLink targetId="test-options" />
      
      {/* Settings - Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      
      {/* Header */}
      <header className="pt-12 pb-8 px-6 text-center">
        <div className="text-6xl mb-4">👁️</div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('app.title')}</h1>
        <p className="text-slate-600 dark:text-slate-400">{t('app.subtitle')}</p>
        {results.completedAt && (
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
            {t('home:lastTested', { date: formatLastTested(results.completedAt) })}
          </p>
        )}
      </header>

      {/* Audio Instructions */}
      <div className="mx-6 mb-4">
        <AudioInstructions 
          audioKey="home-welcome" 
          label={t('audio.welcomeOverview')} 
        />
      </div>

      {/* Medical Disclaimer */}
      <div className="mx-6 mb-8 p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl">
        <div className="flex gap-3">
          <span className="text-amber-600 dark:text-amber-400 text-xl">⚠️</span>
          <div>
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">{t('disclaimer.title')}</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {t('disclaimer.text')}
            </p>
          </div>
        </div>
      </div>

      {/* Test Options */}
      <main id="test-options" className="px-6 space-y-4" role="main" aria-label="Eye health tests">
        <Link
          to="/visual-acuity"
          className="block p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          aria-label={`${t('home:tests.visualAcuity.title')} - ${t('home:tests.visualAcuity.description')}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-sky-100 dark:bg-sky-900/50 rounded-xl flex items-center justify-center text-2xl">
              📖
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('home:tests.visualAcuity.title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('home:tests.visualAcuity.description')}</p>
            </div>
            <div className="text-slate-400 dark:text-slate-500">→</div>
          </div>
        </Link>

        <Link
          to="/color-vision"
          className="block p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          aria-label={`${t('home:tests.colorVision.title')} - ${t('home:tests.colorVision.description')}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-2xl">
              🎨
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('home:tests.colorVision.title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('home:tests.colorVision.description')}</p>
            </div>
            <div className="text-slate-400 dark:text-slate-500">→</div>
          </div>
        </Link>

        <Link
          to="/contrast-sensitivity"
          className="block p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          aria-label={`${t('home:tests.contrastSensitivity.title')} - ${t('home:tests.contrastSensitivity.description')}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center text-2xl">
              🔆
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('home:tests.contrastSensitivity.title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('home:tests.contrastSensitivity.description')}</p>
            </div>
            <div className="text-slate-400 dark:text-slate-500">→</div>
          </div>
        </Link>

        <Link
          to="/amsler-grid"
          className="block p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          aria-label={`${t('home:tests.amslerGrid.title')} - ${t('home:tests.amslerGrid.description')}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center text-2xl">
              #
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('home:tests.amslerGrid.title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('home:tests.amslerGrid.description')}</p>
            </div>
            <div className="text-slate-400 dark:text-slate-500">→</div>
          </div>
        </Link>

        <Link
          to="/astigmatism"
          className="block p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          aria-label={`${t('home:tests.astigmatism.title')} - ${t('home:tests.astigmatism.description')}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/50 rounded-xl flex items-center justify-center text-2xl">
              ⊕
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('home:tests.astigmatism.title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('home:tests.astigmatism.description')}</p>
            </div>
            <div className="text-slate-400 dark:text-slate-500">→</div>
          </div>
        </Link>

        <Link
          to="/peripheral-vision"
          className="block p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          aria-label={`${t('home:tests.peripheralVision.title')} - ${t('home:tests.peripheralVision.description')}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-fuchsia-100 dark:bg-fuchsia-900/50 rounded-xl flex items-center justify-center text-2xl">
              👁️‍🗨️
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('home:tests.peripheralVision.title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('home:tests.peripheralVision.description')}</p>
            </div>
            <div className="text-slate-400 dark:text-slate-500">→</div>
          </div>
        </Link>

        <Link
          to="/eye-photo"
          className="block p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          aria-label={`${t('home:tests.eyePhoto.title')} - ${t('home:tests.eyePhoto.description')}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/50 rounded-xl flex items-center justify-center text-2xl">
              📸
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('home:tests.eyePhoto.title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('home:tests.eyePhoto.description')}</p>
            </div>
            <div className="text-slate-400 dark:text-slate-500">→</div>
          </div>
        </Link>

        <Link
          to="/results"
          className="block p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          aria-label={`${t('home:tests.viewResults.title')} - ${t('home:tests.viewResults.description')}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/50 rounded-xl flex items-center justify-center text-2xl">
              📋
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('home:tests.viewResults.title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('home:tests.viewResults.description')}</p>
            </div>
            <div className="text-slate-400 dark:text-slate-500">→</div>
          </div>
        </Link>
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-8 px-6 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-2">
            {t('home:footer.builtFor')}
          </p>
          <p className="text-xs text-slate-300 dark:text-slate-600">
            {t('home:footer.version')}
          </p>
        </div>
      </footer>
    </div>
  )
}
