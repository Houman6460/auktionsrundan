import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Contact() {
  const { t, i18n } = useTranslation()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [result, setResult] = React.useState({ ok: false, error: '' })
  const [hp, setHp] = React.useState('') // honeypot

  const onSubmit = async (e) => {
    e.preventDefault()
    setResult({ ok: false, error: '' })
    if (hp) return // bot
    if (!name.trim() || !email.trim() || !message.trim()) {
      setResult({ ok: false, error: t('contact.error_required') })
      return
    }
    const emailOk = /.+@.+\..+/.test(email)
    if (!emailOk) {
      setResult({ ok: false, error: t('contact.error_email') })
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, message, lang: i18n.language, ts: Date.now(), ua: navigator.userAgent }),
      })
      const data = await res.json().catch(()=>({ ok:false }))
      if (res.ok && data && data.ok) {
        setResult({ ok: true, error: '' })
        setName('')
        setEmail('')
        setMessage('')
      } else {
        setResult({ ok: false, error: t('contact.error_generic') })
      }
    } catch {
      setResult({ ok: false, error: t('contact.error_generic') })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-serif mb-3">{t('contact.title')}</h1>
      <p className="text-neutral-700 mb-6">{t('contact.intro')}</p>
      <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4 max-w-3xl">
        <div className="md:col-span-1">
          <label className="block text-sm text-neutral-600 mb-1" htmlFor="ct-name">{t('contact.name')}</label>
          <input id="ct-name" className="w-full border rounded px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} autoComplete="name" required />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm text-neutral-600 mb-1" htmlFor="ct-email">{t('contact.email')}</label>
          <input id="ct-email" type="email" className="w-full border rounded px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-neutral-600 mb-1" htmlFor="ct-message">{t('contact.message')}</label>
          <textarea id="ct-message" className="w-full border rounded px-3 py-2 min-h-[140px]" value={message} onChange={(e)=>setMessage(e.target.value)} required />
        </div>
        {/* Honeypot */}
        <div className="hidden">
          <label>Website<input value={hp} onChange={(e)=>setHp(e.target.value)} /></label>
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <button className="btn-primary" type="submit" disabled={sending}>{sending ? t('contact.sending') : t('contact.submit')}</button>
          {result.ok && <span role="status" className="text-emerald-700 text-sm">{t('contact.success')}</span>}
          {!result.ok && result.error && <span role="alert" className="text-red-700 text-sm">{result.error}</span>}
        </div>
      </form>
    </div>
  )
}
