import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'

export default function ActionsHistory() {
  const { i18n } = useTranslation()
  const lang = (i18n?.language === 'en') ? 'en' : 'sv'
  const tl = (sv, en) => (lang === 'en' ? en : sv)
  const pick = (bi) => (bi && (bi[lang] || bi.sv || bi.en)) || ''
  const [content, setContent] = React.useState(loadContent())
  React.useEffect(() => {
    const onStorage = (e) => { if (!e || e.key === 'ar_site_content_v1') setContent(loadContent()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const actions = content.actions || { order: [], events: {} }
  const auctions = Array.isArray(content.auctions?.list) ? content.auctions.list : []
  const list = (actions.order || [])
    .map((id) => actions.events?.[id])
    .filter(Boolean)
    .filter(ev => !!ev.visible)

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl mb-6">{tl('Action-historik','Action history')}</h1>
      {list.length === 0 && (
        <div className="section-card p-4 text-neutral-600">{tl('Inga publika event ännu.','No public events yet.')}</div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {list.map((ev) => {
          const linked = Number.isInteger(ev.linkedAuctionIndex) && ev.linkedAuctionIndex >= 0 && ev.linkedAuctionIndex < auctions.length
          const linkedAuction = linked ? auctions[ev.linkedAuctionIndex] : null
          const title = linked ? pick(linkedAuction?.title) : pick(ev.title)
          const iso = linked && linkedAuction?.date
            ? `${linkedAuction.date}T${(linkedAuction.start && /\d{1,2}:\d{2}/.test(linkedAuction.start) ? linkedAuction.start : '00:00')}:00`
            : (ev.startIso || '')
          const dt = iso ? new Date(iso) : null
          const total = (ev.items||[]).reduce((sum, it) => sum + (it.sold ? (parseFloat(it.finalPrice) || 0) : 0), 0)
          const soldCount = (ev.items||[]).filter(it => it.sold).length
          return (
            <Link key={ev.id} to={`/action/${ev.id}`} className="section-card p-4 hover:bg-neutral-50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-serif text-xl">{title || tl('Live Event','Live Event')}</div>
                  <div className="text-sm text-neutral-600">{dt ? dt.toLocaleString() : '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-neutral-600">{tl('Totalt','Total')}</div>
                  <div className="text-xl font-serif">{total.toLocaleString('sv-SE')} SEK</div>
                  <div className="text-xs text-neutral-600">{tl('Sålda','Sold')}: {soldCount}</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
