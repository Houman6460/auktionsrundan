import React from 'react'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'
import EventSlider from '../components/EventSlider'

export default function Testimonials() {
  const { i18n } = useTranslation()
  const [content, setContent] = React.useState(loadContent())
  React.useEffect(() => {
    const onStorage = () => setContent(loadContent())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const tcfg = content?.testimonials || {}
  if (tcfg.visible === false) return null

  const lang = (i18n?.language === 'en' || i18n?.language === 'sv') ? i18n.language : (localStorage.getItem('site_lang') || 'sv')
  const items = Array.isArray(tcfg.items) ? tcfg.items : []
  const title = lang === 'en' ? 'Testimonials' : 'Kundomdömen'

  const card = (it) => (
    <figure className="section-card p-4 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        {it.avatar ? (
          <img src={it.avatar} alt={it.name || 'Avatar'} className="w-10 h-10 rounded-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-earth-dark/10 grid place-items-center" aria-hidden>
            <span className="material-symbols-outlined text-earth-dark">person</span>
          </div>
        )}
        <div>
          <div className="font-medium leading-tight">{it.name || (lang==='en' ? 'Anonymous' : 'Anonym')}</div>
          <div className="text-xs text-neutral-600 leading-tight">{(it.role && (it.role[lang] || it.role.sv || it.role.en)) || ''}</div>
        </div>
      </div>
      <blockquote className="text-sm text-neutral-800 flex-1">
        <span className="align-top text-earth-dark mr-1">“</span>
        {(it.text && (it.text[lang] || it.text.sv || it.text.en)) || ''}
        <span className="align-top text-earth-dark ml-1">”</span>
      </blockquote>
    </figure>
  )

  if (tcfg.autoplay) {
    return (
      <div>
        <h2 className="text-3xl font-serif mb-6">{title}</h2>
        <EventSlider
          title={null}
          items={items}
          speed={Number(tcfg.speed) || 40}
          renderItem={(it) => card(it)}
        />
      </div>
    )
  }

  // Static grid when autoplay is off
  return (
    <div>
      <h2 className="text-3xl font-serif mb-6">{title}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it, idx) => (
          <div key={idx}>{card(it)}</div>
        ))}
        {items.length === 0 && (
          <div className="section-card p-4 text-neutral-600">
            {lang==='en' ? 'No testimonials added yet.' : 'Inga omdömen tillagda ännu.'}
          </div>
        )}
      </div>
    </div>
  )
}
