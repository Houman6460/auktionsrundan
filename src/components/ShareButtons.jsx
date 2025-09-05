import React from 'react'

export default function ShareButtons({ title, url, text, image, children }) {
  const absoluteUrl = (u) => {
    if (!u && typeof window !== 'undefined') return window.location.href
    try {
      const parsed = new URL(u, (typeof window !== 'undefined') ? window.location.origin : undefined)
      return parsed.toString()
    } catch {
      return u || ''
    }
  }
  const shareFacebook = async () => {
    // Prefill clipboard so the user can paste text (FB doesn't allow prefilled post text reliably)
    await copyToClipboard(`${shareText}\n${shareUrl}`)
    try { window.open(links.facebook, '_blank', 'noopener,noreferrer') } catch {}
  }
  const shareUrl = absoluteUrl(url)
  const shareTitle = title || 'Auktionsrundan'
  const shareText = text || shareTitle

  const doWebShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
      } else {
        // Fallback: open twitter share
        const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        window.open(tw, '_blank', 'noopener,noreferrer')
      }
    } catch {}
  }

  const links = {
    // Facebook respects 'u' and optional 'quote'
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    mail: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + '\n' + shareUrl)}`,
  }

  const copyToClipboard = async (val) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(val)
        return true
      }
    } catch {}
    // Fallback
    try {
      const ta = document.createElement('textarea')
      ta.value = val
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }

  const shareInstagram = async () => {
    const message = `${shareText}\n${shareUrl}`
    await copyToClipboard(message)
    // Try to open Instagram Direct; fallback to web
    const scheme = 'instagram://direct'
    const web = 'https://www.instagram.com/direct/new/'
    try {
      // Attempt to open the app scheme first (may be blocked on some browsers)
      window.location.href = scheme
      // Also open web fallback after a short delay for non-supporting environments
      setTimeout(() => {
        try { window.open(web, '_blank', 'noopener,noreferrer') } catch {}
      }, 500)
    } catch {
      try { window.open(web, '_blank', 'noopener,noreferrer') } catch {}
    }
  }

  return (
    <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
      <button type="button" className="btn-outline text-xs" onClick={doWebShare} aria-label="System share" title="System share">
        {/* Share icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/></svg>
      </button>
      <button type="button" className="btn-outline text-xs" onClick={shareFacebook} aria-label="Dela på Facebook" title="Facebook">
        {/* Facebook icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.02 3.66 9.18 8.44 9.96v-7.04H7.9v-2.92h2.4V9.41c0-2.37 1.41-3.68 3.56-3.68 1.03 0 2.11.18 2.11.18v2.32h-1.19c-1.17 0-1.53.73-1.53 1.48v1.78h2.6l-.42 2.92h-2.18v7.04c4.78-.78 8.44-4.94 8.44-9.96z"/></svg>
      </button>
      <a className="btn-outline text-xs" href={links.twitter} target="_blank" rel="noopener noreferrer" aria-label="Dela på X (Twitter)" title="X (Twitter)">
        {/* X icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3l7.5 9.5L3 21h3l6-6.5L18.5 21H21l-7.5-9.5L21 3h-3l-5.5 6L7 3H3z"/></svg>
      </a>
      <a className="btn-outline text-xs" href={links.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Dela på WhatsApp" title="WhatsApp">
        {/* WhatsApp icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.86 11.86 0 0012.04 0 11.94 11.94 0 000 12c0 2.11.55 4.07 1.61 5.84L0 24l6.34-1.64A11.93 11.93 0 0012 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.2-3.48-8.52zM12 21.6c-1.98 0-3.86-.58-5.48-1.68l-.39-.25-3.77.97.99-3.67-.26-.42A9.58 9.58 0 012.4 12c0-5.31 4.3-9.6 9.6-9.6 2.57 0 4.98 1 6.8 2.81A9.56 9.56 0 0121.6 12c0 5.3-4.29 9.6-9.6 9.6zm5.13-6.07c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.17-.43-2.24-1.37-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2-.22-.52-.44-.45-.61-.46l-.52-.01c-.18 0-.48.07-.73.34-.25.28-.96.94-.96 2.29 0 1.35.98 2.66 1.12 2.85.14.18 1.93 2.95 4.67 4.02.65.28 1.16.45 1.56.57.65.21 1.24.18 1.71.11.52-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.2-.52-.34z"/></svg>
      </a>
      <a className="btn-outline text-xs" href={links.telegram} target="_blank" rel="noopener noreferrer" aria-label="Dela på Telegram" title="Telegram">
        {/* Telegram icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 2L2.5 10.2c-.9.37-.88 1.67.03 2l5.1 1.78 2.02 6.44c.26.83 1.32 1.03 1.89.35l2.86-3.4 5.34 3.9c.72.53 1.75.13 1.94-.75L24 3.1C24 2.3 22.97 1.8 22 2zm-6.5 14.1l-2.6 3.1-1.2-3.86 6.3-5.64-7.76 4.83-3.06-1.07L21 4.9 15.5 16.1z"/></svg>
      </a>
      <button type="button" className="btn-outline text-xs" onClick={shareInstagram} aria-label="Dela via Instagram Direct" title="Instagram Direct">
        {/* Instagram icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3h10zm-5 3.5A4.5 4.5 0 1016.5 12 4.5 4.5 0 0012 7.5zm0 2A2.5 2.5 0 1114.5 12 2.5 2.5 0 0112 9.5zM18 6.5a1 1 0 11-1-1 1 1 0 011 1z"/></svg>
      </button>
      <a className="btn-outline text-xs" href={links.mail} aria-label="Dela via e-post" title="E‑post">
        {/* Mail icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 6c0-1.1.9-2 2-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 0l8 5 8-5H4zm16 12V8l-8 5-8-5v10h16z"/></svg>
      </a>
      {children}
    </div>
  )
}
