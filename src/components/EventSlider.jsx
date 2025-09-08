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
  const [w, setW] = React.useState(0) // width of a single copy group
  const [copies, setCopies] = React.useState(2)
  const [offset, setOffset] = React.useState(0)

  const effectiveSpeed = Math.max(10, Math.min(200, Number(speed) || 40))

  // Measure a single group width and compute how many copies are needed to fill viewport without gaps
  const measure = React.useCallback(() => {
    try {
      const wrap = wrapRef.current
      const track = trackRef.current
      if (!wrap || !track) return
      const firstGroup = track.querySelector('[data-copy="0"]') || track.children?.[0]
      const groupWidth = firstGroup ? firstGroup.scrollWidth : 0
      const viewport = wrap.clientWidth || 0
      if (groupWidth > 0) {
        setW(groupWidth)
        // Need enough copies so that total width >= viewport + one extra group for smooth looping
        const need = Math.max(2, Math.ceil((viewport + groupWidth) / groupWidth) + 1)
        setCopies(need)
      } else {
        setW(0)
        setCopies(2)
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    measure()
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    // Re-measure after images load to avoid initial zero-width gaps
    const track = trackRef.current
    let listeners = []
    if (track) {
      const imgs = track.querySelectorAll('img')
      imgs.forEach((img) => {
        const fn = () => measure()
        listeners.push({ img, fn })
        img.addEventListener('load', fn, { once: true })
      })
    }
    // Staggered timeouts as a fallback
    const t1 = setTimeout(measure, 50)
    const t2 = setTimeout(measure, 300)
    const t3 = setTimeout(measure, 1000)
    return () => {
      window.removeEventListener('resize', onResize)
      listeners.forEach(({ img, fn }) => img.removeEventListener('load', fn))
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
    }
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
          className="flex will-change-transform"
          style={{ transform: `translateX(${Math.round(offset)}px)` }}
        >
          {/* Duplicate content for seamless loop; render as many copies as needed to avoid gaps */}
          {Array.from({ length: Math.max(2, copies) }).map((_, copy) => (
            <div key={copy} data-copy={copy} className="flex gap-3">
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
