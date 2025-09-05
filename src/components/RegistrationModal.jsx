import React from 'react'
import { useTranslation } from 'react-i18next'
import { loadContent, saveContent } from '../services/store'

export default function RegistrationModal({ open, onClose, auctionId, title }) {
  const { t, i18n } = useTranslation()
  const [content, setContent] = React.useState(loadContent())
  const [form, setForm] = React.useState({ name: '', email: '', tel: '', notes: '', answers: {} })
  const settings = content.registration || { enabled: true, fields: {}, questions: [] }
  const lang = (i18n?.language === 'en' || i18n?.language === 'sv') ? i18n.language : (localStorage.getItem('lang') || 'sv')

  React.useEffect(() => {
    if (!open) return
    // Reload settings when opening
    setContent(loadContent())
  }, [open])

  if (!open) return null

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const onAnswer = (qid, value) => (e) => {
    const checked = e.target.checked
    setForm((f) => {
      const prev = Array.isArray(f.answers[qid]) ? f.answers[qid] : []
      const next = checked ? Array.from(new Set([...prev, value])) : prev.filter((v) => v !== value)
      return { ...f, answers: { ...f.answers, [qid]: next } }
    })
  }

  const submit = (e) => {
    e.preventDefault()
    try {
      const current = loadContent()
      const reg = current.registration || { submissions: {} }
      const entry = {
        ts: Date.now(),
        title,
        name: form.name,
        email: form.email,
        tel: form.tel,
        notes: form.notes,
        answers: form.answers,
        lang,
      }
      if (!reg.submissions) reg.submissions = {}
      if (!Array.isArray(reg.submissions[auctionId])) reg.submissions[auctionId] = []
      reg.submissions[auctionId].push(entry)
      current.registration = { ...current.registration, ...reg }
      saveContent(current)
      setContent(current)
      onClose()
      setTimeout(() => alert(t('auctions.reg_thanks')), 50)
    } catch (err) {
      console.error('Registration save failed', err)
      alert('Could not save registration. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
          <h3 className="font-serif text-lg flex-1">{t('auctions.reg_title')} — {title}</h3>
          <button className="btn-outline text-xs" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form id={`reg-form-${auctionId}`} onSubmit={submit} className="grid gap-3 max-h-[70vh] overflow-y-auto p-4">
          {settings?.fields?.name && (
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{t('auctions.reg_name')}</label>
              <input className="w-full border rounded px-3 py-2" value={form.name} onChange={onChange('name')} />
            </div>
          )}
          {settings?.fields?.email && (
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{t('auctions.reg_email')}</label>
              <input type="email" required className="w-full border rounded px-3 py-2" value={form.email} onChange={onChange('email')} />
            </div>
          )}
          {settings?.fields?.tel && (
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{t('auctions.reg_tel')}</label>
              <input className="w-full border rounded px-3 py-2" value={form.tel} onChange={onChange('tel')} />
            </div>
          )}
          {settings?.fields?.notes && (
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{t('auctions.reg_notes')}</label>
              <textarea className="w-full border rounded px-3 py-2 min-h-[80px]" value={form.notes} onChange={onChange('notes')} />
            </div>
          )}

          {(settings?.questions || []).map((q) => (
            <div key={q.id} className="border-t pt-3">
              <div className="font-medium mb-2">{(q.label && (q.label[lang] || q.label.sv || q.label.en)) || q.id}</div>
              <div className="flex flex-wrap gap-2">
                {(q.options || []).map((opt, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" onChange={onAnswer(q.id, opt)} checked={Array.isArray(form.answers[q.id]) && form.answers[q.id].includes(opt)} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="sticky bottom-0 bg-white pt-2 border-t px-4 py-3 flex items-center justify-end gap-2">
            <button type="button" className="btn-outline" onClick={onClose}>Avbryt</button>
            <button type="submit" className="btn-primary">{t('auctions.reg_submit')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
