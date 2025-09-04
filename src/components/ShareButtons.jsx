import React from 'react'

export default function ShareButtons({ title, url, text, image }) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
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
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    mail: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + '\n' + shareUrl)}`,
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" className="btn-outline text-xs" onClick={doWebShare}>Dela</button>
      <a className="btn-outline text-xs" href={links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Dela på Facebook">FB</a>
      <a className="btn-outline text-xs" href={links.twitter} target="_blank" rel="noopener noreferrer" aria-label="Dela på Twitter">X</a>
      <a className="btn-outline text-xs" href={links.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Dela på WhatsApp">WA</a>
      <a className="btn-outline text-xs" href={links.mail} aria-label="Dela via e-post">E-post</a>
    </div>
  )
}
