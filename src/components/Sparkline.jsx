import React from 'react'

// Tiny inline sparkline using SVG
// Props: points: number[] (chronological), color?: string, height?: number
export default function Sparkline({ points = [], color = '#8B5E34', height = 28 }) {
  const h = height
  const w = Math.max(40, points.length * 6)
  const max = Math.max(1, ...points)
  const min = 0
  const normY = (v) => h - ((v - min) / (max - min)) * h
  const stepX = points.length > 1 ? w / (points.length - 1) : w
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX},${normY(v)}`).join(' ')
  const last = points[points.length - 1] || 0
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <path d={d || `M0,${h} L${w},${h}`} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx={(points.length - 1) * stepX} cy={normY(last)} r="2.5" fill={color} />
    </svg>
  )
}
