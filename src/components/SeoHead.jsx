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
    try { setMeta('og:url', window.location?.href || 'http://auktionsrundan.com/') } catch {}
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

    // JSON-LD Organization and WebSite
    try {
      const org = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': 'http://auktionsrundan.com/#organization',
        name: 'Auktionsrundan',
        url: 'http://auktionsrundan.com/',
        logo: image || undefined
      }
      const wsite = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': 'http://auktionsrundan.com/#website',
        url: 'http://auktionsrundan.com/',
        name: 'Auktionsrundan',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'http://auktionsrundan.com/?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }
      const rm = (id) => { const el = document.getElementById(id); if (el) el.remove() }
      rm('jsonld-org'); rm('jsonld-website')
      const s1 = document.createElement('script'); s1.type='application/ld+json'; s1.id='jsonld-org'; s1.textContent = JSON.stringify(org); document.head.appendChild(s1)
      const s2 = document.createElement('script'); s2.type='application/ld+json'; s2.id='jsonld-website'; s2.textContent = JSON.stringify(wsite); document.head.appendChild(s2)
    } catch {}

    // JSON-LD FAQPage if FAQ items exist
    try {
      const items = content.faq?.items || []
      if (Array.isArray(items) && items.length) {
        const faq = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: items.map((q) => ({
            '@type': 'Question',
            name: (q.q?.sv || q.q?.en || ''),
            acceptedAnswer: {
              '@type': 'Answer',
              text: (q.a?.sv || q.a?.en || '')
            }
          }))
        }
        const exist = document.getElementById('jsonld-faq')
        if (exist) exist.remove()
        const s = document.createElement('script'); s.type='application/ld+json'; s.id='jsonld-faq'; s.textContent = JSON.stringify(faq); document.head.appendChild(s)
      }
    } catch {}

    return () => {
      removeMeta('og:title'); removeMeta('og:description'); removeMeta('og:image')
      removeMeta('og:url')
      removeMeta('twitter:card'); removeMeta('twitter:title'); removeMeta('twitter:description')
      const existing = document.getElementById('jsonld-events'); if (existing) existing.remove()
      const e1 = document.getElementById('jsonld-org'); if (e1) e1.remove()
      const e2 = document.getElementById('jsonld-website'); if (e2) e2.remove()
      const e3 = document.getElementById('jsonld-faq'); if (e3) e3.remove()
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
