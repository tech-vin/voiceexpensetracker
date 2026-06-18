import { useState, useEffect, useCallback } from 'react'
import MicButton from './components/MicButton'
import ExpenseList from './components/ExpenseList'
import Summary from './components/Summary'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const STATUS = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
}

export default function App() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState({ total: 0, count: 0 })
  const [status, setStatus] = useState(STATUS.IDLE)
  const [lastTranscript, setLastTranscript] = useState('')
  const [lastExpense, setLastExpense] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const fetchAll = useCallback(async () => {
    try {
      const [expRes, sumRes] = await Promise.all([
        fetch(`${API}/expenses`),
        fetch(`${API}/summary`),
      ])
      setExpenses(await expRes.json())
      setSummary(await sumRes.json())
    } catch {
      /* backend not yet started — silent fail */
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleTranscript = useCallback(async (text) => {
    setLastTranscript(text)
    setStatus(STATUS.PROCESSING)
    setLastExpense(null)

    try {
      const res = await fetch(`${API}/voice-expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })

      if (!res.ok) {
        const err = await res.json()
        setErrorMsg(err.detail ?? 'Could not parse expense.')
        setStatus(STATUS.ERROR)
      } else {
        const data = await res.json()
        setLastExpense(data.expense)
        setStatus(STATUS.SUCCESS)
        await fetchAll()
      }
    } catch {
      setErrorMsg('Cannot reach server. Is the backend running?')
      setStatus(STATUS.ERROR)
    } finally {
      setTimeout(() => setStatus(STATUS.IDLE), 3500)
    }
  }, [fetchAll])

  const handleNoResult = useCallback(() => {
    setErrorMsg("Didn't catch that — try speaking more clearly.")
    setStatus(STATUS.ERROR)
    setTimeout(() => setStatus(STATUS.IDLE), 3000)
  }, [])

  const handleDelete = useCallback(async (id) => {
    await fetch(`${API}/expenses/${id}`, { method: 'DELETE' })
    await fetchAll()
  }, [fetchAll])

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">

        {/* Header */}
        <h1 className="text-xl font-bold text-gray-700 text-center mb-5">
          Voice Expense Tracker
        </h1>

        {/* Today's summary */}
        <Summary total={summary.total} count={summary.count} />

        {/* Microphone */}
        <div className="flex flex-col items-center my-12">
          <MicButton
            onTranscript={handleTranscript}
            onNoResult={handleNoResult}
            disabled={status === STATUS.PROCESSING}
          />

          {/* Status feedback */}
          <div className="mt-14 min-h-[64px] flex flex-col items-center justify-center gap-1">
            {status === STATUS.PROCESSING && (
              <>
                <div className="flex items-center gap-2 text-amber-500">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  <span className="text-sm font-medium">Processing…</span>
                </div>
                {lastTranscript && (
                  <p className="text-xs text-gray-400 italic text-center max-w-xs">
                    "{lastTranscript}"
                  </p>
                )}
              </>
            )}

            {status === STATUS.SUCCESS && lastExpense && (
              <div className="text-center">
                <p className="text-green-500 font-semibold text-sm">✓ Expense added</p>
                <p className="text-gray-700 text-sm font-medium mt-0.5">
                  {lastExpense.item} · ₹{lastExpense.amount}
                </p>
                {lastTranscript && (
                  <p className="text-xs text-gray-400 italic mt-0.5">"{lastTranscript}"</p>
                )}
              </div>
            )}

            {status === STATUS.ERROR && (
              <div className="text-center">
                <p className="text-red-500 font-semibold text-sm">⚠ {errorMsg}</p>
              </div>
            )}

            {status === STATUS.IDLE && lastTranscript && (
              <p className="text-xs text-gray-400 italic text-center max-w-xs">
                "{lastTranscript}"
              </p>
            )}
          </div>
        </div>

        {/* Expense list */}
        <ExpenseList expenses={expenses} onDelete={handleDelete} />
      </div>
    </div>
  )
}
