import React from 'react'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'
import GoogleMap from '../components/GoogleMap'
import RatingStars from '../components/RatingStars'
import ShareButtons from '../components/ShareButtons'
import RegistrationModal from '../components/RegistrationModal'
import { trackEvent } from '../services/analytics'

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

  return (
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
  return (
    <div className="grid gap-6">
      {list.map((a, idx) => (
        <AuctionCard key={idx} a={a} idx={idx} now={now} lang={lang} />
      ))}
      {list.length === 0 && (
        <div className="section-card p-4 text-neutral-600">{t('auctions.none')}</div>
      )}
    </div>
  )
}
