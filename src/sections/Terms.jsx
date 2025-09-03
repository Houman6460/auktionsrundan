import React from 'react'
import { loadContent } from '../services/store'

export default function Terms() {
  const [content, setContent] = React.useState(loadContent())
  React.useEffect(() => {
    const onStorage = () => setContent(loadContent())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (!content.terms?.visible) return <div className="text-neutral-500">Sektionen är avstängd.</div>

  const blocks = content.terms?.blocks || {}
  const order = [
    ['auktionsvillkor', 'Auktionsvillkor'],
    ['klubbaslagsavgift', 'Klubbaslagsavgift'],
    ['betalning', 'Betalning'],
    ['allman', 'Allmän information'],
    ['utropspriser', 'Utropspriser och Bevakning'],
    ['ursprung', 'Var kommer varorna ifrån?'],
    ['viktigt', 'Viktigt att veta innan auktion'],
  ]

  return (
    <div className="grid gap-6">
      {order.map(([key, title]) => (
        blocks[key] ? (
          <article key={key} className="section-card p-5">
            <h3 className="font-serif text-2xl mb-3">{title}</h3>
            <div className="prose max-w-none">
              <p>{blocks[key]}</p>
            </div>
          </article>
        ) : null
      ))}
    </div>
  )
}
