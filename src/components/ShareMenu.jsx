import React from 'react'
import { loadContent } from '../services/store'
import { useTranslation } from 'react-i18next'

function Icon({ name, className }) {
  switch (name) {
    case 'plus':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6Z"/></svg>
      )
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 5.02 3.66 9.19 8.44 9.93v-7.03H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.74 8.44-4.91 8.44-9.93Z"/></svg>
      )
    case 'twitter':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M22 5.79c-.77.34-1.6.57-2.47.67a4.3 4.3 0 0 0 1.89-2.37 8.53 8.53 0 0 1-2.71 1.04 4.27 4.27 0 0 0-7.27 3.89 12.11 12.11 0 0 1-8.8-4.46 4.26 4.26 0 0 0 1.32 5.69 4.21 4.21 0 0 1-1.93-.53v.05c0 2.06 1.47 3.78 3.41 4.18-.36.1-.74.16-1.13.16-.28 0-.55-.03-.82-.08.55 1.73 2.15 2.99 4.04 3.03A8.57 8.57 0 0 1 2 19.55a12.08 12.08 0 0 0 6.55 1.92c7.86 0 12.17-6.51 12.17-12.15 0-.19 0-.37-.01-.56A8.67 8.67 0 0 0 22 5.79Z"/></svg>
      )
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6.94 6.5a2.44 2.44 0 1 1 0-4.88 2.44 2.44 0 0 1 0 4.88ZM3.93 21.5h6.01V8.86H3.93V21.5Zm8.07 0h6.01v-7.2c0-3.85-4.12-3.56-4.12 0v7.2h-1.89V8.86h1.89v1.18c.88-1.64 4.89-1.77 4.89 1.57v9.89H12Z"/></svg>
      )
    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M9.04 15.41 8.8 19.8c.46 0 .66-.2.9-.44l2.16-2.06 4.48 3.28c.82.46 1.4.22 1.63-.76l2.95-13.82h.01c.26-1.2-.43-1.67-1.22-1.38L2.64 9.62c-1.17.46-1.15 1.13-.2 1.43l4.8 1.5L18.7 6.73c.6-.4 1.15-.18.7.23L9.04 15.41Z"/></svg>
      )
    case 'copy':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1Zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2Zm0 16H8V7h11v14Z"/></svg>
      )
    default:
      return null
  }
}

export default function ShareMenu() {
  const { i18n } = useTranslation()
  const [cfg, setCfg] = React.useState(() => loadContent().share)
  const [chat, setChat] = React.useState(() => loadContent().chat)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handler = (e) => {
      if (!e || e.key === 'ar_site_content_v1') {
        try {
          const data = loadContent()
          setCfg(data.share)
          setChat(data.chat)
        } catch {}
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  if (!cfg?.enabled) return null

  const isLeft = cfg.position === 'left'
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const text = (cfg.text?.[i18n.language] || cfg.text?.sv || cfg.text?.en || '').trim()

  // Avoid overlap with WhatsApp chat widget if enabled on the same side
  const chatEnabled = !!(chat && chat.enabled && chat.provider === 'whatsapp')
  const sameSideAsChat = chatEnabled && ((chat.position === 'left') === isLeft)
  // Default bottom spacing: 1rem; if overlapping, lift the share menu above chat button (~5.5rem)
  const bottomSpace = sameSideAsChat ? '5.5rem' : '1rem'

  const links = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  }

  const itemBase = `${isLeft ? 'absolute top-[0.2em] left-[0.2em]' : 'absolute top-[0.2em] right-[0.2em]'} z-[-1] flex items-center justify-center w-12 h-12 rounded-full text-white bg-earth-dark transition-transform duration-300`

  const items = []
  // Define inward-expanding positions for RIGHT side; mirror X for LEFT side
  const posRight = [
    { key: 'facebook', x: '-7em',   y: '-7em' },
    { key: 'twitter',  x: '-6.3em', y: '-6.3em' },
    { key: 'linkedin', x: '-6.5em', y: '-3.2em' },
    { key: 'telegram', x: '-7em',   y: '1em'   },
    { key: 'copy',     x: '-9.5em', y: '3.5em' },
  ]
  const pushIfEnabled = (def) => {
    if (cfg.platforms?.[def.key]) {
      const x = isLeft ? def.x.replace('-', '') : def.x // mirror across vertical axis by flipping sign
      items.push({ key: def.key, x, y: def.y })
    }
  }
  posRight.forEach(pushIfEnabled)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      // optional: tiny feedback
    } catch {}
  }

  const handleItemClick = (key) => {
    if (key === 'copy') return handleCopy()
    const href = links[key]
    if (href) window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="fixed"
      style={{ bottom: bottomSpace, [isLeft ? 'left' : 'right']: '1rem' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className={`relative ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          type="button"
          className="floating-btn pointer-events-auto w-14 h-14 rounded-full bg-earth-dark text-white flex items-center justify-center shadow-lg focus:outline-none"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close share menu' : 'Open share menu'}
        >
          <Icon name="plus" className={`w-6 h-6 transition-transform ${open ? '-rotate-45' : ''}`} />
        </button>
        <ul className="m-0 p-0 list-none">
          {items.map((it, idx) => (
            <li key={it.key}
                className={`${itemBase} ${open ? 'transition-[transform] ease-[cubic-bezier(0.175,0.885,0.32,1.275)]' : ''}`}
                style={{ transform: open ? `translate3d(${it.x}, ${it.y}, 0)` : 'translate3d(0,0,0)' }}
            >
              <button
                type="button"
                onClick={() => handleItemClick(it.key)}
                className="w-full h-full flex items-center justify-center"
                aria-label={`Share via ${it.key}`}
              >
                <Icon name={it.key} className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
