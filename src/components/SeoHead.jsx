import React from 'react'
import { loadContent } from '../services/store'

export default function SeoHead() {
  React.useEffect(() => {
    const content = loadContent()
    // Basic OG/Twitter tags (site-level)
    const title = 'Auktionsrundan'
    const description = (content.share?.text?.sv || content.share?.text?.en || 'Auktionsrundan')
    const image = content.share?.coverUrl || ''
    setMeta('og:title', title)
    setMeta('og:description', description)
    if (image) setMeta('og:image', image)
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)

    // JSON-LD Events for auctions
    try {
      const list = content.auctions?.list || []
      const events = list.map((a) => {
        const name = (a.title?.sv || a.title?.en || 'Auction')
        const addr = (a.address?.sv || a.address?.en || '')
        const iso = toIso(a.date, a.start)
        return {
          '@context': 'https://schema.org',
          '@type': 'Event',
          name,
          startDate: iso || undefined,
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          eventStatus: 'https://schema.org/EventScheduled',
          location: addr ? { '@type': 'Place', name: name, address: addr } : undefined,
          organizer: { '@type': 'Organization', name: 'Auktionsrundan' }
        }
      })
      const existing = document.getElementById('jsonld-events')
      if (existing) existing.remove()
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = 'jsonld-events'
      script.textContent = JSON.stringify(events.filter(Boolean))
      document.head.appendChild(script)
    } catch {}

    return () => {
      removeMeta('og:title'); removeMeta('og:description'); removeMeta('og:image')
      removeMeta('twitter:card'); removeMeta('twitter:title'); removeMeta('twitter:description')
      const existing = document.getElementById('jsonld-events'); if (existing) existing.remove()
    }
  }, [])
  return null
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[property='${name}'], meta[name='${name}']`)
  if (!el) {
    el = document.createElement('meta')
    if (name.startsWith('og:')) el.setAttribute('property', name)
    else el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
function removeMeta(name) {
  const el = document.querySelector(`meta[property='${name}'], meta[name='${name}']`)
  if (el) el.remove()
}
function toIso(date, time) {
  if (!date) return ''
  const t = (typeof time === 'string' && /\d{1,2}:\d{2}/.test(time)) ? time : '00:00'
  return `${date}T${t}:00Z` // approximate; better with real timezone handling if needed
}
