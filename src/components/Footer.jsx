import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'

export default function Footer() {
  const { i18n, t } = useTranslation()
  const [content, setContent] = React.useState(loadContent())

  React.useEffect(() => {
    const onStorage = () => setContent(loadContent())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (content.footer?.visible === false) return null

  const f = content.footer || {}
  const lang = (i18n?.language === 'en' || i18n?.language === 'sv') ? i18n.language : (localStorage.getItem('site_lang') || 'sv')
  const addressText = (f.address && (f.address[lang] || f.address.sv || f.address.en)) || (typeof f.address === 'string' ? f.address : 'Adress')
  const social = f.social || {}
  const socialEnabled = (f.socialEnabled && typeof f.socialEnabled === 'object') ? f.socialEnabled : {}
  const isOn = (key) => {
    const url = (social[key] || '').trim()
    const flag = socialEnabled[key]
    return url && flag !== false
  }
  const anySocial = ['facebook','instagram','tiktok','youtube','website'].some(isOn)
  return (
    <footer className="mt-20 border-t bg-white">
      <div className="container mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div>
          {f.logo ? (
            <img src={f.logo} alt="Auktionsrundan" className="h-10 w-auto mb-3" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-earth-dark mb-3" aria-hidden="true" />
          )}
          <p className="text-sm text-neutral-600">{addressText}</p>
        </div>
        <div>
          <h4 className="font-serif text-lg mb-2">Kontakt</h4>
          <ul className="space-y-1 text-sm">
            <li>Telefon: {f.phone || '-'}</li>
            <li>Email: {f.email || '-'}</li>
            <li><Link to="/contact" className="underline">{t('nav.contact')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-lg mb-2">Nyhetsbrev</h4>
          {f.newsletter !== false ? (
            <form onSubmit={(e)=>e.preventDefault()} className="flex flex-col sm:flex-row gap-2">
              <input type="email" placeholder="Din e-post" className="w-full sm:flex-1 border rounded-md px-3 py-2" />
              <button className="btn-primary w-full sm:w-auto" type="submit">Skicka</button>
            </form>
          ) : (
            <p className="text-sm text-neutral-600">Avstängt</p>
          )}
          <div className="mt-6">
            <h5 className="text-sm font-medium text-neutral-700 mb-2">{t('footer.follow')}</h5>
            <div className="flex items-center gap-3 flex-wrap">
                {isOn('facebook') && (
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="btn-outline text-xs" aria-label="Facebook" title="Facebook">
                    {/* Facebook icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.02 3.66 9.18 8.44 9.96v-7.04H7.9v-2.92h2.4V9.41c0-2.37 1.41-3.68 3.56-3.68 1.03 0 2.11.18 2.11.18v2.32h-1.19c-1.17 0-1.53.73-1.53 1.48v1.78h2.6l-.42 2.92h-2.18v7.04c4.78-.78 8.44-4.94 8.44-9.96z"/></svg>
                  </a>
                )}
                {isOn('instagram') && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline text-xs" aria-label="Instagram" title="Instagram">
                    {/* Instagram icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3h10zm-5 3.5A4.5 4.5 0 1016.5 12 4.5 4.5 0 0012 7.5zm0 2A2.5 2.5 0 1114.5 12 2.5 2.5 0 0112 9.5zM18 6.5a1 1 0 11-1-1 1 1 0 011 1z"/></svg>
                  </a>
                )}
                {isOn('tiktok') && (
                  <a href={social.tiktok} target="_blank" rel="noopener noreferrer" className="btn-outline text-xs" aria-label="TikTok" title="TikTok">
                    {/* TikTok icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 3c.6 1.7 1.9 3 3.5 3.5V10c-1.8 0-3.4-.6-4.7-1.7v5.6c0 3.3-2.7 6-6 6S3.3 17.2 3.3 13.9c0-2.9 1.9-5.3 4.6-5.9v3.1c-1 .5-1.6 1.4-1.6 2.5 0 1.6 1.3 2.9 2.9 2.9S12 15.2 12 13.6V3h4.5z"/></svg>
                  </a>
                )}
                {isOn('youtube') && (
                  <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="btn-outline text-xs" aria-label="YouTube" title="YouTube">
                    {/* YouTube icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2c-.3-1.2-1.2-2.1-2.4-2.4C19 . 3 12 .3 12 .3S5 .3 2.9 3.8C1.7 4.1.8 5 .5 6.2.1 8.3.1 12 .1 12s0 3.7.4 5.8c.3 1.2 1.2 2.1 2.4 2.4C5 21.9 12 21.9 12 21.9s7 0 9.1-1.4c1.2-.3 2.1-1.2 2.4-2.4.4-2.1.4-5.8.4-5.8s0-3.7-.4-5.8zM9.8 15.5v-7l6 3.5-6 3.5z"/></svg>
                  </a>
                )}
                {isOn('website') && (
                  <a href={social.website} target="_blank" rel="noopener noreferrer" className="btn-outline text-xs" aria-label="Website" title="Website">
                    {/* Link icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L10 5"/><path d="M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 007.07 7.07L14 19"/></svg>
                  </a>
                )}
                {!anySocial && (
                  <span className="text-xs text-neutral-500">—</span>
                )}
            </div>
          </div>
        </div>
      </div>
      <div className="text-xs text-center py-4 text-neutral-500 border-t">© {new Date().getFullYear()} Auktionsrundan</div>
      <div className="text-xs text-center pb-6 text-neutral-500">
        {t('footer.credit', {
          defaultValue: 'created by Logoland Design with ❤️ ',
        })}
        <a href="https://logoland.se" target="_blank" rel="noopener noreferrer" className="underline">logoland.se</a>
        &nbsp;2025
      </div>
    </footer>
  )
}
