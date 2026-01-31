import { useState, useCallback } from 'react'

const CONSENT_STORAGE_KEY = 'visioncheck-location-consent'

/**
 * FindDoctorButton component with GDPR-compliant location consent flow
 * 
 * Features:
 * - Shows consent dialog before requesting location (GDPR transparency)
 * - Location is used once and never stored
 * - Provides "Search without location" alternative
 * - Remembers consent preference
 */
export default function FindDoctorButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showConsentDialog, setShowConsentDialog] = useState(false)

  // Check if user has previously given consent
  const hasConsent = useCallback(() => {
    try {
      return localStorage.getItem(CONSENT_STORAGE_KEY) === 'granted'
    } catch {
      return false
    }
  }, [])

  // Save consent preference
  const saveConsent = useCallback((granted) => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, granted ? 'granted' : 'denied')
    } catch (e) {
      console.warn('Failed to save consent preference:', e)
    }
  }, [])

  // Clear consent (used when browser permission is denied after app consent was given)
  const clearConsent = useCallback(() => {
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY)
    } catch (e) {
      console.warn('Failed to clear consent preference:', e)
    }
  }, [])

  // Open Google search without location (fallback)
  const searchWithoutLocation = useCallback(() => {
    const query = encodeURIComponent('optometrist eye doctor near me')
    window.open(`https://www.google.com/search?q=${query}`, '_blank')
    setShowConsentDialog(false)
  }, [])

  // Request geolocation and open maps
  const requestLocationAndSearch = useCallback(async () => {
    setLoading(true)
    setError(null)
    setShowConsentDialog(false)

    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported')
      }

      // Get user's position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords

      // Open Google Maps search for optometrists
      const query = encodeURIComponent('optometrist eye doctor near me')
      const mapsUrl = `https://www.google.com/maps/search/${query}/@${latitude},${longitude},14z`
      
      window.open(mapsUrl, '_blank')

      // Save consent for future use
      saveConsent(true)

    } catch (err) {
      console.error('Location error:', err)
      
      if (err.code === 1) {
        // Permission denied by browser - clear app consent so user can try again
        // This ensures the consent dialog will show again on next click
        clearConsent()
        searchWithoutLocation()
      } else {
        setError('Could not get your location. Please try searching manually.')
      }
    } finally {
      setLoading(false)
    }
  }, [clearConsent, saveConsent, searchWithoutLocation])

  // Handle button click
  const handleClick = useCallback(() => {
    if (hasConsent()) {
      // Already has consent, proceed directly
      requestLocationAndSearch()
    } else {
      // Show consent dialog first
      setShowConsentDialog(true)
    }
  }, [hasConsent, requestLocationAndSearch])

  // Handle consent dialog actions
  const handleAllowLocation = useCallback(() => {
    // Don't save consent here - it will be saved in requestLocationAndSearch
    // only after successful geolocation. This prevents the bug where consent
    // is saved but the browser permission is then denied.
    requestLocationAndSearch()
  }, [requestLocationAndSearch])

  const handleDecline = useCallback(() => {
    saveConsent(false)
    searchWithoutLocation()
  }, [saveConsent, searchWithoutLocation])

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        aria-label="Find eye doctors near me"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Finding nearby doctors...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Find Eye Doctors Near Me
          </>
        )}
      </button>
      
      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
      )}

      {/* Consent Dialog */}
      {showConsentDialog && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowConsentDialog(false)}
            aria-hidden="true"
          />
          
          {/* Dialog */}
          <div 
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-2xl shadow-xl z-50 p-6"
            role="dialog"
            aria-labelledby="consent-dialog-title"
            aria-describedby="consent-dialog-description"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 id="consent-dialog-title" className="text-xl font-bold text-slate-800 mb-2">
                Find Eye Doctors Near You
              </h2>
              <p id="consent-dialog-description" className="text-slate-600">
                We'll use your location to show nearby eye care professionals on Google Maps.
              </p>
            </div>

            {/* Privacy Notice */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-slate-700">Your privacy is protected</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Your location is used once to open Google Maps and is never stored or sent to our servers.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAllowLocation}
                className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
              >
                Allow Location
              </button>
              <button
                onClick={handleDecline}
                className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Search Without Location
              </button>
              <button
                onClick={() => setShowConsentDialog(false)}
                className="w-full py-2 text-slate-500 font-medium hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
