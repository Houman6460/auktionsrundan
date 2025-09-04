import React from 'react'

export default function ShareButtons({ title, url, text, image }) {
  const absoluteUrl = (u) => {
    if (!u && typeof window !== 'undefined') return window.location.href
    try {
      const parsed = new URL(u, (typeof window !== 'undefined') ? window.location.origin : undefined)
      return parsed.toString()
    } catch {
      return u || ''
    }
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
    <div className="flex items-center gap-2">
      <button type="button" className="btn-outline text-xs" onClick={doWebShare}>Dela</button>
      <a className="btn-outline text-xs" href={links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Dela på Facebook">FB</a>
      <a className="btn-outline text-xs" href={links.twitter} target="_blank" rel="noopener noreferrer" aria-label="Dela på Twitter">X</a>
      <a className="btn-outline text-xs" href={links.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Dela på WhatsApp">WA</a>
      <button type="button" className="btn-outline text-xs" onClick={shareInstagram} aria-label="Dela via Instagram Direct">IG</button>
      <a className="btn-outline text-xs" href={links.mail} aria-label="Dela via e-post">E-post</a>
    </div>
  )
}
