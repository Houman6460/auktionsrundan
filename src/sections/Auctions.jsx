import React from 'react'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'
import GoogleMap from '../components/GoogleMap'
import RatingStars from '../components/RatingStars'
import ShareButtons from '../components/ShareButtons'
import RegistrationModal from '../components/RegistrationModal'
import { trackEvent } from '../services/analytics'
 

function AuctionCard({ a, idx, now, lang, gallery }) {
  const { t } = useTranslation()
  const [openReg, setOpenReg] = React.useState(false)
  const [regCount, setRegCount] = React.useState(0)
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
      return url
    }
  }
  const toStartTs = (dateStr, timeStr) => {
    if (!dateStr || typeof dateStr !== 'string') return NaN
    const time = (typeof timeStr === 'string' && /\d{1,2}:\d{2}/.test(timeStr)) ? timeStr : '00:00'
    const iso = `${dateStr}T${time}:00`
    const ts = Date.parse(iso)
    return Number.isFinite(ts) ? ts : NaN
  }
  const startTs = toStartTs(a.date, a.start)
  // Small gallery thumbnails (no large image)
  const images = React.useMemo(() => {
    const hasGallery = Array.isArray(a.images) && a.images.length > 0
    const base = hasGallery ? a.images : ((typeof a.img === 'string' && a.img) ? [a.img] : [])
    // de-duplicate while preserving order
    const seen = new Set()
    const out = []
    for (const s of base) {
      if (typeof s === 'string' && s && !seen.has(s)) { seen.add(s); out.push(s) }
    }
    return out
  }, [a.images, a.img])
  const remaining = () => {
    if (!Number.isFinite(startTs)) return null
    const diff = Math.max(0, startTs - now)
    const s = Math.floor(diff / 1000)
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  const titleT = (a.title && (a.title[lang] || a.title.sv || a.title.en)) || ''
  const addrT = a.address && (a.address[lang] || a.address.sv || a.address.en) || ''
  const anchorId = `auction-${idx}`
  const shareUrl = (typeof window !== 'undefined') ? new URL(`/auctions#${anchorId}`, window.location.origin).toString() : ''
  const mapUrl = addrT ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrT)}` : ''
  const datePart = a.date ? a.date : ''
  const timePart = a.start ? a.start : ''
  const dateTimeLine = [datePart, timePart].filter(Boolean).join(' ')
  const viewingT = a.viewing && (a.viewing[lang] || a.viewing.sv || a.viewing.en)
  const shareText = [
    titleT,
    viewingT && `${t('auctions.viewing') || 'Visning'}: ${viewingT}`,
    a.start && `${t('auctions.start') || 'Start'}: ${a.start}`,
    dateTimeLine && `${t('auctions.date')}: ${dateTimeLine}`,
    addrT && `${t('auctions.address') || 'Adress'}: ${addrT}`,
    mapUrl && `${t('auctions.map') || 'Karta'}: ${mapUrl}`,
  ].filter(Boolean).join('\n')

  // Build a Google Static Map URL if we have an API key configured; otherwise omit (share will still include directions link)
  const staticMapUrl = (() => {
    try {
      const raw = localStorage.getItem('ar_site_content_v1')
      const parsed = raw ? JSON.parse(raw) : {}
      const apiKey = parsed?.maps?.apiKey || ''
      if (!addrT) return ''
      const params = new URLSearchParams({
        center: addrT,
        zoom: '15',
        size: '800x400',
        scale: '2',
        maptype: 'roadmap',
        markers: `color:red|${addrT}`,
      })
      if (apiKey) params.set('key', apiKey)
      return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
    } catch {
      return ''
    }
  })()

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('ar_site_content_v1')
      const parsed = raw ? JSON.parse(raw) : {}
      const cnt = parsed?.registration?.submissions?.[anchorId]?.length || 0
      setRegCount(cnt)
    } catch {}
  }, [anchorId, openReg])

  // Load platform toggles from site content
  const contentRaw = (typeof window !== 'undefined') ? localStorage.getItem('ar_site_content_v1') : null
  const contentObj = (()=>{ try { return contentRaw ? JSON.parse(contentRaw) : {} } catch { return {} } })()
  const platforms = contentObj?.share?.platforms || {}
  const shareEnabled = contentObj?.share?.enabled !== false
  const anyPlatformOn = Object.values({
    system:true, facebook:true, twitter:true, linkedin:true, whatsapp:true,
    telegram:true, instagram:true, sms:true, mail:true, map:true, copy:true,
    ...platforms
  }).some(v => v !== false)

  const layoutLeftColsMd = (shareEnabled && anyPlatformOn) ? 'md:col-span-7 lg:col-span-8' : 'md:col-span-6 lg:col-span-6'
  const layoutRightColsMd = (shareEnabled && anyPlatformOn) ? 'md:col-span-5 lg:col-span-4' : 'md:col-span-6 lg:col-span-6'
  const ratingsEnabled = contentObj?.ratings?.enabled !== false

  // Lightbox state for thumbnails
  const [lightbox, setLightbox] = React.useState({ open: false, idx: 0 })
  const openLightboxAt = React.useCallback((i) => {
    setLightbox({ open: true, idx: Math.max(0, Math.min(i, Math.max(0, images.length - 1))) })
  }, [images.length])
  const closeLightbox = React.useCallback(() => setLightbox({ open: false, idx: 0 }), [])
  const nextImg = React.useCallback(() => setLightbox((s) => ({ open: true, idx: (s.idx + 1) % Math.max(1, images.length) })), [images.length])
  const prevImg = React.useCallback(() => setLightbox((s) => ({ open: true, idx: (s.idx - 1 + Math.max(1, images.length)) % Math.max(1, images.length) })), [images.length])
  React.useEffect(() => {
    if (!lightbox.open) return
    const onKey = (e) => {
      try {
        if (e.key === 'Escape') closeLightbox()
        else if (e.key === 'ArrowRight') nextImg()
        else if (e.key === 'ArrowLeft') prevImg()
      } catch {}
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox.open, closeLightbox, nextImg, prevImg])

  // Slideshow banner above event card (golden ratio)
  function SlideshowBanner({ imgs, intervalMs }) {
    const [i, setI] = React.useState(0)
    const pausedRef = React.useRef(false)
    const reduceRef = React.useRef(false)
    React.useEffect(() => {
      try {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        const onRM = () => { reduceRef.current = mq.matches }
        onRM(); mq.addEventListener('change', onRM)
        return () => mq.removeEventListener('change', onRM)
      } catch {}
    }, [])
    React.useEffect(() => {
      // Auto-advance disabled: keep static image (index 0)
      try { setI(0) } catch {}
      return () => {}
    }, [imgs])
    const onEnter = () => { pausedRef.current = true }
    const onLeave = () => { pausedRef.current = false }
    if (!imgs || imgs.length === 0) return null
    const src = imgs[0]
    return (
      <div className="section-card p-0 overflow-hidden">
        <div
          className="relative w-full aspect-[1.618/1] bg-neutral-200 cursor-pointer"
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onClick={() => openLightboxAt(i)}
          role="button"
          title={(t('auctions.image')||'Bild') + ' ' + String(i+1)}
          aria-label={(t('auctions.image')||'Bild') + ' ' + String(i+1)}
        >
          <img src={src} alt="banner" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          {/* subtle gradient overlay for legibility, optional */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 to-black/0" />
        </div>
      </div>
    )
  }

  // Thumbnails row (manual paging, with dock zoom)
  function ThumbsAutoRow({ imgs }) {
    const containerRef = React.useRef(null)
    const wrapRef = React.useRef(null)
    const trackRef = React.useRef(null)
    const [paused, setPaused] = React.useState(false)
    const offsetRef = React.useRef(0)
    const stepWRef = React.useRef(0) // width of single tile incl. gap (approx)
    const totalWRef = React.useRef(0) // total width of track (single sequence)
    const wrapWRef = React.useRef(0)  // wrapper visible width
    const visibleCountRef = React.useRef(1)
    const maxStartRef = React.useRef(0)
    const rafRef = React.useRef(0)
    const [hover, setHover] = React.useState({ on:false, idx:0, x:0, scale:1 })
    const enableScroll = false // turn off movement per request
    const [startIdx, setStartIdx] = React.useState(0)
    const [canScroll, setCanScroll] = React.useState(false)
    const reduceRef = React.useRef(false)

    // Measure tile width + gap and compute total track width
    const measure = React.useCallback(() => {
      try {
        const track = trackRef.current
        if (!track || !track.firstElementChild) return
        // The first child corresponds to first tile of first sequence
        const first = track.firstElementChild
        const rect = first.getBoundingClientRect()
        const cs = window.getComputedStyle(track)
        let gap = 0
        const cg = parseFloat(cs.columnGap || '0')
        const g = cs.gap ? parseFloat(cs.gap) : 0
        gap = Number.isFinite(cg) && cg > 0 ? cg : (Number.isFinite(g) ? g : 0)
        const stepW = Math.max(1, Math.round(rect.width + gap))
        stepWRef.current = stepW
        // Use actual rendered width for single sequence to avoid drift
        const full = track.scrollWidth || 0
        totalWRef.current = Math.max(1, Math.round(full))
        const wrap = wrapRef.current
        wrapWRef.current = wrap ? Math.max(0, Math.round(wrap.clientWidth || 0)) : 0
        const visibleCount = Math.max(1, Math.floor(wrapWRef.current / stepWRef.current))
        visibleCountRef.current = visibleCount
        const n = (imgs?.length || 0)
        const maxStart = Math.max(0, n - visibleCount)
        maxStartRef.current = maxStart
        setCanScroll(n > visibleCount)
        // clamp start index after any resize
        setStartIdx((s)=> Math.max(0, Math.min(s, maxStart)))
      } catch {}
    }, [imgs])

    React.useEffect(() => {
      measure()
      const onResize = () => measure()
      window.addEventListener('resize', onResize)
      // Re-measure after images load/render
      const t1 = setTimeout(measure, 50)
      const t2 = setTimeout(measure, 500)
      return () => { window.removeEventListener('resize', onResize); clearTimeout(t1); clearTimeout(t2) }
    }, [measure])

    // Animation loop using translateX
    React.useEffect(() => {
      // movement disabled: apply manual slide transform based on startIdx
      try {
        if (trackRef.current) {
          const dx = startIdx * (stepWRef.current || 0)
          trackRef.current.style.transform = `translate3d(-${dx}px,0,0)`
        }
      } catch {}
      if (rafRef.current) { try { cancelAnimationFrame(rafRef.current) } catch {} ; rafRef.current = 0 }
      return () => { if (rafRef.current) { try { cancelAnimationFrame(rafRef.current) } catch {} ; rafRef.current = 0 } }
    }, [paused, imgs, startIdx])

    const goPrev = React.useCallback(() => {
      setStartIdx((s) => Math.max(0, s - 1))
    }, [])
    const goNext = React.useCallback(() => {
      setStartIdx((s) => Math.min(maxStartRef.current, s + 1))
    }, [])

    // Dock-style zoom: scale only inner images, no layout shift
    const applyDock = React.useCallback((clientX) => {
      try {
        if (reduceRef.current) return
        const track = trackRef.current
        if (!track) return
        const radius = 120
        const maxScale = 1.6
        const sigma = radius / 3
        const tiles = Array.from(track.querySelectorAll('button[data-tile="1"]'))
        tiles.forEach((btn) => {
          const img = btn.querySelector('img')
          if (!img) return
          const r = btn.getBoundingClientRect()
          const cx = r.left + r.width/2
          const d = Math.abs(clientX - cx)
          const g = Math.exp(- (d*d) / (2 * sigma * sigma))
          // Strong falloff to keep neighbors subtle
          const gPow = Math.pow(g, 4)
          const s = 1 + (maxScale - 1) * gPow
          img.style.transformOrigin = 'center center'
          img.style.transform = `scale(${s})`
          // subtle neighbor emphasis without layout shift
          const b = 1 + (0.06 * g)
          img.style.filter = `brightness(${b})`
          img.style.boxShadow = s > 1.02 ? '0 0 0 2px rgba(255,255,255,0.98)' : ''
          btn.style.zIndex = s > 1.02 ? '20' : '1'
          btn.style.boxShadow = s > 1.05 ? '0 10px 28px rgba(0,0,0,0.18)' : ''
        })
      } catch {}
    }, [])

    const resetDock = React.useCallback(() => {
      try {
        const track = trackRef.current
        if (!track) return
        Array.from(track.querySelectorAll('button[data-tile="1"]')).forEach((btn) => {
          const img = btn.querySelector('img')
          if (img) { img.style.transform = 'scale(1)'; img.style.filter = ''; img.style.boxShadow = '' }
          btn.style.zIndex = '1'
          btn.style.boxShadow = ''
        })
      } catch {}
    }, [])

    const handleEnter = React.useCallback(() => { /* noop */ }, [])
    const handleLeave = React.useCallback(() => {
      resetDock()
    }, [resetDock])

    // Reduced-motion listener -> disable zoom and reset state when toggled
    React.useEffect(() => {
      try {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        const onRM = () => { reduceRef.current = mq.matches; if (mq.matches) resetDock() }
        onRM(); mq.addEventListener('change', onRM)
        return () => mq.removeEventListener('change', onRM)
      } catch {}
    }, [resetDock])

    return (
      <div ref={containerRef} className="relative z-[40] overflow-visible flex justify-center mx-auto" aria-label={t('auctions.thumbnails') || 'Thumbnails'}>
        <div
          ref={wrapRef}
          className="overflow-visible"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onMouseMove={(e)=> applyDock(e.clientX)}
        >
          {/* Arrow controls */}
          {canScroll && (
            <>
              <div className="absolute inset-y-0 left-0 z-[80] flex items-center">
                <button type="button" className="btn-outline text-xs mx-1" onClick={goPrev} aria-label="Prev">‹</button>
              </div>
              <div className="absolute inset-y-0 right-0 z-[80] flex items-center">
                <button type="button" className="btn-outline text-xs mx-1" onClick={goNext} aria-label="Next">›</button>
              </div>
            </>
          )}
          <div ref={trackRef} className="flex gap-3 md:gap-4 xl:gap-5 will-change-transform select-none">
            {(imgs||[]).map((src, j) => (
              <button
                type="button"
                key={`${j}-${src}`}
                data-tile="1"
                className="relative shrink-0 w-20 h-20 rounded-xl overflow-visible bg-white focus:outline-none focus:ring-2 focus:ring-earth-dark/40 hover:shadow-md"
                title={`${t('auctions.image') || 'Bild'} ${((j % (imgs?.length||1))+1)}`}
                aria-label={`${t('auctions.image') || 'Bild'} ${((j % (imgs?.length||1))+1)}`}
                onClick={() => openLightboxAt(j % Math.max(1, (imgs?.length||1)))}
                onFocus={(e)=>{ try { const r = e.currentTarget.getBoundingClientRect(); applyDock(r.left + r.width/2) } catch {} }}
                onBlur={resetDock}
              >
                <img src={src} alt="thumbnail" className="w-full h-full object-cover rounded-xl pointer-events-none transition-[transform,filter,box-shadow] duration-200 ease-out motion-reduce:transition-none will-change-transform" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    {gallery?.slideshowEnabled && images.length > 0 && (
      <div className="mb-3">
        <SlideshowBanner imgs={images} intervalMs={gallery?.slideshowIntervalMs} />
      </div>
    )}
    <div id={anchorId} className="section-card p-4 grid md:grid-cols-12 gap-4">
      <div className={layoutLeftColsMd}>
        <h3 className="font-serif text-xl">{titleT}</h3>
        <p className="text-sm text-neutral-700 mt-1">{addrT}</p>
        <div className="mt-3 text-sm grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-vintage-cream/60">
            <div className="text-neutral-500">{t('auctions.viewing')}</div>
            <div className="font-medium">{(a.viewing && (a.viewing[lang] || a.viewing.sv || a.viewing.en)) || ''}</div>
            {a.start && (
              <div className="text-sm text-neutral-700">{t('auctions.start')} {a.start}</div>
            )}
          </div>
          <div className="p-2 rounded bg-vintage-cream/60">
            <div className="text-neutral-500">{t('auctions.date')}</div>
            <div className="font-medium">{a.date || '-'}</div>
            {a.start && <div className="text-sm text-neutral-700">{a.start}</div>}
            {Number.isFinite(startTs) && (
              <div className="mt-1">
                <div className="text-neutral-600 text-[11px] leading-none">{t('auctions.countdown')}</div>
                <div className="font-mono text-base">{remaining()}</div>
              </div>
            )}
          </div>
        </div>
        {/* Thumbnails moved to a separate card below */}
        <div className="mt-3">
          {shareEnabled && anyPlatformOn ? (
            <ShareButtons title={titleT} url={shareUrl} text={shareText} image={staticMapUrl} mapUrl={mapUrl} platforms={platforms}>
              {/* Register button styled like the social buttons - icon removed per request */}
              <button type="button" className="btn-outline text-xs relative px-3 whitespace-nowrap" onClick={()=>{ setOpenReg(true); try { trackEvent('register_open', { auctionId: anchorId, title: titleT }) } catch {} }} title={t('auctions.registerBtn')} aria-label={t('auctions.registerBtn')}>
                {t('auctions.registerShort')}
                {regCount>0 && (<span className="absolute -top-2 -right-2 bg-earth-dark text-white rounded-full text-[10px] leading-none px-1 py-0.5">{regCount}</span>)}
              </button>
            </ShareButtons>
          ) : (
            <div className="flex items-center">
              <button type="button" className="btn-outline text-xs relative px-3 whitespace-nowrap" onClick={()=>{ setOpenReg(true); try { trackEvent('register_open', { auctionId: anchorId, title: titleT }) } catch {} }} title={t('auctions.registerBtn')} aria-label={t('auctions.registerBtn')}>
                {t('auctions.registerShort')}
                {regCount>0 && (<span className="absolute -top-2 -right-2 bg-earth-dark text-white rounded-full text-[10px] leading-none px-1 py-0.5">{regCount}</span>)}
              </button>
            </div>
          )}
          <RegistrationModal open={openReg} onClose={()=>setOpenReg(false)} auctionId={anchorId} title={titleT} date={a.date} start={a.start} address={addrT} />
          {ratingsEnabled && (
            <div className="mt-2">
              <div className="text-xs text-neutral-600 mb-1">{t('ratings.title') || 'Betygsätt denna auktion'}</div>
              <RatingStars targetType="item" targetId={anchorId} />
            </div>
          )}
        </div>
      </div>
      <div className={`${layoutRightColsMd} rounded overflow-hidden border border-amber-900/10 min-h-[220px]`}>
        {/* Prefer real Google Map if API key set and we have an address; fallback to iframe if provided */}
        {(() => {
          const addr = a.address && (a.address[lang] || a.address.sv || a.address.en)
          try {
            const raw = localStorage.getItem('ar_site_content_v1')
            const parsed = raw ? JSON.parse(raw) : {}
            const apiKey = parsed?.maps?.apiKey || ''
            if (apiKey && typeof addr === 'string' && addr.trim()) {
              return (
                <GoogleMap
                  query={addr}
                  className="w-full h-full min-h-[220px]"
                />
              )
            }
          } catch {}
          if (a.mapEmbed) {
            return (
              <iframe
                title={`map-${idx}`}
                src={toEmbedSrc(a.mapEmbed)}
                className="w-full h-full min-h-[220px]"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )
          }
          return (
            <div className="w-full h-full min-h-[220px] grid place-items-center text-neutral-500">{t('auctions.noMap')}</div>
          )
        })()}
      </div>
    </div>
    {gallery?.thumbnailsEnabled !== false && images.length > 0 && (
      <div className="section-card relative z-[60] p-2 overflow-visible">
        <ThumbsAutoRow imgs={images} />
      </div>
    )}
    {lightbox.open && images.length > 0 && (
      <div className="fixed inset-0 z-[1000] bg-black/70 grid place-items-center p-4" role="dialog" aria-modal="true" onClick={closeLightbox}>
        <div className="relative max-w-[92vw] max-h-[88vh]">
          <img src={images[lightbox.idx]} alt="preview" className="max-w-[92vw] max-h-[88vh] object-contain rounded" onClick={(e)=>e.stopPropagation()} />
          <button type="button" className="absolute top-2 right-2 btn-outline text-xs" onClick={closeLightbox} title={t('close') || 'Stäng'}>✕</button>
          <div className="absolute inset-y-0 left-0 flex items-center p-2">
            <button type="button" className="btn-outline text-sm" onClick={(e)=>{ e.stopPropagation(); prevImg() }} aria-label="Prev">‹</button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center p-2">
            <button type="button" className="btn-outline text-sm" onClick={(e)=>{ e.stopPropagation(); nextImg() }} aria-label="Next">›</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default function Auctions() {
  const { t, i18n } = useTranslation()
  const [content, setContent] = React.useState(loadContent())
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const onStorage = () => setContent(loadContent())
    window.addEventListener('storage', onStorage)
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(tick)
    }
  }, [])

  if (!content.auctions?.visible) return <div className="text-neutral-500">{t('auctions.sectionOff')}</div>

  const list = content.auctions?.list || []
  const gallery = {
    thumbnailsEnabled: content.auctions?.thumbnailsEnabled !== false,
    slideshowEnabled: content.auctions?.slideshowEnabled !== false,
    slideshowIntervalMs: content.auctions?.slideshowIntervalMs ?? 3500,
  }
  const lang = (i18n?.language === 'en' || i18n?.language === 'sv') ? i18n.language : (localStorage.getItem('lang') || 'sv')
  return (
    <div className="grid gap-6">
      {list.map((a, idx) => (
        <AuctionCard key={idx} a={a} idx={idx} now={now} lang={lang} gallery={gallery} />
      ))}
      {list.length === 0 && (
        <div className="section-card p-4 text-neutral-600">{t('auctions.none')}</div>
      )}
    </div>
  )
}
