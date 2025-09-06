import React from 'react'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'

export default function FAQPreview() {
  const { t, i18n } = useTranslation()
  const [content, setContent] = React.useState(loadContent())
  React.useEffect(() => {
    const onStorage = () => setContent(loadContent())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  if (!content.faq?.visible) return null
  const lang = (i18n?.language === 'en' || i18n?.language === 'sv') ? i18n.language : (localStorage.getItem('site_lang') || 'sv')
  const items = (content.faq?.items || []).slice(0, 3)
  if (!items.length) return null
  return (
    <div className="section-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-xl">{lang==='en' ? 'Quick answers' : 'Snabbt svar'}</h3>
        <a href="#faq" className="text-sm underline">{lang==='en' ? 'See all' : 'Visa alla'}</a>
      </div>
      <ul className="space-y-2 text-sm">
        {items.map((it, i) => (
          <li key={i} className="border-b pb-2">
            <div className="font-medium">{(it.q && (it.q[lang] || it.q.sv || it.q.en)) || ''}</div>
            <div className="text-neutral-700">{(it.a && (it.a[lang] || it.a.sv || it.a.en)) || ''}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
