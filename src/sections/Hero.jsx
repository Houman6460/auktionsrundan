import React from 'react'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'

export default function Hero() {
  const { t } = useTranslation()
  const [content, setContent] = React.useState(loadContent())

  React.useEffect(() => {
    const onStorage = () => setContent(loadContent())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (!content.hero?.visible) return null

  const bg = content.hero?.bg
  const active = content.header?.languages || { sv: true, en: true }
  const preferred = localStorage.getItem('site_lang') || 'sv'
  const lang = active[preferred] ? preferred : (active.sv ? 'sv' : 'en')
  const ctaText = (content.hero?.cta?.text && (content.hero.cta.text[lang] || content.hero.cta.text.sv || content.hero.cta.text.en)) || t('hero.findUs')

  return (
    <section id="home" className="relative h-[60vh] min-h-[420px] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: bg ? `url(${bg})` : 'linear-gradient(135deg,#efe9e2,#d9cbb6)' }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <div className="relative container mx-auto px-4 text-center text-white">
        <h1 className="font-serif text-4xl md:text-5xl drop-shadow">Auktionsrundan</h1>
        <div className="mt-6 inline-block section-card bg-white/90 text-vintage-black px-6 py-4">
          <div className="font-serif text-xl mb-1">{t('hero.nextAuction')}</div>
          <ul className="text-sm">
            {(content.hero?.nextAuctions || []).map((a, idx) => (
              <li key={idx}>{a.name} — {a.date}</li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          <a href={content.hero?.cta?.link || '#auctions'} className="btn-primary">{ctaText}</a>
        </div>
      </div>
    </section>
  )
}
