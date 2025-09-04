import React from 'react'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'

export default function FAQ() {
  const { i18n } = useTranslation()
  const [content, setContent] = React.useState(loadContent())

  React.useEffect(() => {
    const onStorage = () => setContent(loadContent())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (!content.faq?.visible) return null

  const items = content.faq?.items || []
  const lang = (i18n.language === 'en' || i18n.language === 'sv') ? i18n.language : (localStorage.getItem('site_lang') || 'sv')

  return (
    <div className="section-card p-4">
      <h3 className="font-serif text-xl mb-4">FAQ</h3>
      <div className="grid gap-3">
        {items.length === 0 && (
          <div className="text-neutral-600 text-sm">Inga frågor ännu.</div>
        )}
        {items.map((it, idx) => (
          <details key={idx} className="group border rounded bg-white">
            <summary className="cursor-pointer px-4 py-3 flex items-center justify-between">
              <span className="font-medium">{it.q?.[lang] || it.q?.sv || it.q?.en || ''}</span>
              <span className="ml-3 text-neutral-500 group-open:rotate-180 transition-transform">⌄</span>
            </summary>
            <div className="px-4 pb-4 text-sm text-neutral-800 whitespace-pre-wrap">
              {it.a?.[lang] || it.a?.sv || it.a?.en || ''}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
