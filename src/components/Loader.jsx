import React from 'react'

export default function Loader({ variant = 'inline', label = 'Laddar…' }) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full border-2 border-amber-300 border-t-earth-dark animate-spin" aria-hidden="true" />
      <span className="text-sm text-neutral-700">{label}</span>
    </div>
  )
  if (variant === 'page') {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-amber-300 border-t-earth-dark animate-spin" aria-hidden="true" />
          <div className="text-neutral-700 font-medium">{label}</div>
        </div>
      </div>
    )
  }
  return content
}
