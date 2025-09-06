import React from 'react'
import { Link } from 'react-router-dom'
import { loadContent } from '../services/store'

export default function ActionsHistory() {
  const [content, setContent] = React.useState(loadContent())
  React.useEffect(() => {
    const onStorage = (e) => { if (!e || e.key === 'ar_site_content_v1') setContent(loadContent()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const actions = content.actions || { order: [], events: {} }
  const list = (actions.order || []).map((id) => actions.events?.[id]).filter(Boolean).filter(ev => !!ev.visible)

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl mb-6">Action-historik</h1>
      {list.length === 0 && (
        <div className="section-card p-4 text-neutral-600">Inga publika event ännu.</div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {list.map((ev) => {
          const total = (ev.items||[]).reduce((sum, it) => sum + (it.sold ? (parseFloat(it.finalPrice) || 0) : 0), 0)
          const soldCount = (ev.items||[]).filter(it => it.sold).length
          const dt = ev.startIso ? new Date(ev.startIso) : null
          return (
            <Link key={ev.id} to={`/action/${ev.id}`} className="section-card p-4 hover:bg-neutral-50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-serif text-xl">{ev.title?.sv || ev.title?.en || 'Live Event'}</div>
                  <div className="text-sm text-neutral-600">{dt ? dt.toLocaleString() : '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-neutral-600">Totalt</div>
                  <div className="text-xl font-serif">{total.toLocaleString('sv-SE')} SEK</div>
                  <div className="text-xs text-neutral-600">Sålda: {soldCount}</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
