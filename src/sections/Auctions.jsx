import React from 'react'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'
import GoogleMap from '../components/GoogleMap'
import RatingStars from '../components/RatingStars'
import ShareButtons from '../components/ShareButtons'
import RegistrationModal from '../components/RegistrationModal'
import { trackEvent } from '../services/analytics'
import EventSlider from '../components/EventSlider'

function AuctionCard({ a, idx, now, lang }) {
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
    const arr = Array.isArray(a.images) ? a.images : []
    const plusMain = (typeof a.img === 'string' && a.img) ? [...arr, a.img] : arr
    // de-duplicate while preserving order
    const seen = new Set()
    const out = []
    for (const s of plusMain) {
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

  // Auto‑scrolling thumbnails row (no duplicated DOM). We translate the track and rotate order when a tile passes fully.
  function ThumbsAutoRow({ imgs }) {
    const wrapRef = React.useRef(null)
    const trackRef = React.useRef(null)
    const [paused, setPaused] = React.useState(false)
    const [order, setOrder] = React.useState(() => (Array.isArray(imgs) ? imgs.map((_, i) => i) : []))
    const offsetRef = React.useRef(0)
    const stepWRef = React.useRef(0)
    const rafRef = React.useRef(0)

    // Reset order when imgs change
    React.useEffect(() => {
      setOrder(Array.isArray(imgs) ? imgs.map((_, i) => i) : [])
      offsetRef.current = 0
    }, [imgs])

    // Measure tile width + gap
    const measureStepWidth = React.useCallback(() => {
      try {
        const track = trackRef.current
        if (!track || !track.firstElementChild) return
        const first = track.firstElementChild
        const rect = first.getBoundingClientRect()
        const cs = window.getComputedStyle(track)
        const gap = parseFloat(cs.columnGap || cs.gap || '0') || 0
        stepWRef.current = rect.width + gap
      } catch {}
    }, [])
    React.useEffect(() => {
      measureStepWidth()
      const onResize = () => measureStepWidth()
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }, [measureStepWidth])

    // Animation loop using translateX
    React.useEffect(() => {
      const tick = (ts) => {
        if (!wrapRef.current || !trackRef.current) { rafRef.current = requestAnimationFrame(tick); return }
        if (!paused) {
          const speed = 120 // px/sec
          const now = ts
          if (!tick.last) tick.last = now
          const dt = (now - tick.last) / 1000
          tick.last = now
          const dx = speed * dt
          offsetRef.current += dx
          const stepW = stepWRef.current || 88 // fallback ~ w-20 + gap-2
          if (offsetRef.current >= stepW && order.length > 1) {
            // rotate one tile and keep smooth motion
            offsetRef.current -= stepW
            setOrder((prev) => {
              if (!prev || prev.length <= 1) return prev
              const [first, ...rest] = prev
              return [...rest, first]
            })
          }
          // apply transform
          try {
            trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`
          } catch {}
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      return () => { cancelAnimationFrame(rafRef.current); rafRef.current = 0; tick.last = 0 }
    }, [paused, order.length])

    return (
      <div
        ref={wrapRef}
        className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-label={t('auctions.thumbnails') || 'Thumbnails'}
      >
        <div ref={trackRef} className="flex gap-2 will-change-transform">
          {order.map((idxVal, j) => (
            <button
              type="button"
              key={`${idxVal}-${j}`}
              className="shrink-0 w-20 h-20 rounded border overflow-hidden bg-white focus:outline-none focus:ring-2 focus:ring-earth-dark/40"
              title={`${t('auctions.image') || 'Bild'} ${idxVal+1}`}
              aria-label={`${t('auctions.image') || 'Bild'} ${idxVal+1}`}
              onClick={() => openLightboxAt(idxVal)}
            >
              <img src={imgs[idxVal]} alt="thumbnail" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
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
    {images.length > 0 && (
      <div className="section-card p-2">
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
  const lang = (i18n?.language === 'en' || i18n?.language === 'sv') ? i18n.language : (localStorage.getItem('lang') || 'sv')
  const sliderCfg = content?.slider?.events || { enabled: false, title: { sv: '', en: '' }, speed: 40 }
  const sliderTitle = (sliderCfg?.title && (sliderCfg.title[lang] || sliderCfg.title.sv || sliderCfg.title.en)) || ''
  const sliderEnabled = sliderCfg?.enabled && list.length > 0
  const sliderSpeed = Number(sliderCfg?.speed || 40)
  return (
    <div className="grid gap-6">
      {sliderEnabled && (
        <EventSlider
          title={sliderTitle}
          items={list.map((a, idx) => ({ a, idx }))}
          speed={sliderSpeed}
          renderItem={(it) => {
            const a = it.a
            const idx = it.idx
            const anchorId = `auction-${idx}`
            const titleT = (a.title && (a.title[lang] || a.title.sv || a.title.en)) || ''
            const addrT = a.address && (a.address[lang] || a.address.sv || a.address.en) || ''
            const imgSrc = (typeof a.img === 'string' && a.img) || (Array.isArray(a.images) && a.images[0]) || ''
            return (
              <a href={`#${anchorId}`} className="block border rounded bg-white hover:bg-neutral-50 p-2">
                {imgSrc ? (
                  <div className="w-full h-24 rounded mb-2 overflow-hidden bg-neutral-100">
                    <img src={imgSrc} alt={titleT || 'auction'} className="w-full h-full object-cover" />
                  </div>
                ) : null}
                <div className="font-medium line-clamp-1">{titleT}</div>
                <div className="text-xs text-neutral-600 mt-0.5 line-clamp-2">{addrT}</div>
                <div className="text-xs text-neutral-700 mt-1">{a.date || ''}{a.start ? ` • ${a.start}` : ''}</div>
              </a>
            )
          }}
        />
      )}
      {list.map((a, idx) => (
        <AuctionCard key={idx} a={a} idx={idx} now={now} lang={lang} />
      ))}
      {list.length === 0 && (
        <div className="section-card p-4 text-neutral-600">{t('auctions.none')}</div>
      )}
    </div>
  )
}
