import React from 'react'
import { loadContent } from '../services/store'
import RatingStars from '../components/RatingStars'

export default function Items() {
  const [content, setContent] = React.useState(loadContent())
  const [filter, setFilter] = React.useState('Alla')
  const lang = content?.language === 'en' ? 'en' : 'sv'

  const getText = (val, fallback = '') => {
    if (!val) return fallback
    if (typeof val === 'string') return val
    if (typeof val === 'object') return val[lang] || val.sv || val.en || fallback
    return fallback
  }

  React.useEffect(() => {
    const onStorage = () => setContent(loadContent())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (!content.items?.visible) return <div className="text-neutral-500">Sektionen är avstängd.</div>

  const categories = content.items?.categories || {}
  const categoryNames = ['Alla', ...Object.keys(categories)]
  const items = Object.entries(categories).flatMap(([cat, arr]) =>
    (arr||[]).map((it, i) => ({ ...it, _cat: cat, _idx: i }))
  )
  const shown = filter === 'Alla' ? items : items.filter((i) => i._cat === filter)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {categoryNames.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`btn-outline text-sm ${filter===c? 'bg-earth-light/30' : ''}`}>{c}</button>
        ))}
      </div>
      {filter === 'Alla' ? (
        <div className="grid gap-8">
          {Object.entries(categories).map(([cat, arr]) => (
            <div key={cat}>
              <h3 className="font-serif text-xl mb-3">{cat}</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(arr||[]).map((it, idx) => (
                  <figure key={idx} className="section-card overflow-hidden">
                    <div className="aspect-[4/3] bg-vintage-cream/70 rounded overflow-hidden">
                      {it.img ? (
                        <img src={it.img} alt={getText(it.name) || 'Auktionsvara'} className="block w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center">
                          <span className="text-neutral-500">Ingen bild</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 pt-2">
                      <RatingStars targetType="item" targetId={`${cat}:${idx}`} />
                    </div>
                    {(() => {
                      const nameT = getText(it.name)
                      const sizeT = getText(it.size)
                      const typeT = getText(it.type)
                      const hasPrice = !!it.priceSek
                      const hasAny = !!(nameT || sizeT || typeT || hasPrice)
                      if (!hasAny) return null
                      return (
                        <figcaption className="p-3">
                          {!!nameT && <div className="font-medium">{nameT}</div>}
                          {!!sizeT && <div className="text-sm mt-1">{sizeT}</div>}
                          {!!typeT && (
                            <div className="text-sm">{lang==='en' ? 'Type' : 'Typ'}: {typeT}</div>
                          )}
                          {hasPrice && (
                            <div className="text-sm mt-1">{(lang==='en' ? 'Starting price' : 'Utropspris')}: {it.priceSek} SEK</div>
                          )}
                        </figcaption>
                      )
                    })()}
                  </figure>
                ))}
              </div>
              {(arr||[]).length === 0 && (
                <div className="section-card p-4 text-neutral-600">Inga varor i denna kategori.</div>
              )}
            </div>
          ))}
          {Object.keys(categories).length === 0 && (
            <div className="section-card p-4 text-neutral-600">Inga kategorier att visa.</div>
          )}
        </div>
      ) : (
        <>
          <h3 className="font-serif text-xl mb-3">{filter}</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {shown.map((it, idx) => (
              <figure key={idx} className="section-card overflow-hidden">
                <div className="aspect-[4/3] bg-vintage-cream/70 rounded overflow-hidden">
                  {it.img ? (
                    <img src={it.img} alt={getText(it.name) || 'Auktionsvara'} className="block w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center">
                      <span className="text-neutral-500">Ingen bild</span>
                    </div>
                  )}
                </div>
                <div className="p-3 pt-2">
                  <RatingStars targetType="item" targetId={`${it._cat}:${it._idx}`} />
                </div>
                {(() => {
                  const nameT = getText(it.name)
                  const sizeT = getText(it.size)
                  const typeT = getText(it.type)
                  const hasPrice = !!it.priceSek
                  const hasAny = !!(nameT || sizeT || typeT || hasPrice)
                  if (!hasAny) return null
                  return (
                    <figcaption className="p-3">
                      {!!nameT && <div className="font-medium">{nameT}</div>}
                      {!!sizeT && <div className="text-sm mt-1">{sizeT}</div>}
                      {!!typeT && (
                        <div className="text-sm">{lang==='en' ? 'Type' : 'Typ'}: {typeT}</div>
                      )}
                      {hasPrice && (
                        <div className="text-sm mt-1">{(lang==='en' ? 'Starting price' : 'Utropspris')}: {it.priceSek} SEK</div>
                      )}
                    </figcaption>
                  )
                })()}
              </figure>
            ))}
          </div>
          {shown.length === 0 && (
            <div className="section-card p-4 text-neutral-600">Inga varor att visa.</div>
          )}
        </>
      )}
    </div>
  )
}
