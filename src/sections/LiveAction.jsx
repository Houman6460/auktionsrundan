import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { loadContent } from '../services/store'

function Countdown({ startIso }) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const ts = Date.parse(startIso)
  const diff = Math.max(0, ts - now)
  const s = Math.floor(diff / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return <div className="font-mono text-2xl">{d}d {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(sec).padStart(2,'0')}</div>
}

export default function LiveAction() {
  const { id } = useParams()
  const [content, setContent] = React.useState(loadContent())
  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || e.key === 'ar_site_content_v1') setContent(loadContent())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const actions = content.actions || { order: [], events: {} }
  const event = actions.events?.[id]

  if (!event) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="section-card p-6">
          <h1 className="font-serif text-2xl mb-2">Event saknas</h1>
          <p className="text-neutral-600">Hittade inget event med id "{id}".</p>
          <div className="mt-4"><Link to="/" className="underline">Till startsidan</Link></div>
        </div>
      </main>
    )
  }

  const startIso = event.startIso || ''
  const started = !!event.state?.started
  const items = Array.isArray(event.items) ? event.items : []
  const currentIndex = Number.isInteger(event.state?.currentIndex) ? event.state.currentIndex : -1
  const currentItem = (currentIndex >= 0 && currentIndex < items.length) ? items[currentIndex] : null
  const prevItems = items.slice(0, Math.max(0, currentIndex))

  const total = items.reduce((sum, it) => sum + (it.sold ? (parseFloat(it.finalPrice) || 0) : 0), 0)

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid gap-6">
        <header className="section-card p-5">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-2xl">{(event.title && (event.title.sv || event.title.en)) || 'Live Action'}</h1>
            <div className="text-sm text-neutral-700">Totalt: <span className="font-medium">{total.toLocaleString('sv-SE')} SEK</span></div>
          </div>
          {startIso && !started && (
            <div className="mt-2">
              <div className="text-neutral-600 text-sm">Startar</div>
              <Countdown startIso={startIso} />
            </div>
          )}
        </header>

        {started ? (
          <section className="grid gap-6">
            <div className="section-card p-5">
              <div className="text-neutral-600 text-sm mb-2">Pågående</div>
              {currentItem ? (
                <div className="grid md:grid-cols-2 gap-4 items-start">
                  <div className="aspect-[4/3] bg-vintage-cream/70 rounded grid place-items-center text-neutral-500">
                    {currentItem.img ? (
                      <img src={currentItem.img} alt={(currentItem.title && (currentItem.title.sv || currentItem.title.en)) || ''} className="w-full h-full object-cover rounded" />
                    ) : (
                      <span>Ingen bild</span>
                    )}
                  </div>
                  <div>
                    <h2 className="font-serif text-xl">{(currentItem.title && (currentItem.title.sv || currentItem.title.en)) || 'Vara'}</h2>
                    {!!currentItem.startPrice && (
                      <div className="text-neutral-700 mt-1">Utropspris: {currentItem.startPrice} SEK</div>
                    )}
                    {currentItem.sold ? (
                      <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 rounded bg-emerald-600 text-white">
                        <span className="text-xs font-semibold">SÅLD</span>
                        <span className="text-xs">{parseFloat(currentItem.finalPrice||0).toLocaleString('sv-SE')} SEK</span>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-neutral-600">Väntar på försäljning...</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-neutral-600">Inget föremål visas just nu.</div>
              )}
            </div>

            <div className="section-card p-5">
              <div className="text-neutral-600 text-sm mb-2">Tidigare visade</div>
              {prevItems.length === 0 && (
                <div className="text-neutral-600 text-sm">Inga ännu.</div>
              )}
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {prevItems.map((it, i) => (
                  <div key={i} className="border rounded overflow-hidden">
                    <div className="aspect-[4/3] bg-vintage-cream/70 grid place-items-center text-neutral-500">
                      {it.img ? (
                        <img src={it.img} alt={(it.title && (it.title.sv || it.title.en)) || ''} className="w-full h-full object-cover" />
                      ) : (
                        <span>Ingen bild</span>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="font-medium truncate">{(it.title && (it.title.sv || it.title.en)) || 'Vara'}</div>
                      <div className="text-xs text-neutral-600 mt-1">
                        {it.sold ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">SÅLD · {parseFloat(it.finalPrice||0).toLocaleString('sv-SE')} SEK</span>
                        ) : (
                          <span>Visad</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="section-card p-5">
            <p className="text-neutral-700">Livesändningen börjar när nedräkningen är klar. Välkommen då!</p>
            <div className="mt-3"><Link to="/" className="underline">Till startsidan</Link></div>
          </section>
        )}
      </div>
    </main>
  )
}
