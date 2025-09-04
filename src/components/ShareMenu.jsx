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
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
      )
    case 'arrow-up':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 4l-7 7h4v7h6v-7h4l-7-7z" />
        </svg>
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
  const [hovered, setHovered] = React.useState(null)
  const containerRef = React.useRef(null)

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

  // Close when clicking outside the share menu
  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  if (!cfg?.enabled) return null

  const isLeft = cfg.position === 'left'
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const text = (cfg.text?.[i18n.language] || cfg.text?.sv || cfg.text?.en || '').trim()

  // Avoid overlap with WhatsApp chat widget if enabled on the same side
  const chatEnabled = !!(chat && chat.enabled && chat.provider === 'whatsapp')
  const sameSideAsChat = chatEnabled && ((chat.position === 'left') === isLeft)
  // Align vertically with WhatsApp: place Share (+) above chat button by a fixed distance
  // WhatsApp assumed at bottom: 1rem; Share sits above by chat size (56px) + gap (12px)
  const bottomSpace = sameSideAsChat ? 'calc(1rem + 56px + 12px)' : '1rem'

  const links = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  }

  // Anchor items at button center; higher z-index so they are visible above content
  // Gradient circle with shadow, dark icon by default (icon inherits currentColor)
  const itemBase = `group absolute top-1/2 left-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full transition-transform duration-300 shadow-lg hover:shadow`

  // Build ordered list of enabled keys
  const keys = []
  if (cfg.platforms?.facebook) keys.push('facebook')
  if (cfg.platforms?.twitter) keys.push('twitter')
  if (cfg.platforms?.linkedin) keys.push('linkedin')
  if (cfg.platforms?.telegram) keys.push('telegram')
  if (cfg.platforms?.copy) keys.push('copy')

  // Vertical stack layout: items appear above the + button, evenly spaced
  const order = ['facebook', 'twitter', 'linkedin', 'telegram', 'copy']
  const enabledOrdered = order.filter(k => keys.includes(k))
  const gap = 56 // px vertical spacing between circles
  const sideOffset = isLeft ? 0 : 0 // keep centered above button; can tweak if needed
  const hoverColors = {
    facebook: '#3b5998',
    twitter: '#1DA1F2',
    linkedin: '#0077b5',
    telegram: '#0088cc',
    copy: '#262626',
  }
  const items = enabledOrdered.map((key, i) => ({
    key,
    x: `${sideOffset}px`,
    y: `${-gap * (i + 1)}px`,
    hoverColor: hoverColors[key] || '#262626',
  }))

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
      ref={containerRef}
      className="fixed z-40"
      style={{ bottom: bottomSpace, [isLeft ? 'left' : 'right']: '1rem' }}
    >
      <div className={`relative ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          type="button"
          className="floating-btn pointer-events-auto w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg focus:outline-none"
          style={{ background: 'linear-gradient(0deg, #3a2f25, #584a3b)' }}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close share menu' : 'Open share menu'}
        >
          <Icon name="plus" className={`w-5 h-5 transition-transform ${open ? '-rotate-45' : ''}`} />
        </button>
        <ul className="m-0 p-0 list-none">
          {items.map((it, idx) => (
            <li key={it.key}
                className={`${itemBase} ${open ? 'transition-[transform] ease-[cubic-bezier(0.175,0.885,0.32,1.275)]' : ''}`}
                style={{ transform: open ? `translate(-50%, -50%) translate3d(${it.x}, ${it.y}, 0)` : 'translate(-50%, -50%) translate3d(0,0,0)' }}
            >
              <button
                type="button"
                onClick={() => handleItemClick(it.key)}
                onMouseEnter={() => setHovered(it.key)}
                onMouseLeave={() => setHovered(null)}
                className="w-full h-full flex items-center justify-center rounded-full"
                style={{
                  background: 'linear-gradient(0deg, #ddd, #fff)',
                  boxShadow: '0 10px 15px rgba(0,0,0,0.3)',
                  color: hovered === it.key ? it.hoverColor : '#262626',
                }}
                aria-label={`Share via ${it.key}`}
              >
                <Icon name={it.key} className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* Scroll-to-top button below WhatsApp, aligned to same side */}
      <button
        type="button"
        className="fixed w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{
          [isLeft ? 'left' : 'right']: '1rem',
          bottom: '0.25rem',
          background: 'linear-gradient(0deg, #ddd, #fff)',
          boxShadow: '0 10px 15px rgba(0,0,0,0.3)',
          color: '#262626',
          zIndex: 39,
        }}
        aria-label="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <Icon name="arrow-up" className="w-6 h-6" />
      </button>
    </div>
  )
}
