import React from 'react'
import { loadContent } from '../services/store'

// Placeholder component. For production, connect Instagram Graph API using saved token/username.
export default function InstagramFeed() {
  const [content, setContent] = React.useState(loadContent())
  React.useEffect(() => {
    const onStorage = () => setContent(loadContent())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (!content.instagram?.visible) return null

  const layout = content.instagram?.layout || 'grid'

  return (
    <div className="section-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-xl">Instagram</h3>
        {content.instagram?.username && (
          <a
            className="text-sm underline"
            href={`https://instagram.com/${content.instagram.username}`}
            target="_blank" rel="noreferrer"
          >@{content.instagram.username}</a>
        )}
      </div>
      <div className={layout === 'carousel' ? 'flex gap-3 overflow-x-auto' : 'grid grid-cols-2 md:grid-cols-4 gap-3'}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-vintage-cream/70 grid place-items-center text-neutral-500 text-sm">
            Post {i+1}
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-500 mt-3">Konfigurera riktigt flöde under Admin → Instagram.</p>
    </div>
  )
}
