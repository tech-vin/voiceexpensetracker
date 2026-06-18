const CATEGORY_STYLES = {
  Food:      'bg-orange-100 text-orange-700',
  Grocery:   'bg-green-100 text-green-700',
  Fuel:      'bg-red-100 text-red-700',
  Transport: 'bg-blue-100 text-blue-700',
  Health:    'bg-pink-100 text-pink-700',
  Bills:     'bg-purple-100 text-purple-700',
  Shopping:  'bg-yellow-100 text-yellow-700',
  Other:     'bg-gray-100 text-gray-500',
}

const CATEGORY_EMOJI = {
  Food: '🍽', Grocery: '🛒', Fuel: '⛽', Transport: '🚌',
  Health: '💊', Bills: '📄', Shopping: '🛍', Other: '📌',
}

function formatTime(iso) {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ExpenseList({ expenses, onDelete }) {
  const list = Array.isArray(expenses) ? expenses : []
  if (list.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-5xl mb-3">🎙</div>
        <p className="text-sm">No expenses yet.</p>
        <p className="text-xs mt-1">Hold the mic button and speak an expense.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Recent Expenses
      </h2>
      <ul className="space-y-2">
        {list.map((expense) => {
          const catStyle = CATEGORY_STYLES[expense.category] ?? CATEGORY_STYLES.Other
          const catEmoji = CATEGORY_EMOJI[expense.category] ?? '📌'
          return (
            <li
              key={expense.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex items-center gap-3"
            >
              <span className="text-xl shrink-0">{catEmoji}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800 truncate">{expense.item}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catStyle}`}>
                    {expense.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  {expense.person !== 'Self' && (
                    <span className="text-indigo-500 font-medium">{expense.person}</span>
                  )}
                  <span>{formatTime(expense.timestamp)}</span>
                </div>
                {expense.transcript && (
                  <p className="text-xs text-gray-300 italic mt-0.5 truncate">
                    "{expense.transcript}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-lg font-bold text-gray-800">
                  ₹{expense.amount.toLocaleString('en-IN')}
                </span>
                <button
                  onClick={() => onDelete(expense.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none"
                  aria-label="Delete expense"
                >
                  ×
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
