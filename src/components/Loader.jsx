import React from 'react'

// Tiny helper to ensure the lottie-player web component script is present
function useLottiePlayer() {
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      // If custom element already defined, do nothing
      if (window.customElements && window.customElements.get('lottie-player')) return
      // Avoid injecting multiple times
      const existing = document.querySelector('script[data-lottie-player]')
      if (existing) return
      const s = document.createElement('script')
      s.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js'
      s.async = true
      s.defer = true
      s.setAttribute('data-lottie-player', '1')
      document.head.appendChild(s)
    } catch {}
  }, [])
}

export default function Loader({ variant = 'inline', label = 'Laddar…' }) {
  useLottiePlayer()
  // Sizes: bump slightly more per request
  const size = variant === 'page' ? 120 : 64
  const labelEl = (
    <span className="text-sm text-neutral-700">{label}</span>
  )
  const lottie = (
    <>
      {/* lottie-player will upgrade when script loads; keep a minimal height to avoid layout shift */}
      <lottie-player
        autoplay
        loop
        mode="normal"
        src="/lottie/sold-at-auction.json"
        style={{ width: size + 'px', height: size + 'px' }}
        aria-label={label}
        role="img"
      />
    </>
  )

  const fallbackSpinner = (
    <div className="w-6 h-6 rounded-full border-2 border-amber-300 border-t-earth-dark animate-spin" aria-hidden="true" />
  )

  if (variant === 'page') {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          {lottie}
          <div className="text-neutral-700 font-medium">{label}</div>
          {/* noscript or script-fail fallback */}
          <noscript>{fallbackSpinner}</noscript>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {lottie}
      {labelEl}
      <noscript>{fallbackSpinner}</noscript>
    </div>
  )
}
