import React from 'react'

// Lightweight bar chart using CSS
// Props: data: Array<{ label: string, count: number }>
//        color?: string
export default function AnalyticsChart({ data, color = '#8B5E34' }) {
  const max = Math.max(1, ...data.map(d => d.count || 0))
  return (
    <div className="w-full">
      <div className="h-48 md:h-64 flex items-end gap-2 border-b border-neutral-200 px-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end">
            <div
              className="w-4 md:w-6 rounded-t"
              title={`${d.label}: ${d.count}`}
              style={{ height: `${(d.count / max) * 100}%`, background: color }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 grid" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0,1fr))` }}>
        {data.map((d, i) => (
          <div key={i} className="text-[10px] md:text-xs text-neutral-600 text-center truncate" title={d.label}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}
