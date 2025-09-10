import React from 'react'

// Lightweight chart using CSS/SVG
// Props:
// - data: Array<{ label: string, count: number }>
// - color?: string (brand brown default)
// - type?: 'bar' | 'line' | 'area'
export default function AnalyticsChart({ data, color = '#8B5E34', type = 'bar' }) {
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

  if (type === 'bar') {
    return (
      <div className="w-full">
        <div
          className="h-48 md:h-64 flex items-end gap-2 border-b border-neutral-200 px-2"
          style={{ backgroundImage: 'repeating-linear-gradient(to top, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 1px, transparent 1px, transparent 24px)' }}
        >
          {rows.map((d, i) => {
            const c = Number(d?.count) || 0
            const pct = max > 0 ? (c / max) * 100 : 0
            return (
              <div key={i} className="flex-1 h-full flex flex-col items-center justify-end">
                <div
                  className="w-4 md:w-6 rounded-t"
                  title={`${d.label}: ${c}`}
                  style={{ height: `${Math.max(2, pct)}%`, minHeight: 6, backgroundColor: color }}
                />
              </div>
            )
          })}
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

  // SVG-based line / area charts
  const H = 100
  const W = 100
  const topPad = 6
  const bottomPad = 8
  const usableH = H - topPad - bottomPad
  const step = rows.length > 1 ? W / (rows.length - 1) : 0
  const points = rows.map((d, i) => {
    const c = Number(d?.count) || 0
    const x = rows.length > 1 ? i * step : W / 2
    const y = H - bottomPad - (max > 0 ? (c / max) * usableH : 0)
    return { x, y, c, label: d.label }
  })
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')

  const bgStyle = { backgroundImage: 'repeating-linear-gradient(to top, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 1px, transparent 1px, transparent 24px)' }

  return (
    <div className="w-full">
      <div className="h-48 md:h-64 border-b border-neutral-200 px-2 flex items-end" style={bgStyle}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          {/* area fill */}
          {type === 'area' && (
            <path
              d={`M 0 ${H - bottomPad} ${path} L ${W} ${H - bottomPad} Z`}
              fill={hexToRgba(color, 0.2)}
              stroke="none"
            />
          )}
          {/* line */}
          <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* dots */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={1.4} fill={color} />
          ))}
        </svg>
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

function hexToRgba(hex, alpha = 1) {
  try {
    const c = hex.replace('#', '')
    const bigint = parseInt(c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } catch {
    return `rgba(139, 94, 52, ${alpha})` // fallback brand brown
  }
}
