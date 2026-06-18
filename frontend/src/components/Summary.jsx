export default function Summary({ total, count, date }) {
  const displayDate = date
    ? new Date(date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{displayDate}</p>
      <p className="text-4xl font-bold text-gray-900">
        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
      </p>
      <p className="text-sm text-gray-400 mt-1">
        {count === 0
          ? 'No expenses today'
          : `${count} expense${count !== 1 ? 's' : ''} today`}
      </p>
    </div>
  )
}
