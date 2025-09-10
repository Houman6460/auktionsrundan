import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadContent } from '../services/store'

export default function Header() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const [content, setContent] = React.useState(loadContent())

  React.useEffect(() => {
    const onScroll = () => setVisible(true)
    window.addEventListener('scroll', onScroll)
    const onStorage = () => setContent(loadContent())
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const changeLang = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('lang', lng)
    localStorage.setItem('site_lang', lng) // keep legacy key in sync
  }

  if (content?.header?.visible === false) return null

  const activeLangs = content?.header?.languages || { sv: true, en: true }
  const logo = content?.header?.logo

  const nav = content?.header?.nav || {}
  const getLabel = (key) => {
    const v = nav[key]
    if (v && typeof v === 'object') {
      return v[i18n.language] || v.sv || v.en || t(`nav.${key}`)
    }
    if (typeof v === 'string') return v
    return t(`nav.${key}`)
  }

  return (
    <>
    <header className={`fixed top-0 left-0 right-0 z-50 border-b bg-white/80 backdrop-blur ${visible ? '' : 'opacity-0'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt="Auktionsrundan" className="h-8 w-auto" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-earth-dark" aria-hidden="true" />
            )}
            <span className="font-serif text-xl">Auktionsrundan</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" className="hover:underline">{getLabel('home')}</NavLink>
            <NavLink to="/auctions" className="hover:underline">{getLabel('auctions')}</NavLink>
            <NavLink to="/items" className="hover:underline">{getLabel('items')}</NavLink>
            <NavLink to="/terms" className="hover:underline">{getLabel('terms')}</NavLink>
            <NavLink to="/contact" className="hover:underline">{getLabel('contact')}</NavLink>
            <NavLink to="/admin" className="text-sm text-earth-dark/80 hover:text-earth-dark">{t('nav.admin')}</NavLink>
            <div className="flex items-center gap-2">
              {activeLangs.sv && <button onClick={() => changeLang('sv')} className="btn-outline text-xs">SV</button>}
              {activeLangs.en && <button onClick={() => changeLang('en')} className="btn-outline text-xs">EN</button>}
            </div>
          </nav>

          <button className="md:hidden btn-outline" onClick={() => setOpen((v)=>!v)} aria-expanded={open} aria-controls="mobile-nav">
            Menu
          </button>
        </div>
      </div>
      {open && (
        <div id="mobile-nav" className="md:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-3">
            <NavLink to="/" onClick={()=>setOpen(false)}>{getLabel('home')}</NavLink>
            <NavLink to="/auctions" onClick={()=>setOpen(false)}>{getLabel('auctions')}</NavLink>
            <NavLink to="/items" onClick={()=>setOpen(false)}>{getLabel('items')}</NavLink>
            <NavLink to="/terms" onClick={()=>setOpen(false)}>{getLabel('terms')}</NavLink>
            <NavLink to="/contact" onClick={()=>setOpen(false)}>{getLabel('contact')}</NavLink>
            <NavLink to="/admin" onClick={()=>setOpen(false)}>{t('nav.admin')}</NavLink>
            <div className="flex items-center gap-2 pt-2">
              {activeLangs.sv && <button onClick={() => changeLang('sv')} className="btn-outline text-xs">SV</button>}
              {activeLangs.en && <button onClick={() => changeLang('en')} className="btn-outline text-xs">EN</button>}
            </div>
          </div>
        </div>
      )}
    </header>
    {/* Spacer to offset fixed header height */}
    <div className="h-16" aria-hidden="true" />
    </>
  )
}
