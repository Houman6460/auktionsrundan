import React from 'react'

// EventSlider: horizontally auto-scrolling list that pauses on hover
// Props:
// - title: string (optional header above the slider)
// - items: array of any (required)
// - renderItem: (item, idx) => ReactNode (required)
// - speed: number (pixels per second, default 40)
// - pauseOnHover: boolean (default true)
export default function EventSlider({ title, items = [], renderItem, speed = 40, pauseOnHover = true }) {
  const wrapRef = React.useRef(null)
  const trackRef = React.useRef(null)
  const [paused, setPaused] = React.useState(false)
  const [w, setW] = React.useState(0)
  const [offset, setOffset] = React.useState(0)

  const effectiveSpeed = Math.max(10, Math.min(200, Number(speed) || 40))

  // Measure track width
  const measure = React.useCallback(() => {
    try {
      const el = trackRef.current
      if (!el) return
      const width = el.scrollWidth / 2 // since we render duplicate
      setW(width)
    } catch {}
  }, [])

  React.useEffect(() => {
    measure()
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measure, items])

  // Animation loop
  React.useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now) => {
      const dt = (now - last) / 1000
      last = now
      if (!paused && w > 0) {
        setOffset((prev) => {
          let next = prev - effectiveSpeed * dt
          if (-next >= w) next += w // loop when one copy fully scrolled
          return next
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [paused, w, effectiveSpeed])

  const onMouseEnter = () => { if (pauseOnHover) setPaused(true) }
  const onMouseLeave = () => { if (pauseOnHover) setPaused(false) }

  if (!Array.isArray(items) || items.length === 0 || typeof renderItem !== 'function') return null

  return (
    <div className="section-card p-3">
      {title && <div className="font-serif text-lg mb-2">{title}</div>}
      <div
        ref={wrapRef}
        className="relative overflow-hidden"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-roledescription="marquee"
      >
        <div
          ref={trackRef}
          className="flex gap-3 will-change-transform"
          style={{ transform: `translateX(${Math.round(offset)}px)` }}
        >
          {/* Duplicate content for seamless loop */}
          {[0,1].map((copy) => (
            <div key={copy} className="flex gap-3">
              {items.map((it, idx) => (
                <div key={`${copy}-${idx}`} className="min-w-[220px] max-w-[260px]">
                  {renderItem(it, idx)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
