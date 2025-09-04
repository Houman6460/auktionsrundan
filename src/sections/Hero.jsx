import React from 'react'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'

export default function Hero() {
  const { t, i18n } = useTranslation()
  const [content, setContent] = React.useState(loadContent())
  const [now, setNow] = React.useState(() => Date.now())
  const [loaded, setLoaded] = React.useState(false)
  const [loadedMaps, setLoadedMaps] = React.useState(() => new Set())
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
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(tick)
      clearTimeout(t)
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
    <section id="home" className="relative h-[60vh] min-h-[420px] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: bg ? `url(${bg})` : 'linear-gradient(135deg,#efe9e2,#d9cbb6)' }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <div className={`relative container mx-auto px-4 text-center text-white transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="font-serif text-4xl md:text-5xl drop-shadow">Auktionsrundan</h1>
        <div className="mt-6 inline-block section-card bg-white/90 text-vintage-black px-6 py-4">
          <div className="font-serif text-xl mb-1">{t('hero.nextAuction')}</div>
          {next && (
            <div className="mb-3">
              <div className="text-base font-medium">
                {(next.name && (next.name[lang] || next.name.sv || next.name.en)) || ''} — {new Date(next.ts).toLocaleDateString()} {next.time && <span className="text-neutral-700">{next.time}</span>}
              </div>
              <div className="text-2xl font-mono">{formatRemaining(next.ts)}</div>
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
        <div className="mt-6">
          <a
            href={content.hero?.cta?.link || '#auctions'}
            className="btn-primary transition-all will-change-transform hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            {ctaText}
          </a>
        </div>
      </div>
    </section>
  )
}
