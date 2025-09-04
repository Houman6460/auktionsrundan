import React from 'react'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'

export default function Footer() {
  const { i18n } = useTranslation()
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
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-lg mb-2">Nyhetsbrev</h4>
          {f.newsletter !== false ? (
            <form onSubmit={(e)=>e.preventDefault()} className="flex gap-2">
              <input type="email" placeholder="Din e-post" className="flex-1 border rounded-md px-3 py-2" />
              <button className="btn-primary" type="submit">Skicka</button>
            </form>
          ) : (
            <p className="text-sm text-neutral-600">Avstängt</p>
          )}
        </div>
      </div>
      <div className="text-xs text-center py-4 text-neutral-500 border-t">© {new Date().getFullYear()} Auktionsrundan</div>
    </footer>
  )
}
