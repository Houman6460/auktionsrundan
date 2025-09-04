import React from 'react'
import { Link } from 'react-router-dom'
import { loadContent, saveContent, resetContent } from '../services/store'

function Section({ id, title, children }) {
  return (
    <section id={id} className="section-card p-5">
      <h2 className="font-serif text-2xl mb-4">{title}</h2>
      {children}
    </section>
  )
}

// Accessible toggle switch built on a native checkbox using Tailwind's peer utilities
function Toggle({ checked, onChange, disabled, id }) {
  return (
    <label htmlFor={id} className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      <input
        id={id}
        type="checkbox"
        className="sr-only peer"
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div className="relative w-10 h-6 rounded-full bg-neutral-300 transition-colors peer-checked:bg-earth-dark peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-earth-dark/30">
        <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></span>
      </div>
    </label>
  )
}

// Helper: compress image files to data URL to avoid exceeding localStorage quota
// - SVG: return as-is (preserve vector)
// - PNG: preserve alpha by exporting as PNG
// - Others (JPEG/webp): draw onto white background and export as JPEG
async function fileToCompressedDataUrl(file, maxDim = 1600, quality = 0.8) {
  const img = await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    const reader = new FileReader()
    reader.onload = () => { image.src = reader.result }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  let targetW = w
  let targetH = h
  if (w > h && w > maxDim) {
    targetW = maxDim
    targetH = Math.round(h * (maxDim / w))
  } else if (h >= w && h > maxDim) {
    targetH = maxDim
    targetW = Math.round(w * (maxDim / h))
  }
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  // Decide output format based on original file type
  const type = (file && file.type) ? file.type.toLowerCase() : ''
  if (type.includes('svg')) {
    // Return original data URL for SVG to preserve vector/sharpness
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(file)
    })
  }
  if (type.includes('png')) {
    // Preserve transparency for PNG
    ctx.drawImage(img, 0, 0, targetW, targetH)
    try {
      return canvas.toDataURL('image/png')
    } catch {
      return canvas.toDataURL()
    }
  }
  // For JPEG/WebP/etc: fill white background to avoid black squares when alpha is dropped
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, targetW, targetH)
  ctx.restore()
  ctx.drawImage(img, 0, 0, targetW, targetH)
  try {
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    return canvas.toDataURL()
  }
}

export default function Admin() {
  const [data, setData] = React.useState(loadContent())
  const [saved, setSaved] = React.useState(false)
  const [authed, setAuthed] = React.useState(() => localStorage.getItem('ar_admin_authed') === '1')
  const [pw, setPw] = React.useState('')
  const [currentLang, setCurrentLang] = React.useState(() => localStorage.getItem('ar_admin_lang') || 'sv')
  const L = (sv, en) => (currentLang === 'en' ? en : sv)

  const handleToggle = (path) => (e) => {
    const next = { ...data }
    let cur = next
    for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]]
    cur[path[path.length - 1]] = e.target.checked
    setData(next)
  }

  const handleChange = (path) => (e) => {
    const value = e.target.value
    const next = { ...data }
    let cur = next
    for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]]
    cur[path[path.length - 1]] = value
    setData(next)
  }

  // Convert an uploaded image to compressed Data URL and store at given path
  const handleFileToDataUrl = (path) => async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      const next = { ...data }
      let cur = next
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]]
      cur[path[path.length - 1]] = dataUrl
      setData(next)
    } catch (err) {
      alert('Kunde inte läsa bilden. Försök med en annan fil.')
    }
  }

  const clearField = (path) => () => {
    const next = { ...data }
    let cur = next
    for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]]
    cur[path[path.length - 1]] = ''
    setData(next)
  }

  const addAuction = () => {
    const next = { ...data }
    next.auctions.list = next.auctions.list || []
    next.auctions.list.push({
      title: { sv: 'Ny auktion', en: 'New auction' },
      address: { sv: '', en: '' },
      mapEmbed: '',
      viewing: { sv: '', en: '' },
      date: '',
      start: ''
    })
    setData(next)
  }

  const removeAuction = (idx) => {
    const next = { ...data }
    next.auctions.list.splice(idx, 1)
    setData(next)
  }

  const updateAuction = (idx, key, value) => {
    const next = { ...data }
    next.auctions.list[idx][key] = value
    setData(next)
  }

  const addNextAuction = () => {
    const next = { ...data }
    next.hero.nextAuctions = next.hero.nextAuctions || []
    next.hero.nextAuctions.push({ name: { sv: 'Ny auktion', en: 'New auction' }, date: '2025-12-31', time: '' })
    setData(next)
  }

  const removeNextAuction = (idx) => {
    const next = { ...data }
    next.hero.nextAuctions.splice(idx, 1)
    setData(next)
  }

  const save = () => {
    try {
      saveContent(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
      // notify other tabs
      window.dispatchEvent(new StorageEvent('storage', { key: 'ar_site_content_v1' }))
    } catch (e) {
      console.error('Save failed', e)
      alert('Kunde inte spara innehållet. För många/breda bilder? Prova att ladda upp mindre bilder och försök igen.')
    }
  }

  const hardReset = () => {
    if (!confirm(L('Återställ till standardinnehåll?','Reset to default content?'))) return
    resetContent()
    setData(loadContent())
  }

  if (!authed) {
    return (
      <div className="min-h-screen grid place-items-center bg-vintage-cream px-4">
        <div className="section-card w-full max-w-sm p-6">
          <h1 className="font-serif text-2xl mb-4">{L('Admin Inloggning','Admin Login')}</h1>
          <p className="text-sm text-neutral-600 mb-3">{L('Ange lösenord för att fortsätta.','Enter password to continue.')}</p>
          <form onSubmit={(e)=>{e.preventDefault(); if (pw.trim().length >= 4) { localStorage.setItem('ar_admin_authed','1'); setAuthed(true);} else { alert(L('Ogiltigt lösenord (minst 4 tecken).','Invalid password (min 4 characters).')) } }}>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 mb-3"
              placeholder={L('Lösenord','Password')}
              value={pw}
              onChange={(e)=>setPw(e.target.value)}
            />
            <button className="btn-primary w-full" type="submit">{L('Logga in','Sign in')}</button>
          </form>
          <p className="text-xs text-neutral-500 mt-3">{L('Tips: För demo, valfritt lösenord ≥ 4 tecken.','Tip: For demo, any password ≥ 4 characters.')}</p>
          <div className="mt-4 text-center">
            <Link to="/" className="underline text-sm">{L('Tillbaka','Back')}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vintage-cream">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-earth-dark" aria-hidden="true" />
            <h1 className="font-serif text-xl">{L('Admin','Admin')}</h1>
          </div>
          <nav className="flex items-center gap-3">
            <div className="flex items-center gap-1 mr-2">
              <button
                className={`px-2 py-1 rounded text-sm ${currentLang==='sv' ? 'bg-earth-dark text-white' : 'btn-outline'}`}
                onClick={()=>{setCurrentLang('sv'); localStorage.setItem('ar_admin_lang','sv')}}
                disabled={!data.header.languages?.sv}
                title={!data.header.languages?.sv ? 'SV inaktiverat' : 'Svenska'}
              >SV</button>
              <button
                className={`px-2 py-1 rounded text-sm ${currentLang==='en' ? 'bg-earth-dark text-white' : 'btn-outline'}`}
                onClick={()=>{setCurrentLang('en'); localStorage.setItem('ar_admin_lang','en')}}
                disabled={!data.header.languages?.en}
                title={!data.header.languages?.en ? 'EN inaktiverat' : 'English'}
              >EN</button>
            </div>
            <Link to="/" className="btn-outline text-sm">{L('Till webbplatsen','View site')}</Link>
            <button className="btn-primary text-sm" onClick={save}>{L('Spara','Save')}</button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {saved && <div className="section-card p-3 text-emerald-700 bg-emerald-50 mb-6">{L('Sparat!','Saved!')}</div>}

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-3">
            <div className="section-card p-4 sticky top-4 max-h-[80vh] overflow-auto">
              <nav className="flex flex-col gap-2 text-sm">
                <a href="#admin-header" className="hover:underline">{L('Header','Header')}</a>
                <a href="#admin-hero" className="hover:underline">{L('Hero (Hem)','Hero (Home)')}</a>
                <a href="#admin-auctions" className="hover:underline">{L('Kommande Auktioner','Upcoming Auctions')}</a>
                <a href="#admin-items" className="hover:underline">{L('Auktionsvaror','Auction Items')}</a>
                <a href="#admin-terms" className="hover:underline">{L('Auktionsvillkor','Terms')}</a>
                <a href="#admin-instagram" className="hover:underline">{L('Instagram','Instagram')}</a>
                <a href="#admin-faq" className="hover:underline">FAQ</a>
                <a href="#admin-ratings" className="hover:underline">{L('Betyg','Ratings')}</a>
                <a href="#admin-maps" className="hover:underline">{L('Google Maps','Google Maps')}</a>
                <a href="#admin-footer" className="hover:underline">{L('Footer','Footer')}</a>
                <hr className="my-3" />
                <button className="btn-primary w-full" onClick={save}>{L('Spara','Save')}</button>
                <button className="btn-outline w-full" onClick={hardReset}>{L('Återställ standard','Reset to defaults')}</button>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="col-span-12 md:col-span-9 lg:col-span-9 grid gap-6">

        <Section id="admin-header" title={L('Header','Header')}>
          <label className="flex items-center gap-2 mb-3">
            <Toggle checked={!!data.header.visible} onChange={handleToggle(['header','visible'])} />
            <span>{L('Visa header','Show header')}</span>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Logotyp URL','Logo URL')}</label>
              <input className="w-full border rounded px-3 py-2" value={data.header.logo || ''} onChange={handleChange(['header','logo'])} placeholder="https://..." />
              <div className="mt-2 flex items-center gap-2">
                <input type="file" accept="image/*" onChange={handleFileToDataUrl(['header','logo'])} />
                <button type="button" className="btn-outline text-xs" onClick={clearField(['header','logo'])}>{L('Rensa','Clear')}</button>
              </div>
              {data.header.logo && (
                <div className="mt-2">
                  <img src={data.header.logo} alt={L('Logotyp','Logo')} className="h-12 w-auto border rounded bg-white" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Språk aktiva (SV/EN)','Languages enabled (SV/EN)')}</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <Toggle checked={!!data.header.languages.sv} onChange={(e)=>{const n={...data};n.header.languages.sv=e.target.checked;setData(n)}} />
                  <span>SV</span>
                </label>
                <label className="flex items-center gap-2">
                  <Toggle checked={!!data.header.languages.en} onChange={(e)=>{const n={...data};n.header.languages.en=e.target.checked;setData(n)}} />
                  <span>EN</span>
                </label>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="font-serif text-lg mb-2">{L('Navigering','Navigation')} ({currentLang.toUpperCase()})</h3>
              <label className="block text-sm text-neutral-600 mb-1">{L('Hem','Home')}</label>
              <input className="w-full border rounded px-3 py-2 mb-2" value={data.header.nav.home?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.header.nav.home[currentLang]=e.target.value; setData(n)}} />
              <label className="block text-sm text-neutral-600 mb-1">{L('Kommande auktioner','Upcoming auctions')}</label>
              <input className="w-full border rounded px-3 py-2 mb-2" value={data.header.nav.auctions?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.header.nav.auctions[currentLang]=e.target.value; setData(n)}} />
              <label className="block text-sm text-neutral-600 mb-1">{L('Auktionsvaror','Auction items')}</label>
              <input className="w-full border rounded px-3 py-2 mb-2" value={data.header.nav.items?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.header.nav.items[currentLang]=e.target.value; setData(n)}} />
              <label className="block text-sm text-neutral-600 mb-1">{L('Auktionsvillkor','Terms')}</label>
              <input className="w-full border rounded px-3 py-2" value={data.header.nav.terms?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.header.nav.terms[currentLang]=e.target.value; setData(n)}} />
            </div>
          </div>
        </Section>

        <Section id="admin-faq" title="FAQ">
          <label className="flex items-center gap-2 mb-3">
            <Toggle checked={!!data.faq?.visible} onChange={(e)=>{const n={...data}; n.faq = n.faq||{}; n.faq.visible = e.target.checked; setData(n)}} />
            <span>{L('Visa sektion','Show section')}</span>
          </label>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-lg">{L('Frågor & svar','Questions & Answers')}</h3>
            <button className="btn-outline text-sm" onClick={()=>{const n={...data}; n.faq = n.faq||{}; n.faq.items = n.faq.items||[]; n.faq.items.push({ q:{sv:'',en:''}, a:{sv:'',en:''} }); setData(n)}}>{L('Lägg till','Add')}</button>
          </div>
          <div className="grid gap-3">
            {(!(data.faq?.items)||data.faq.items.length===0) && (
              <div className="text-neutral-600 text-sm">{L('Inga frågor ännu.','No questions yet.')}</div>
            )}
            {(data.faq?.items||[]).map((it, idx) => (
              <div key={idx} className="section-card p-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">{L('Fråga','Question')} ({currentLang.toUpperCase()})</label>
                    <input className="w-full border rounded px-3 py-2" value={it.q?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.faq.items[idx].q = { ...(n.faq.items[idx].q||{}), [currentLang]: e.target.value }; setData(n)}} />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">{L('Svar','Answer')} ({currentLang.toUpperCase()})</label>
                    <textarea className="w-full border rounded px-3 py-2 min-h-[80px]" value={it.a?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.faq.items[idx].a = { ...(n.faq.items[idx].a||{}), [currentLang]: e.target.value }; setData(n)}} />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <div className="text-xs text-neutral-500">{L('Redigerar språk:','Editing language:')} {currentLang.toUpperCase()}</div>
                  <div className="flex gap-2">
                    <button className="btn-outline" onClick={()=>{const n={...data}; n.faq.items.splice(idx,1); setData(n)}}>{L('Ta bort','Remove')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="admin-hero" title={L('Hero (Hem)','Hero (Home)')}>
          <label className="flex items-center gap-2 mb-3">
            <Toggle checked={!!data.hero.visible} onChange={handleToggle(['hero','visible'])} />
            <span>{L('Visa hero','Show hero')}</span>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Bakgrundsbild URL','Background image URL')}</label>
              <input className="w-full border rounded px-3 py-2" value={data.hero.bg || ''} onChange={handleChange(['hero','bg'])} placeholder="https://..." />
              <div className="mt-2 flex items-center gap-2">
                <input type="file" accept="image/*" onChange={handleFileToDataUrl(['hero','bg'])} />
                <button type="button" className="btn-outline text-xs" onClick={clearField(['hero','bg'])}>{L('Rensa','Clear')}</button>
              </div>
              {data.hero.bg && (
                <div className="mt-2">
                  <img src={data.hero.bg} alt={L('Hero bakgrund','Hero background')} className="h-24 w-auto border rounded bg-white object-cover" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('CTA text','CTA text')} ({currentLang.toUpperCase()})</label>
              <input className="w-full border rounded px-3 py-2" value={data.hero.cta?.text?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.hero.cta.text[currentLang]=e.target.value; setData(n)}} />
              <label className="block text-sm text-neutral-600 mt-2 mb-1">{L('CTA länk','CTA link')}</label>
              <input className="w-full border rounded px-3 py-2" value={data.hero.cta?.link || ''} onChange={(e)=>{const n={...data};n.hero.cta.link=e.target.value;setData(n)}} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg">{L('Nästa Auktion(er)','Next Auction(s)')}</h3>
              <button className="btn-outline text-sm" onClick={addNextAuction}>{L('Lägg till','Add')}</button>
            </div>
            <div className="grid gap-3">
              {(data.hero.nextAuctions||[]).map((a, idx) => (
                <div key={idx} className="grid md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">{L('Namn','Name')} ({currentLang.toUpperCase()})</label>
                    <input className="w-full border rounded px-3 py-2" value={a.name?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.hero.nextAuctions[idx].name = { ...(n.hero.nextAuctions[idx].name||{}), [currentLang]: e.target.value }; setData(n)}} />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">{L('Datum','Date')}</label>
                    <input type="date" className="w-full border rounded px-3 py-2" value={a.date} onChange={(e)=>{const n={...data};n.hero.nextAuctions[idx].date=e.target.value;setData(n)}} />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">{L('Tid','Time')}</label>
                    <input type="time" className="w-full border rounded px-3 py-2" value={a.time || ''} onChange={(e)=>{const n={...data};n.hero.nextAuctions[idx].time=e.target.value;setData(n)}} />
                  </div>
                  <div className="flex gap-2 items-end">
                    <button className="btn-outline" onClick={()=>removeNextAuction(idx)}>{L('Ta bort','Remove')}</button>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm text-neutral-600 mb-1">{L('Google Maps Embed URL','Google Maps Embed URL')}</label>
                    <input className="w-full border rounded px-3 py-2" placeholder="https://www.google.com/maps?....&output=embed" value={a.mapEmbed || ''} onChange={(e)=>{const n={...data};n.hero.nextAuctions[idx].mapEmbed=e.target.value;setData(n)}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="admin-auctions" title={L('Kommande Auktioner','Upcoming Auctions')}>
          <label className="flex items-center gap-2 mb-3">
            <Toggle checked={!!data.auctions.visible} onChange={handleToggle(['auctions','visible'])} />
            <span>{L('Visa sektion','Show section')}</span>
          </label>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-lg">{L('Händelser','Events')}</h3>
            <button className="btn-outline text-sm" onClick={addAuction}>{L('Lägg till auktion','Add auction')}</button>
          </div>
          <div className="grid gap-4">
            {(data.auctions.list||[]).map((a, idx) => (
              <div key={idx} className="section-card p-4 grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">{L('Titel','Title')} ({currentLang.toUpperCase()})</label>
                  <input className="w-full border rounded px-3 py-2" value={a.title?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.auctions.list[idx].title = { ...(n.auctions.list[idx].title||{}), [currentLang]: e.target.value }; setData(n)}} />
                  <label className="block text-sm text-neutral-600 mt-2 mb-1">{L('Adress','Address')} ({currentLang.toUpperCase()})</label>
                  <input className="w-full border rounded px-3 py-2" value={a.address?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.auctions.list[idx].address = { ...(n.auctions.list[idx].address||{}), [currentLang]: e.target.value }; setData(n)}} />
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">{L('Visning','Viewing')} ({currentLang.toUpperCase()})</label>
                      <input className="w-full border rounded px-3 py-2" value={a.viewing?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.auctions.list[idx].viewing = { ...(n.auctions.list[idx].viewing||{}), [currentLang]: e.target.value }; setData(n)}} />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">{L('Datum','Date')}</label>
                      <input type="date" className="w-full border rounded px-3 py-2" value={a.date || ''} onChange={(e)=>updateAuction(idx,'date',e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">{L('Start','Start')}</label>
                      <input type="time" className="w-full border rounded px-3 py-2" value={a.start} onChange={(e)=>updateAuction(idx,'start',e.target.value)} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">{L('Google Maps Embed URL','Google Maps Embed URL')}</label>
                  <input className="w-full border rounded px-3 py-2" value={a.mapEmbed} onChange={(e)=>updateAuction(idx,'mapEmbed',e.target.value)} placeholder="https://www.google.com/maps?...&output=embed" />
                  <div className="mt-3 flex gap-2">
                    <button className="btn-outline" onClick={()=>removeAuction(idx)}>{L('Ta bort','Remove')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="admin-items" title={L('Auktionsvaror','Auction Items')}>
          <label className="flex items-center gap-2 mb-3">
            <Toggle checked={!!data.items.visible} onChange={handleToggle(['items','visible'])} />
            <span>{L('Visa sektion','Show section')}</span>
          </label>
          <p className="text-sm text-neutral-600 mb-3">{L('Hantera kategorier och lägg upp bilder för varje kategori. På framsidan visas en flik för Alla samt per kategori.','Manage categories and upload pictures per category. The frontend shows an All tab and per-category tabs.')}</p>
          <div className="section-card p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg">{L('Kategorier','Categories')}</h3>
              <button
                className="btn-outline text-sm"
                onClick={() => {
                  const next = { ...data }
                  next.items.categories = next.items.categories || {}
                  // Generate unique default name
                  let base = L('Ny kategori','New category')
                  let name = base
                  let i = 1
                  while (Object.prototype.hasOwnProperty.call(next.items.categories, name)) {
                    name = `${base} ${i++}`
                  }
                  next.items.categories[name] = []
                  setData(next)
                }}
              >{L('Lägg till kategori','Add category')}</button>
            </div>
            <div className="grid gap-3">
              {Object.keys(data.items.categories||{}).length === 0 && (
                <div className="text-neutral-600 text-sm">{L('Inga kategorier ännu. Lägg till en.','No categories yet. Add one.')}</div>
              )}
              {Object.entries(data.items.categories || {}).map(([catName, itemsArr], cidx) => (
                <div key={catName} className="border rounded p-3 bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      className="border rounded px-2 py-1 flex-1"
                      value={catName}
                      onChange={(e) => {
                        const newName = e.target.value
                        if (!newName) return
                        const next = { ...data }
                        if (newName === catName) return
                        if (Object.prototype.hasOwnProperty.call(next.items.categories, newName)) {
                          alert(L('Ett kategori-namn med samma namn finns redan.','A category with the same name already exists.'))
                          return
                        }
                        const entries = next.items.categories[catName]
                        delete next.items.categories[catName]
                        next.items.categories[newName] = entries
                        setData(next)
                      }}
                    />
                    <button
                      className="btn-outline"
                      onClick={() => {
                        if (!confirm(L('Ta bort kategorin och alla dess objekt?','Delete the category and all its items?'))) return
                        const next = { ...data }
                        delete next.items.categories[catName]
                        setData(next)
                      }}
                    >{L('Ta bort','Remove')}</button>
                    <button
                      className="btn-outline"
                      onClick={() => {
                        const next = { ...data }
                        next.items.categories[catName] = [
                          ...(itemsArr||[]),
                          { img: '', name: { sv: '', en: '' }, type: { sv: '', en: '' }, size: { sv: '', en: '' }, priceSek: '' }
                        ]
                        setData(next)
                      }}
                    >{L('Lägg till objekt','Add item')}</button>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(itemsArr||[]).map((it, idx) => (
                      <div key={idx} className="section-card p-3">
                        <div className="aspect-[4/3] bg-vintage-cream/70 grid place-items-center rounded overflow-hidden mb-2">
                          {it.img ? (
                            <img src={it.img} alt={it.name||'Item'} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-neutral-500 text-sm">{L('Ingen bild','No image')}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <input type="file" accept="image/*" onChange={async (e)=>{
                            const file = e.target.files?.[0]
                            if (!file) return
                            try {
                              const dataUrl = await fileToCompressedDataUrl(file)
                              const next = { ...data }
                              next.items.categories[catName][idx].img = dataUrl
                              setData(next)
                            } catch (err) {
                              alert('Kunde inte läsa bilden. Försök med en annan fil.')
                            }
                          }} />
                          <button className="btn-outline text-xs" onClick={()=>{
                            const next = { ...data }
                            next.items.categories[catName][idx].img = ''
                            setData(next)
                          }}>{L('Rensa','Clear')}</button>
                        </div>
                        <label className="block text-xs text-neutral-600 mb-1">{L('Namn','Name')} ({currentLang.toUpperCase()})</label>
                        <input className="w-full border rounded px-2 py-1 mb-2" value={it.name?.[currentLang] || ''} onChange={(e)=>{const next={...data}; next.items.categories[catName][idx].name = { ...(next.items.categories[catName][idx].name||{}), [currentLang]: e.target.value }; setData(next)}} />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-neutral-600 mb-1">{L('Typ','Type')} ({currentLang.toUpperCase()})</label>
                            <input className="w-full border rounded px-2 py-1" value={it.type?.[currentLang] || ''} onChange={(e)=>{const next={...data}; next.items.categories[catName][idx].type = { ...(next.items.categories[catName][idx].type||{}), [currentLang]: e.target.value }; setData(next)}} />
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-600 mb-1">{L('Storlek','Size')} ({currentLang.toUpperCase()})</label>
                            <input className="w-full border rounded px-2 py-1" value={it.size?.[currentLang] || ''} onChange={(e)=>{const next={...data}; next.items.categories[catName][idx].size = { ...(next.items.categories[catName][idx].size||{}), [currentLang]: e.target.value }; setData(next)}} />
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs text-neutral-600 mb-1">{L('Utropspris (SEK)','Starting price (SEK)')}</label>
                          <input type="number" inputMode="numeric" min="0" className="w-full border rounded px-2 py-1" value={it.priceSek || ''} onChange={(e)=>{const next={...data}; next.items.categories[catName][idx].priceSek = e.target.value; setData(next)}} />
                        </div>
                        <div className="flex justify-end mt-2">
                          <button className="btn-outline" onClick={()=>{
                            const next = { ...data }
                            next.items.categories[catName].splice(idx,1)
                            setData(next)
                          }}>{L('Ta bort','Remove')}</button>
                        </div>
                      </div>
                    ))}
                    {(itemsArr||[]).length === 0 && (
                      <div className="section-card p-3 text-neutral-600 text-sm">{L('Inga objekt i denna kategori ännu.','No items in this category yet.')}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="admin-ratings" title={L('Betyg','Ratings')}>
          <label className="flex items-center gap-2 mb-3">
            <Toggle checked={!!data.ratings?.enabled} onChange={(e)=>{const n={...data}; n.ratings = n.ratings||{}; n.ratings.enabled = e.target.checked; setData(n)}} />
            <span>{L('Aktivera betygssystem (stjärnor)','Enable ratings (stars)')}</span>
          </label>
          <p className="text-sm text-neutral-600">
            {L('När detta är aktiverat visas stjärnbetyg i sektionen Kommande Auktioner och för varje auktionsvara. Backend använder Cloudflare D1.','When enabled, star ratings appear in Upcoming Auctions and for each Auction Item. Backend uses Cloudflare D1.')}
          </p>
        </Section>

        <Section id="admin-terms" title={L('Auktionsvillkor','Terms')}>
          <label className="flex items-center gap-2 mb-3">
            <Toggle checked={!!data.terms.visible} onChange={handleToggle(['terms','visible'])} />
            <span>{L('Visa sektion','Show section')}</span>
          </label>
          {Object.entries(data.terms.blocks).map(([key, val]) => (
            <div key={key} className="mb-4">
              <label className="block text-sm text-neutral-600 mb-1">{key} ({currentLang.toUpperCase()})</label>
              <textarea className="w-full border rounded px-3 py-2 min-h-[100px]" value={val?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.terms.blocks[key] = { ...(n.terms.blocks[key]||{}), [currentLang]: e.target.value }; setData(n)}} />
            </div>
          ))}
        </Section>

        <Section id="admin-instagram" title={L('Instagram','Instagram')}>
          <label className="flex items-center gap-2 mb-3">
            <Toggle checked={!!data.instagram.visible} onChange={handleToggle(['instagram','visible'])} />
            <span>{L('Visa sektion','Show section')}</span>
          </label>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Användarnamn','Username')}</label>
              <input className="w-full border rounded px-3 py-2" value={data.instagram.username || ''} onChange={handleChange(['instagram','username'])} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Token','Token')}</label>
              <input className="w-full border rounded px-3 py-2" value={data.instagram.token || ''} onChange={handleChange(['instagram','token'])} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Layout','Layout')}</label>
              <select className="w-full border rounded px-3 py-2" value={data.instagram.layout} onChange={(e)=>{const n={...data};n.instagram.layout=e.target.value;setData(n)}}>
                <option value="grid">{L('Rutnät','Grid')}</option>
                <option value="carousel">{L('Karusell','Carousel')}</option>
              </select>
            </div>
          </div>
        </Section>

        <Section id="admin-maps" title={L('Google Maps','Google Maps')}>
          <label className="flex items-center gap-2 mb-3">
            <Toggle checked={!!data.maps?.visible} onChange={handleToggle(['maps','visible'])} />
            <span>{L('Visa sektion','Show section')}</span>
          </label>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">API Key</label>
              <input className="w-full border rounded px-3 py-2" value={data.maps?.apiKey || ''} onChange={handleChange(['maps','apiKey'])} placeholder="AIza..." />
              <p className="text-xs text-neutral-500 mt-1">{L('Sätts även som miljövariabel i produktion.','Also set as environment variable in production.')}</p>
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Standard Zoom','Default Zoom')}</label>
              <input type="number" min="1" max="20" className="w-full border rounded px-3 py-2" value={data.maps?.defaultZoom ?? 14} onChange={(e)=>{const n={...data}; n.maps.defaultZoom = parseInt(e.target.value||'14',10); setData(n)}} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Språk','Language')}</label>
              <select className="w-full border rounded px-3 py-2" value={data.maps?.language || 'sv'} onChange={(e)=>{const n={...data}; n.maps.language = e.target.value; setData(n)}}>
                <option value="sv">Svenska</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-neutral-600">
              {L('Tips: Använd Google Cloud Console för att skapa en nyckel och begränsa den till Maps JavaScript & Places API.','Tip: Use Google Cloud Console to create a key and restrict it to Maps JavaScript & Places API.')}
            </p>
          </div>
        </Section>

        <Section id="admin-footer" title={L('Footer','Footer')}>
          <label className="flex items-center gap-2 mb-3">
            <Toggle checked={!!data.footer.visible} onChange={handleToggle(['footer','visible'])} />
            <span>{L('Visa footer','Show footer')}</span>
          </label>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Telefon','Phone')}</label>
              <input className="w-full border rounded px-3 py-2" value={data.footer.phone || ''} onChange={handleChange(['footer','phone'])} />
              <label className="block text-sm text-neutral-600 mt-2 mb-1">{L('Email','Email')}</label>
              <input className="w-full border rounded px-3 py-2" value={data.footer.email || ''} onChange={handleChange(['footer','email'])} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Adress','Address')} ({currentLang.toUpperCase()})</label>
              <textarea className="w-full border rounded px-3 py-2 min-h-[100px]" value={data.footer.address?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.footer.address = { ...(n.footer.address||{}), [currentLang]: e.target.value }; setData(n)}} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Nyhetsbrev','Newsletter')}</label>
              <label className="flex items-center gap-2"><Toggle checked={!!data.footer.newsletter} onChange={handleToggle(['footer','newsletter'])} />{L('Aktivera','Enable')}</label>
            </div>
          </div>
        </Section>

        {/* Bottom actions (duplicate for convenience) */}
        <div className="flex items-center gap-3">
          <button className="btn-primary" onClick={save}>{L('Spara','Save')}</button>
          <button className="btn-outline" onClick={hardReset}>{L('Återställ standard','Reset to defaults')}</button>
        </div>

          </div>
        </div>
      </main>
    </div>
  )
}
