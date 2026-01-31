import { useNavigate } from 'react-router-dom'

export default function EyeSelector({ onSelect, completedEyes = {}, testName = 'Test' }) {
  const navigate = useNavigate()
  
  const bothComplete = completedEyes.left && completedEyes.right

  const handleViewResults = () => {
    navigate('/results')
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-800 text-center mb-6">
        Which eye would you like to test?
      </h2>
      
      <div className="flex gap-4 mb-6">
        {/* Left Eye */}
        <button
          onClick={() => onSelect('left')}
          className={`
            flex-1 p-6 rounded-2xl border-2 transition-all
            ${completedEyes.left 
              ? 'border-emerald-300 bg-emerald-50' 
              : 'border-slate-200 bg-white hover:border-sky-300'
            }
          `}
        >
          <div className="text-4xl mb-2">👁️</div>
          <div className="font-semibold text-slate-800">Left Eye</div>
          {completedEyes.left && (
            <div className="text-sm text-emerald-600 mt-1">
              ✓ Complete
            </div>
          )}
        </button>

        {/* Right Eye */}
        <button
          onClick={() => onSelect('right')}
          className={`
            flex-1 p-6 rounded-2xl border-2 transition-all
            ${completedEyes.right 
              ? 'border-emerald-300 bg-emerald-50' 
              : 'border-slate-200 bg-white hover:border-sky-300'
            }
          `}
        >
          <div className="text-4xl mb-2">👁️</div>
          <div className="font-semibold text-slate-800">Right Eye</div>
          {completedEyes.right && (
            <div className="text-sm text-emerald-600 mt-1">
              ✓ Complete
            </div>
          )}
        </button>
      </div>

      {/* Cover instruction */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800 text-center">
          <strong>Tip:</strong> Cover your other eye with your hand or an eye patch for accurate results.
        </p>
      </div>

      {/* View Results button if both done */}
      {bothComplete && (
        <button
          onClick={handleViewResults}
          className="w-full py-4 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors"
        >
          View Results →
        </button>
      )}
    </div>
  )
}
