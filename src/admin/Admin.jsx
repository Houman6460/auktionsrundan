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

export default function Admin() {
  const [data, setData] = React.useState(loadContent())
  const [saved, setSaved] = React.useState(false)
  const [authed, setAuthed] = React.useState(() => localStorage.getItem('ar_admin_authed') === '1')
  const [pw, setPw] = React.useState('')
  const [currentLang, setCurrentLang] = React.useState(() => localStorage.getItem('ar_admin_lang') || 'sv')

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

  // Convert an uploaded image to Data URL and store at given path
  const handleFileToDataUrl = (path) => async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const next = { ...data }
      let cur = next
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]]
      cur[path[path.length - 1]] = reader.result
      setData(next)
    }
    reader.readAsDataURL(file)
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
    next.auctions.list.push({ title: 'Ny auktion', address: '', mapEmbed: '', viewing: '', start: '' })
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
    next.hero.nextAuctions.push({ name: 'Ny auktion', date: '2025-12-31' })
    setData(next)
  }

  const removeNextAuction = (idx) => {
    const next = { ...data }
    next.hero.nextAuctions.splice(idx, 1)
    setData(next)
  }

  const save = () => {
    saveContent(data)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    // notify other tabs
    window.dispatchEvent(new StorageEvent('storage', { key: 'ar_site_content_v1' }))
  }

  const hardReset = () => {
    if (!confirm('Återställ till standardinnehåll?')) return
    resetContent()
    setData(loadContent())
  }

  if (!authed) {
    return (
      <div className="min-h-screen grid place-items-center bg-vintage-cream px-4">
        <div className="section-card w-full max-w-sm p-6">
          <h1 className="font-serif text-2xl mb-4">Admin Login</h1>
          <p className="text-sm text-neutral-600 mb-3">Ange lösenord för att fortsätta.</p>
          <form onSubmit={(e)=>{e.preventDefault(); if (pw.trim().length >= 4) { localStorage.setItem('ar_admin_authed','1'); setAuthed(true);} else { alert('Ogiltigt lösenord (minst 4 tecken).') } }}>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 mb-3"
              placeholder="Lösenord"
              value={pw}
              onChange={(e)=>setPw(e.target.value)}
            />
            <button className="btn-primary w-full" type="submit">Logga in</button>
          </form>
          <p className="text-xs text-neutral-500 mt-3">Tips: För demo, valfritt lösenord ≥ 4 tecken.</p>
          <div className="mt-4 text-center">
            <Link to="/" className="underline text-sm">Tillbaka</Link>
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
            <h1 className="font-serif text-xl">Admin</h1>
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
            <Link to="/" className="btn-outline text-sm">Till webbplatsen</Link>
            <button className="btn-primary text-sm" onClick={save}>Spara</button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {saved && <div className="section-card p-3 text-emerald-700 bg-emerald-50 mb-6">Sparat!</div>}

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-3">
            <div className="section-card p-4 sticky top-4 max-h-[80vh] overflow-auto">
              <nav className="flex flex-col gap-2 text-sm">
                <a href="#admin-header" className="hover:underline">Header</a>
                <a href="#admin-hero" className="hover:underline">Hero (Hem)</a>
                <a href="#admin-auctions" className="hover:underline">Kommande Auktioner</a>
                <a href="#admin-items" className="hover:underline">Auktionsvaror</a>
                <a href="#admin-terms" className="hover:underline">Auktionsvillkor</a>
                <a href="#admin-instagram" className="hover:underline">Instagram</a>
                <a href="#admin-footer" className="hover:underline">Footer</a>
                <hr className="my-3" />
                <button className="btn-primary w-full" onClick={save}>Spara</button>
                <button className="btn-outline w-full" onClick={hardReset}>Återställ standard</button>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="col-span-12 md:col-span-9 lg:col-span-9 grid gap-6">

        <Section id="admin-header" title="Header">
          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={!!data.header.visible} onChange={handleToggle(['header','visible'])} />
            <span>Visa header</span>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Logotyp URL</label>
              <input className="w-full border rounded px-3 py-2" value={data.header.logo || ''} onChange={handleChange(['header','logo'])} placeholder="https://..." />
              <div className="mt-2 flex items-center gap-2">
                <input type="file" accept="image/*" onChange={handleFileToDataUrl(['header','logo'])} />
                <button type="button" className="btn-outline text-xs" onClick={clearField(['header','logo'])}>Rensa</button>
              </div>
              {data.header.logo && (
                <div className="mt-2">
                  <img src={data.header.logo} alt="Logotyp" className="h-12 w-auto border rounded bg-white" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Språk aktiva (SV/EN)</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!data.header.languages.sv} onChange={(e)=>{const n={...data};n.header.languages.sv=e.target.checked;setData(n)}} />SV</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!data.header.languages.en} onChange={(e)=>{const n={...data};n.header.languages.en=e.target.checked;setData(n)}} />EN</label>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="font-serif text-lg mb-2">Navigering ({currentLang.toUpperCase()})</h3>
              <label className="block text-sm text-neutral-600 mb-1">Hem</label>
              <input className="w-full border rounded px-3 py-2 mb-2" value={data.header.nav.home?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.header.nav.home[currentLang]=e.target.value; setData(n)}} />
              <label className="block text-sm text-neutral-600 mb-1">Kommande auktioner</label>
              <input className="w-full border rounded px-3 py-2 mb-2" value={data.header.nav.auctions?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.header.nav.auctions[currentLang]=e.target.value; setData(n)}} />
              <label className="block text-sm text-neutral-600 mb-1">Auktionsvaror</label>
              <input className="w-full border rounded px-3 py-2 mb-2" value={data.header.nav.items?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.header.nav.items[currentLang]=e.target.value; setData(n)}} />
              <label className="block text-sm text-neutral-600 mb-1">Auktionsvillkor</label>
              <input className="w-full border rounded px-3 py-2" value={data.header.nav.terms?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.header.nav.terms[currentLang]=e.target.value; setData(n)}} />
            </div>
          </div>
        </Section>

        <Section id="admin-hero" title="Hero (Hem)">
          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={!!data.hero.visible} onChange={handleToggle(['hero','visible'])} />
            <span>Visa hero</span>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Bakgrundsbild URL</label>
              <input className="w-full border rounded px-3 py-2" value={data.hero.bg || ''} onChange={handleChange(['hero','bg'])} placeholder="https://..." />
              <div className="mt-2 flex items-center gap-2">
                <input type="file" accept="image/*" onChange={handleFileToDataUrl(['hero','bg'])} />
                <button type="button" className="btn-outline text-xs" onClick={clearField(['hero','bg'])}>Rensa</button>
              </div>
              {data.hero.bg && (
                <div className="mt-2">
                  <img src={data.hero.bg} alt="Hero bakgrund" className="h-24 w-auto border rounded bg-white object-cover" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">CTA text ({currentLang.toUpperCase()})</label>
              <input className="w-full border rounded px-3 py-2" value={data.hero.cta?.text?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.hero.cta.text[currentLang]=e.target.value; setData(n)}} />
              <label className="block text-sm text-neutral-600 mt-2 mb-1">CTA länk</label>
              <input className="w-full border rounded px-3 py-2" value={data.hero.cta?.link || ''} onChange={(e)=>{const n={...data};n.hero.cta.link=e.target.value;setData(n)}} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg">Nästa Auktion(er)</h3>
              <button className="btn-outline text-sm" onClick={addNextAuction}>Lägg till</button>
            </div>
            <div className="grid gap-3">
              {(data.hero.nextAuctions||[]).map((a, idx) => (
                <div key={idx} className="grid md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Namn</label>
                    <input className="w-full border rounded px-3 py-2" value={a.name} onChange={(e)=>{const n={...data};n.hero.nextAuctions[idx].name=e.target.value;setData(n)}} />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Datum</label>
                    <input type="date" className="w-full border rounded px-3 py-2" value={a.date} onChange={(e)=>{const n={...data};n.hero.nextAuctions[idx].date=e.target.value;setData(n)}} />
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-outline" onClick={()=>removeNextAuction(idx)}>Ta bort</button>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm text-neutral-600 mb-1">Google Maps Embed URL</label>
                    <input className="w-full border rounded px-3 py-2" placeholder="https://www.google.com/maps?....&output=embed" value={a.mapEmbed || ''} onChange={(e)=>{const n={...data};n.hero.nextAuctions[idx].mapEmbed=e.target.value;setData(n)}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="admin-auctions" title="Kommande Auktioner">
          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={!!data.auctions.visible} onChange={handleToggle(['auctions','visible'])} />
            <span>Visa sektion</span>
          </label>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-lg">Händelser</h3>
            <button className="btn-outline text-sm" onClick={addAuction}>Lägg till auktion</button>
          </div>
          <div className="grid gap-4">
            {(data.auctions.list||[]).map((a, idx) => (
              <div key={idx} className="section-card p-4 grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Titel</label>
                  <input className="w-full border rounded px-3 py-2" value={a.title} onChange={(e)=>updateAuction(idx,'title',e.target.value)} />
                  <label className="block text-sm text-neutral-600 mt-2 mb-1">Adress</label>
                  <input className="w-full border rounded px-3 py-2" value={a.address} onChange={(e)=>updateAuction(idx,'address',e.target.value)} />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Visning</label>
                      <input className="w-full border rounded px-3 py-2" value={a.viewing} onChange={(e)=>updateAuction(idx,'viewing',e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Start</label>
                      <input className="w-full border rounded px-3 py-2" value={a.start} onChange={(e)=>updateAuction(idx,'start',e.target.value)} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Google Maps Embed URL</label>
                  <input className="w-full border rounded px-3 py-2" value={a.mapEmbed} onChange={(e)=>updateAuction(idx,'mapEmbed',e.target.value)} placeholder="https://www.google.com/maps?...&output=embed" />
                  <div className="mt-3 flex gap-2">
                    <button className="btn-outline" onClick={()=>removeAuction(idx)}>Ta bort</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="admin-items" title="Auktionsvaror">
          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={!!data.items.visible} onChange={handleToggle(['items','visible'])} />
            <span>Visa sektion</span>
          </label>
          <p className="text-sm text-neutral-600">Lägg till objekt per kategori med bild-URL, namn, typ och storlek.</p>
          {/* Minimal editor: demonstrates structure; can be expanded later. */}
        </Section>

        <Section id="admin-terms" title="Auktionsvillkor">
          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={!!data.terms.visible} onChange={handleToggle(['terms','visible'])} />
            <span>Visa sektion</span>
          </label>
          {Object.entries(data.terms.blocks).map(([key, val]) => (
            <div key={key} className="mb-4">
              <label className="block text-sm text-neutral-600 mb-1">{key}</label>
              <textarea className="w-full border rounded px-3 py-2 min-h-[100px]" value={val} onChange={(e)=>{const n={...data};n.terms.blocks[key]=e.target.value;setData(n)}} />
            </div>
          ))}
        </Section>

        <Section id="admin-instagram" title="Instagram">
          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={!!data.instagram.visible} onChange={handleToggle(['instagram','visible'])} />
            <span>Visa sektion</span>
          </label>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Användarnamn</label>
              <input className="w-full border rounded px-3 py-2" value={data.instagram.username || ''} onChange={handleChange(['instagram','username'])} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Token</label>
              <input className="w-full border rounded px-3 py-2" value={data.instagram.token || ''} onChange={handleChange(['instagram','token'])} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Layout</label>
              <select className="w-full border rounded px-3 py-2" value={data.instagram.layout} onChange={(e)=>{const n={...data};n.instagram.layout=e.target.value;setData(n)}}>
                <option value="grid">Grid</option>
                <option value="carousel">Carousel</option>
              </select>
            </div>
          </div>
        </Section>

        <Section id="admin-footer" title="Footer">
          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={!!data.footer.visible} onChange={handleToggle(['footer','visible'])} />
            <span>Visa footer</span>
          </label>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Telefon</label>
              <input className="w-full border rounded px-3 py-2" value={data.footer.phone || ''} onChange={handleChange(['footer','phone'])} />
              <label className="block text-sm text-neutral-600 mt-2 mb-1">Email</label>
              <input className="w-full border rounded px-3 py-2" value={data.footer.email || ''} onChange={handleChange(['footer','email'])} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Adress</label>
              <textarea className="w-full border rounded px-3 py-2 min-h-[100px]" value={data.footer.address || ''} onChange={handleChange(['footer','address'])} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Nyhetsbrev</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!data.footer.newsletter} onChange={handleToggle(['footer','newsletter'])} />Aktivera</label>
            </div>
          </div>
        </Section>

        {/* Bottom actions (duplicate for convenience) */}
        <div className="flex items-center gap-3">
          <button className="btn-primary" onClick={save}>Spara</button>
          <button className="btn-outline" onClick={hardReset}>Återställ standard</button>
        </div>

          </div>
        </div>
      </main>
    </div>
  )
}
