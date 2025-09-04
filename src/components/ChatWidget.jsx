import React from 'react'
import { loadContent } from '../services/store'
import { useTranslation } from 'react-i18next'

function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.52 3.48A11.94 11.94 0 0 0 12.05 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.1 1.6 5.9L0 24l6.42-1.66c1.73.94 3.68 1.43 5.63 1.43h.01c6.54 0 11.85-5.31 11.85-11.86 0-3.17-1.23-6.17-3.39-8.43ZM12.06 22.03h-.01c-1.7 0-3.37-.45-4.83-1.31l-.35-.2-3.81.99 1.02-3.71-.23-.38a9.86 9.86 0 0 1-1.52-5.36C2.33 6.55 6.9 1.98 12.06 1.98c2.62 0 5.08 1.02 6.93 2.87a9.7 9.7 0 0 1 2.86 6.92c0 5.16-4.57 9.26-9.79 9.26Zm5.68-7.03c-.31-.15-1.82-.9-2.1-1-.28-.1-.48-.15-.68.15-.2.3-.78 1-.95 1.2-.17.21-.35.22-.65.07-.31-.15-1.31-.48-2.5-1.53-.92-.82-1.54-1.83-1.72-2.13-.18-.3-.02-.46.13-.62.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.68-1.64-.94-2.25-.25-.6-.5-.52-.68-.53h-.57c-.2 0-.53.07-.8.38-.28.3-1.06 1.03-1.06 2.52 0 1.5 1.1 2.95 1.26 3.15.15.2 2.16 3.3 5.23 4.63.73.32 1.3.5 1.75.64.73.23 1.4.2 1.93.12.59-.09 1.82-.74 2.08-1.46.26-.72.26-1.34.18-1.47-.08-.13-.28-.2-.6-.35Z" />
    </svg>
  )
}

export default function ChatWidget() {
  const { i18n } = useTranslation()
  const [cfg, setCfg] = React.useState(() => loadContent().chat)

  React.useEffect(() => {
    const handler = (e) => {
      if (!e || e.key === 'ar_site_content_v1') {
        try { setCfg(loadContent().chat) } catch {}
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  if (!cfg?.enabled || cfg?.provider !== 'whatsapp') return null

  const phone = (cfg.phoneE164 || '').replace(/[^+0-9]/g, '')
  if (!phone) return null

  const greet = (cfg.greeting?.[i18n.language] || cfg.greeting?.sv || cfg.greeting?.en || '').trim()
  const href = `https://wa.me/${encodeURIComponent(phone.replace(/^\+/, ''))}${greet ? `?text=${encodeURIComponent(greet)}` : ''}`
  const isLeft = cfg.position === 'left'

  return (
    <div className="fixed z-40" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1rem + 56px + 12px)', [isLeft ? 'left' : 'right']: '1rem' }}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open WhatsApp chat"
        className="group inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-600"
      >
        <WhatsAppIcon className="w-7 h-7" />
      </a>
    </div>
  )
}
