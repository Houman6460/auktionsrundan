import React from 'react'
import { loadContent } from '../services/store'

export default function Items() {
  const [content, setContent] = React.useState(loadContent())
  const [filter, setFilter] = React.useState('Alla')

  React.useEffect(() => {
    const onStorage = () => setContent(loadContent())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (!content.items?.visible) return <div className="text-neutral-500">Sektionen är avstängd.</div>

  const categories = content.items?.categories || {}
  const categoryNames = ['Alla', ...Object.keys(categories)]

  const items = Object.entries(categories).flatMap(([cat, arr]) =>
    arr.map((it) => ({ ...it, _cat: cat }))
  )

  const shown = filter === 'Alla' ? items : items.filter((i) => i._cat === filter)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {categoryNames.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`btn-outline text-sm ${filter===c? 'bg-earth-light/30' : ''}`}>{c}</button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {shown.map((it, idx) => (
          <figure key={idx} className="section-card overflow-hidden">
            <div className="aspect-[4/3] bg-vintage-cream/70 grid place-items-center">
              {it.img ? (
                <img src={it.img} alt={it.name || 'Auktionsvara'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-neutral-500">Ingen bild</span>
              )}
            </div>
            <figcaption className="p-3">
              <div className="font-medium">{it.name || 'Namn saknas'}</div>
              <div className="text-xs text-neutral-500">{it._cat}</div>
              {it.size && <div className="text-sm mt-1">{it.size}</div>}
              {it.type && <div className="text-sm">Typ: {it.type}</div>}
            </figcaption>
          </figure>
        ))}
      </div>
      {shown.length === 0 && (
        <div className="section-card p-4 text-neutral-600">Inga varor att visa.</div>
      )}
    </div>
  )}
