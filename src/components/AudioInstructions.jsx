import { useState, useEffect, useRef, useCallback } from 'react'
import { useTTSSettings } from '../context/TTSSettingsContext'
import { useLanguage } from '../context/LanguageContext'
import { useTranslation } from 'react-i18next'

/**
 * AudioInstructions component for text-to-speech accessibility
 * 
 * Features:
 * - Auto-plays audio on mount if autoPlayEnabled setting is true
 * - Play/pause button for manual control
 * - Toggle to enable/disable auto-play
 * - Visual feedback for playing state
 * - Language-aware audio paths with fallback to English
 * 
 * @param {string} audioKey - Key/filename for the audio file (without path prefix or extension)
 * @param {string} audioSrc - (Legacy) Direct path to audio file - deprecated, use audioKey instead
 * @param {string} label - Accessibility label describing the audio content
 */
export default function AudioInstructions({ audioKey, audioSrc, label = 'Instructions' }) {
  const { autoPlayEnabled, setAutoPlayEnabled } = useTTSSettings()
  const { language } = useLanguage()
  const { t } = useTranslation()
  
  // Build language-aware audio path
  // If audioKey is provided, build path from it; otherwise use legacy audioSrc
  const getAudioPath = useCallback(() => {
    if (audioKey) {
      return `/audio/${language}/${audioKey}.mp3`
    }
    // Legacy support: if audioSrc is a direct path, try to make it language-aware
    if (audioSrc) {
      // Check if it already has a language prefix
      if (audioSrc.match(/\/audio\/(en|de)\//)) {
        // Replace the language part
        return audioSrc.replace(/\/audio\/(en|de)\//, `/audio/${language}/`)
      }
      // If it's the old format like /audio/home-welcome.mp3, add language
      if (audioSrc.startsWith('/audio/')) {
        const filename = audioSrc.replace('/audio/', '')
        return `/audio/${language}/${filename}`
      }
      return audioSrc
    }
    return null
  }, [audioKey, audioSrc, language])
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentAudioSrc, setCurrentAudioSrc] = useState(null)
  const audioRef = useRef(null)
  
  // Update audio source when language changes
  useEffect(() => {
    const path = getAudioPath()
    setCurrentAudioSrc(path)
    setHasAutoPlayed(false) // Reset auto-play when language changes
  }, [getAudioPath])

  // Handle audio end
  const handleEnded = useCallback(() => {
    setIsPlaying(false)
  }, [])

  // Handle audio error - try fallback to English if current language file fails
  const handleError = useCallback((e) => {
    console.warn('Audio playback error:', e)
    setIsPlaying(false)
    
    // Try fallback to English if not already using English
    if (language !== 'en' && currentAudioSrc && !currentAudioSrc.includes('/audio/en/')) {
      const englishPath = currentAudioSrc.replace(`/audio/${language}/`, '/audio/en/')
      console.log('Falling back to English audio:', englishPath)
      setCurrentAudioSrc(englishPath)
    }
  }, [language, currentAudioSrc])

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlayEnabled && !hasAutoPlayed && audioRef.current) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        audioRef.current?.play()
          .then(() => {
            setIsPlaying(true)
            setHasAutoPlayed(true)
          })
          .catch((e) => {
            // Auto-play might be blocked by browser
            console.warn('Auto-play blocked:', e)
            setHasAutoPlayed(true)
          })
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [autoPlayEnabled, hasAutoPlayed])

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [])

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Playback failed:', e))
    }
  }, [isPlaying])

  const handleToggleAutoPlay = useCallback(() => {
    setAutoPlayEnabled(!autoPlayEnabled)
  }, [autoPlayEnabled, setAutoPlayEnabled])

  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-3 mb-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentAudioSrc}
        onEnded={handleEnded}
        onError={handleError}
        preload="auto"
      />

      {/* Play/Pause button */}
      <button
        onClick={togglePlayPause}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center
          transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-900
          ${isPlaying 
            ? 'bg-sky-500 text-white hover:bg-sky-600' 
            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
          }
        `}
        aria-label={isPlaying ? 'Pause instructions' : 'Play instructions'}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Label and status */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
          {isPlaying ? `${t('audio.playing')}: ${label}` : `${t('audio.listen')}: ${label}`}
        </p>
        {isPlaying && (
          <div className="flex items-center gap-1 mt-1">
            <span className="w-1 h-3 bg-sky-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-sky-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-2 bg-sky-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-1 h-4 bg-sky-500 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
            <span className="w-1 h-3 bg-sky-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
          </div>
        )}
      </div>

      {/* Settings toggle */}
      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Audio settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Settings dropdown */}
        {showSettings && (
          <>
            {/* Backdrop to close dropdown */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowSettings(false)}
            />
            
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-3 z-20">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-700 dark:text-slate-200">{t('audio.autoPlay')}</span>
                <button
                  role="switch"
                  aria-checked={autoPlayEnabled}
                  onClick={handleToggleAutoPlay}
                  className={`
                    relative w-11 h-6 rounded-full transition-colors
                    ${autoPlayEnabled ? 'bg-sky-500' : 'bg-slate-300'}
                  `}
                >
                  <span
                    className={`
                      absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                      ${autoPlayEnabled ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {t('audio.autoPlayDescription')}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
