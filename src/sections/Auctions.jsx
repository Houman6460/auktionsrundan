import React from 'react'
import { loadContent } from '../services/store'

function AuctionCard({ a, idx, now }) {
  const parseTs = (val) => {
    if (!val || typeof val !== 'string') return NaN
    const ts = Date.parse(val)
    return Number.isFinite(ts) ? ts : NaN
  }
  const startTs = parseTs(a.start || a.date)
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

  return (
    <div className="section-card p-4 grid md:grid-cols-2 gap-4">
      <div>
        <h3 className="font-serif text-xl">{a.title}</h3>
        <p className="text-sm text-neutral-700 mt-1">{a.address}</p>
        <div className="mt-3 text-sm grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-vintage-cream/60">
            <div className="text-neutral-500">Visning</div>
            <div className="font-medium">{a.viewing}</div>
          </div>
          <div className="p-2 rounded bg-vintage-cream/60">
            <div className="text-neutral-500">Start</div>
            <div className="font-medium">{a.start}</div>
          </div>
        </div>
        {Number.isFinite(startTs) && (
          <div className="mt-3 p-2 rounded bg-amber-50 border border-amber-200 inline-block">
            <div className="text-neutral-600 text-xs">Nedräkning</div>
            <div className="font-mono text-lg">{remaining()}</div>
          </div>
        )}
      </div>
      <div className="rounded overflow-hidden border border-amber-900/10 min-h-[220px]">
        {a.mapEmbed ? (
          <iframe
            title={`map-${idx}`}
            src={a.mapEmbed}
            className="w-full h-full min-h-[220px]"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="w-full h-full min-h-[220px] grid place-items-center text-neutral-500">Ingen karta</div>
        )}
      </div>
    </div>
  )
}

export default function Auctions() {
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

  if (!content.auctions?.visible) return <div className="text-neutral-500">Sektionen är avstängd.</div>

  const list = content.auctions?.list || []
  return (
    <div className="grid gap-6">
      {list.map((a, idx) => (
        <AuctionCard key={idx} a={a} idx={idx} now={now} />
      ))}
      {list.length === 0 && (
        <div className="section-card p-4 text-neutral-600">Inga planerade auktioner.</div>
      )}
    </div>
  )
}
