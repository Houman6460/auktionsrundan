import React from 'react'

// Lightweight bar chart using CSS
// Props: data: Array<{ label: string, count: number }>
//        color?: string
export default function AnalyticsChart({ data, color = '#8B5E34' }) {
  const rows = Array.isArray(data) ? data : []
  const max = Math.max(0, ...rows.map(d => Number(d?.count) || 0))
  if (rows.length === 0 || max === 0) {
    return (
      <div className="w-full">
        <div className="h-48 md:h-64 flex items-center justify-center border-b border-neutral-200 px-2">
          <div className="text-sm text-neutral-500">No data yet.</div>
        </div>
      </div>
    )
  }
  return (
    <div className="w-full">
      <div
        className="h-48 md:h-64 flex items-end gap-2 border-b border-neutral-200 px-2"
        style={{ backgroundImage: 'repeating-linear-gradient(to top, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 1px, transparent 1px, transparent 24px)' }}
      >
        {rows.map((d, i) => (
          <div key={i} className="flex-1 h-full flex flex-col items-center justify-end">
            <div
              className="w-4 md:w-6 rounded-t"
              title={`${d.label}: ${d.count}`}
              style={{ height: `${Math.max(2, (((Number(d?.count) || 0)) / max) * 100)}%`, backgroundColor: color }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 grid" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0,1fr))` }}>
        {rows.map((d, i) => (
          <div key={i} className="text-[10px] md:text-xs text-neutral-600 text-center truncate" title={d.label}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}
