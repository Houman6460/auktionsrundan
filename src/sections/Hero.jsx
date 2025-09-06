import React from 'react'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'
import { downloadIcs } from '../utils/ics'
import { trackEvent } from '../services/analytics'

export default function Hero() {
  const { t, i18n } = useTranslation()
  const [content, setContent] = React.useState(loadContent())
  const [now, setNow] = React.useState(() => Date.now())
  const [loaded, setLoaded] = React.useState(false)
  const [loadedMaps, setLoadedMaps] = React.useState(() => new Set())
  const [stuck, setStuck] = React.useState(false)
  const sectionRef = React.useRef(null)
  const cardRef = React.useRef(null)
  const toEmbedSrc = (url) => {
    if (!url || typeof url !== 'string') return url
    try {
      const u = new URL(url)
      const isGoogle = /(^|\.)google\./.test(u.hostname) && u.pathname.startsWith('/maps')
      if (isGoogle) {
        if (!u.searchParams.has('output')) u.searchParams.set('output', 'embed')
        return u.toString()
      }
      return url
    } catch {
      // If URL parsing fails, return original
      return url
    }
  }

  React.useEffect(() => {
    const onStorage = () => setContent(loadContent())
    window.addEventListener('storage', onStorage)
    const tick = setInterval(() => setNow(Date.now()), 1000)
    // trigger fade-in once mounted
    const t = setTimeout(() => setLoaded(true), 10)
    const onScroll = () => {
      try {
        const sec = sectionRef.current
        if (!sec) return
        const rect = sec.getBoundingClientRect()
        // Header height is h-16 (~64px). When the top of the hero content approaches header, toggle compact band.
        const trigger = 72 // px threshold just under header
        setStuck(rect.top <= trigger)
      } catch {}
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(tick)
      clearTimeout(t)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (!content.hero?.visible) return null

  const bg = content.hero?.bg
  const active = content.header?.languages || { sv: true, en: true }
  const preferred = (i18n?.language === 'en' || i18n?.language === 'sv') ? i18n.language : (localStorage.getItem('site_lang') || 'sv')
  const lang = active[preferred] ? preferred : (active.sv ? 'sv' : 'en')
  const ctaText = (content.hero?.cta?.text && (content.hero.cta.text[lang] || content.hero.cta.text.sv || content.hero.cta.text.en)) || t('hero.findUs')

  // Compute next upcoming auction based on date + time (if time missing, default 00:00)
  const withTs = (content.hero?.nextAuctions || []).map(a => {
    const dateStr = a?.date
    const timeStr = (typeof a?.time === 'string' && /\d{1,2}:\d{2}/.test(a.time)) ? a.time : '00:00'
    const iso = dateStr ? `${dateStr}T${timeStr}:00` : ''
    const ts = iso ? Date.parse(iso) : NaN
    return { ...a, ts }
  })
  const upcoming = withTs.filter(a => Number.isFinite(a.ts)).sort((a, b) => a.ts - b.ts)

  const next = upcoming.find(a => a.ts >= now)

  const formatRemaining = (targetTs) => {
    const diff = Math.max(0, targetTs - now)
    const s = Math.floor(diff / 1000)
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  return (
    <section id="home" className="relative h-[60vh] min-h-[420px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: bg ? `url(${bg})` : 'linear-gradient(135deg,#efe9e2,#d9cbb6)' }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <div ref={sectionRef} className={`relative container mx-auto px-4 text-center text-white transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="font-serif text-4xl md:text-5xl drop-shadow">Auktionsrundan</h1>
        {/* Floating compact band under header when stuck */}
        {stuck && (
          <div className="fixed left-0 right-0 z-40" style={{ top: 'calc(env(safe-area-inset-top) + 4rem)' }}>
            <div className="container mx-auto px-4">
              <div className="bg-white/90 backdrop-blur border rounded-md px-3 py-2 shadow-sm overflow-hidden md:whitespace-nowrap whitespace-normal">
                <div className="flex flex-wrap items-center gap-3 text-vintage-black text-sm min-w-0">
                  <span className="font-serif text-base">{t('hero.nextAuction')}</span>
                  {next && (
                    <>
                      <span className="text-neutral-400">•</span>
                      <span className="font-medium truncate flex-1 min-w-0">
                        {(next.name && (next.name[lang] || next.name.sv || next.name.en)) || ''} — {new Date(next.ts).toLocaleDateString()} {next.time && <span className="text-neutral-700">{next.time}</span>}
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span className="font-mono">{formatRemaining(next.ts)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="mt-6 inline-block relative">
          {/* Shining edge behind the card before it transforms */}
          <div
            className={`absolute -inset-[3px] rounded-2xl bg-gradient-to-r from-yellow-200 via-white to-yellow-200 opacity-70 blur-sm animate-pulse transition-opacity duration-300 pointer-events-none ${stuck ? 'opacity-0' : 'opacity-80'}`}
            aria-hidden="true"
          />
          <div ref={cardRef} className={`relative section-card bg-white/90 text-vintage-black px-6 py-4 transition-transform duration-300 ${stuck ? 'scale-95 opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="font-serif text-xl mb-1">{t('hero.nextAuction')}</div>
          {next && (
            <div className="mb-3">
              <div className="text-base font-medium">
                {(next.name && (next.name[lang] || next.name.sv || next.name.en)) || ''} — {new Date(next.ts).toLocaleDateString()} {next.time && <span className="text-neutral-700">{next.time}</span>}
              </div>
              <div className="text-2xl font-mono">{formatRemaining(next.ts)}</div>
              <div className="mt-2">
                <button
                  type="button"
                  className="btn-outline text-xs"
                  onClick={() => {
                    try {
                      const d = (next.date || '')
                      const tStr = (typeof next.time === 'string' && /\d{1,2}:\d{2}/.test(next.time)) ? next.time : '00:00'
                      const iso = d ? `${d}T${tStr}:00` : null
                      if (iso) {
                        downloadIcs({
                          title: (next.name && (next.name[lang] || next.name.sv || next.name.en)) || 'Auktion',
                          startIso: iso,
                          durationMinutes: 180,
                          description: 'Auktionsrundan',
                          location: '',
                          filename: 'auktionsrundan.ics'
                        })
                        trackEvent('ics_add', { context: 'hero', title: (next.name && (next.name[lang] || next.name.sv || next.name.en)) || '' , start: iso })
                      }
                    } catch {}
                  }}
                >
                  {t('auctions.add_to_calendar') || 'Lägg till i kalender'}
                </button>
              </div>
            </div>
          )}
          <ul className="text-sm">
            {(content.hero?.nextAuctions || []).map((a, idx) => (
              <li key={idx} className="mt-2">
                <div className="font-medium">{(a.name && (a.name[lang] || a.name.sv || a.name.en)) || ''} — {a.date} {a.time && <span className="text-neutral-700">{a.time}</span>}</div>
                {a.mapEmbed && (
                  <div className="mt-2">
                    <div className="aspect-video w-full max-w-xl mx-auto border rounded overflow-hidden relative">
                      {!loadedMaps.has(idx) && (
                        <div className="absolute inset-0 bg-neutral-200 animate-pulse" aria-hidden="true" />
                      )}
                      <iframe
                        src={toEmbedSrc(a.mapEmbed)}
                        title={`Karta ${(a.name && (a.name[lang] || a.name.sv || a.name.en)) || ''}`}
                        width="100%"
                        height="100%"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        onLoad={() => setLoadedMaps(prev => {
                          const next = new Set(prev)
                          next.add(idx)
                          return next
                        })}
                        className={`transition-opacity duration-500 ${loadedMaps.has(idx) ? 'opacity-100' : 'opacity-0'}`}
                      />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-center gap-3">
            <a
              href={content.hero?.cta?.link || '#auctions'}
              className="btn-primary transition-all will-change-transform hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
              onClick={() => { try { trackEvent('cta_click', { context: 'hero', action: 'register' }) } catch {} }}
              aria-label="Anmäl dig"
            >
              {ctaText}
            </a>
            <a
              href="#terms"
              className="btn-outline"
              onClick={() => { try { trackEvent('cta_click', { context: 'hero', action: 'terms' }) } catch {} }}
            >
              {t('nav.terms')}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
