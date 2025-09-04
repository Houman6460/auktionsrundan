import React from 'react'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'
import { addSubscriber } from '../services/newsletter'

const SESSION_FLAG = 'ar_newsletter_popup_shown'

export default function NewsletterPopup() {
  const { i18n } = useTranslation()
  const [content, setContent] = React.useState(loadContent())
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({ name: '', email: '', tel: '' })
  const [error, setError] = React.useState('')

  const lang = (i18n.language === 'en' || i18n.language === 'sv') ? i18n.language : (localStorage.getItem('site_lang') || 'sv')

  React.useEffect(() => {
    const onStorage = () => setContent(loadContent())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

    // Trigger logic
  React.useEffect(() => {
    const nl = content.newsletter || {}
    if (!nl.popupEnabled) return
    if (nl.triggers?.oncePerSession && sessionStorage.getItem(SESSION_FLAG) === '1') return

    if (nl.triggers?.mode === 'scroll') {
      const handler = () => {
        const percent = Math.min(100, Math.max(0, (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100))
        if (percent >= (nl.triggers?.scrollPercent ?? 50)) {
          setOpen(true)
          sessionStorage.setItem(SESSION_FLAG, '1')
          window.removeEventListener('scroll', handler)
        }
      }
      window.addEventListener('scroll', handler)
      return () => window.removeEventListener('scroll', handler)
    } else {
      const delay = Math.max(0, nl.triggers?.delayMs ?? 5000)
      const t = setTimeout(() => {
        setOpen(true)
        sessionStorage.setItem(SESSION_FLAG, '1')
      }, delay)
      return () => clearTimeout(t)
    }
  }, [content.newsletter])

  if (!content.newsletter?.popupEnabled) return null

  const fields = content.newsletter.fields || { name: true, email: true, tel: false }
  const title = content.newsletter.title?.[lang] || content.newsletter.title?.sv || content.newsletter.title?.en || 'Stay informed'
  const subtitle = content.newsletter.subtitle?.[lang] || content.newsletter.subtitle?.sv || content.newsletter.subtitle?.en || 'We will inform you about the next auction.'

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(lang === 'sv' ? 'Ogiltig e-postadress.' : 'Invalid email address.')
      return
    }
    addSubscriber(form)
    setOpen(false)
    setForm({ name: '', email: '', tel: '' })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)}></div>
      <div className="relative section-card w-full max-w-md mx-4 p-6">
        <button aria-label="Close" onClick={() => setOpen(false)} className="absolute top-2 right-2 text-neutral-500 hover:text-neutral-800">×</button>
        <h3 className="font-serif text-xl mb-2">{title}</h3>
        <p className="text-sm text-neutral-700 mb-4">{subtitle}</p>
        <form onSubmit={submit} className="grid gap-3">
          {fields.name && (
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{lang==='sv'?'Namn':'Name'}</label>
              <input className="w-full border rounded px-3 py-2" value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
          )}
          {fields.email && (
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Email</label>
              <input type="email" className="w-full border rounded px-3 py-2" value={form.email} onChange={(e)=>setForm(f=>({...f,email:e.target.value}))} required={fields.email} />
            </div>
          )}
          {fields.tel && (
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{lang==='sv'?'Telefon':'Phone'}</label>
              <input className="w-full border rounded px-3 py-2" value={form.tel} onChange={(e)=>setForm(f=>({...f,tel:e.target.value}))} />
            </div>
          )}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" className="btn-primary">{lang==='sv'?'Prenumerera':'Subscribe'}</button>
        </form>
      </div>
    </div>
  )
}
