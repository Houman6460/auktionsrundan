import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadContent, saveContent } from '../services/store'

function Countdown({ startIso }) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const ts = Date.parse(startIso)
  const diff = Math.max(0, ts - now)
  const s = Math.floor(diff / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return <div className="font-mono text-2xl">{d}d {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(sec).padStart(2,'0')}</div>
}

// Ensure the lottie-player script is present (web component loader)
function useLottiePlayer() {
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      if (window.customElements && window.customElements.get('lottie-player')) return
      const existing = document.querySelector('script[data-lottie-player]')
      if (existing) return
      const s = document.createElement('script')
      s.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js'
      s.async = true
      s.defer = true
      s.setAttribute('data-lottie-player', '1')
      document.head.appendChild(s)
    } catch {}
  }, [])
}

// Small overlay that plays once to frame 50 and freezes there
function SoldStamp({ play = false, size = 120 }) {
  const ref = React.useRef(null)
  useLottiePlayer()
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const STOP = 50
    let lottie = null
    const ready = () => {
      try {
        lottie = el.getLottie && el.getLottie()
        if (!lottie) return
        if (play) {
          try { lottie.playSegments && lottie.playSegments([0, STOP], true) } catch { try { lottie.play && lottie.play() } catch {} }
          const onEnter = () => {
            try {
              if (lottie.currentFrame >= STOP) {
                lottie.goToAndStop(STOP, true)
                try { lottie.removeEventListener('enterFrame', onEnter) } catch {}
              }
            } catch {}
          }
          try { lottie.addEventListener('enterFrame', onEnter) } catch {}
          const onComplete = () => { try { lottie.goToAndStop(STOP, true) } catch {} }
          try { lottie.addEventListener('complete', onComplete) } catch {}
        } else {
          // If already sold: show static frame
          try { lottie.goToAndStop(STOP, true) } catch {}
        }
      } catch {}
    }
    // If already ready, call immediately; also listen for ready event
    try {
      if (el.getLottie && el.getLottie()) { ready() }
      el.addEventListener('ready', ready)
      el.addEventListener('load', ready)
    } catch {}
    return () => {
      try { el.removeEventListener('ready', ready) } catch {}
      try { el.removeEventListener('load', ready) } catch {}
    }
  }, [play])
  return (
    <lottie-player
      ref={ref}
      {...(play ? { autoplay: true } : {})}
      mode="normal"
      src="/lottie/sold-at-auction.json"
      style={{ width: size + 'px', height: size + 'px' }}
      aria-label="Sold animation"
    />
  )
}

// Localized region label helper
function regionLabel(code, lang) {
  try {
    if (!code) return ''
    const dn = new Intl.DisplayNames([lang === 'en' ? 'en' : 'sv'], { type: 'region' })
    return dn.of(code) || code
  } catch { return code || '' }
}

export default function LiveAction() {
  const { id } = useParams()
  const { i18n } = useTranslation()
  const lang = (i18n?.language === 'en') ? 'en' : 'sv'
  const tl = (sv, en) => (lang === 'en' ? en : sv)
  const pick = (bi) => (bi && (bi[lang] || bi.sv || bi.en)) || ''
  const [content, setContent] = React.useState(loadContent())
  const [tick, setTick] = React.useState(0)
  const [submitted, setSubmitted] = React.useState(false)
  const [fb, setFb] = React.useState({ overall: 0, interested: [], timePlace: '', foundLocation: '', categories: '', notes: '', consent: false, name: '', email: '', tel: '' })
  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || e.key === 'ar_site_content_v1') setContent(loadContent())
    }
    window.addEventListener('storage', onStorage)
    const t = setInterval(() => setTick((x)=>x+1), 1000)
    let ch
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        ch = new BroadcastChannel('ar_content_sync')
        ch.onmessage = (msg) => {
          try {
            if (!msg || (msg.data && msg.data.key === 'ar_site_content_v1')) {
              setContent(loadContent())
            }
          } catch {}
        }
      }
    } catch {}
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(t)
      try { if (ch) ch.close() } catch {}
    }
  }, [])

  // Poll remote content revision via Cloudflare Function to sync across devices without refresh
  React.useEffect(() => {
    let p = 0
    const poll = async () => {
      try {
        const revRes = await fetch('/api/content?revOnly=1', { cache: 'no-store' })
        if (!revRes.ok) return
        const revData = await revRes.json().catch(()=>({}))
        const remoteRev = Number(revData.rev || 0)
        const localRev = Number(localStorage.getItem('ar_content_rev') || 0)
        if (remoteRev > localRev) {
          const fullRes = await fetch('/api/content', { cache: 'no-store' })
          if (!fullRes.ok) return
          const payload = await fullRes.json().catch(()=>({}))
          if (payload && payload.content) {
            try { localStorage.setItem('ar_site_content_v1', JSON.stringify(payload.content)) } catch {}
            try { localStorage.setItem('ar_content_rev', String(payload.rev || remoteRev)) } catch {}
            try { window.dispatchEvent(new StorageEvent('storage', { key: 'ar_site_content_v1' })) } catch {}
            setContent(loadContent())
          }
        }
      } catch {}
    }
    poll()
    p = window.setInterval(poll, 8000)
    return () => { if (p) window.clearInterval(p) }
  }, [])

  const actions = content.actions || { order: [], events: {} }
  const event = actions.events?.[id]
  const auctions = Array.isArray(content.auctions?.list) ? content.auctions.list : []

  if (!event) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="section-card p-6">
          <h1 className="font-serif text-2xl mb-2">{tl('Event saknas','Event not found')}</h1>
          <p className="text-neutral-600">{tl('Hittade inget event med id','No event found with id')} "{id}".</p>
          <div className="mt-4"><Link to="/" className="underline">{tl('Till startsidan','Back to home')}</Link></div>
        </div>
      </main>
    )
  }

  const linked = Number.isInteger(event.linkedAuctionIndex) && event.linkedAuctionIndex >= 0 && event.linkedAuctionIndex < auctions.length
  const linkedAuction = linked ? auctions[event.linkedAuctionIndex] : null
  const startIso = (() => {
    if (linked && linkedAuction?.date) {
      const t = (typeof linkedAuction.start === 'string' && /\d{1,2}:\d{2}/.test(linkedAuction.start)) ? linkedAuction.start : '00:00'
      return `${linkedAuction.date}T${t}:00`
    }
    return event.startIso || ''
  })()
  const started = !!event.state?.started
  const items = Array.isArray(event.items) ? event.items : []
  const currentIndex = Number.isInteger(event.state?.currentIndex) ? event.state.currentIndex : -1
  const currentItem = (currentIndex >= 0 && currentIndex < items.length) ? items[currentIndex] : null
  const prevItems = items.slice(0, Math.max(0, currentIndex))

  const total = items.reduce((sum, it) => sum + (it.sold ? (parseFloat(it.finalPrice) || 0) : 0), 0)
  const titleText = linked ? pick(linkedAuction?.title) : pick(event.title)
  const addrText = linked ? pick(linkedAuction?.address) : ''
  const viewingText = linked ? pick(linkedAuction?.viewing) : ''
  const startTimeText = linked ? (linkedAuction?.start || '') : (startIso ? startIso.slice(11,16) : '')
  const showTotals = event.settings?.publicDisplay?.showTotals !== false
  const showSold = event.settings?.publicDisplay?.showSold !== false
  const durationMs = Math.max(1, parseInt(event.settings?.durationMinutes||60, 10)) * 60000
  const postMs = Math.max(0, parseInt(event.settings?.postMinutes||10, 10)) * 60000
  const now = Date.now()
  const startedAt = event.state?.startedAt || 0
  const endedAt = event.state?.endedAt || 0
  const isWithinAction = startedAt > 0 && endedAt === 0
  const isWithinPost = endedAt > 0 && (now - endedAt) < postMs
  const postRemaining = Math.max(0, postMs - (now - endedAt))

  // Track sold animation play state: play once when item becomes sold; static if already sold
  const soldPrevRef = React.useRef({ idx: -1, sold: false })
  const [soldKey, setSoldKey] = React.useState(0)
  const [soldMode, setSoldMode] = React.useState('static') // 'play' | 'static'
  React.useEffect(() => {
    const idx = currentIndex
    const curSold = !!currentItem?.sold
    const prev = soldPrevRef.current
    const justBecame = curSold && (prev.idx === idx) && !prev.sold
    if (justBecame) {
      setSoldMode('play'); setSoldKey((k)=>k+1)
    } else if (curSold && prev.idx !== idx) {
      // switched to a different already-sold item
      setSoldMode('static'); setSoldKey((k)=>k+1)
    }
    soldPrevRef.current = { idx, sold: curSold }
  }, [currentIndex, currentItem?.sold])

  const toggleInterested = (idx) => {
    setFb((s) => ({ ...s, interested: s.interested.includes(idx) ? s.interested.filter(i=>i!==idx) : [...s.interested, idx] }))
  }

  const submitFeedback = (e) => {
    e.preventDefault()
    try {
      const next = loadContent()
      const ev = next.actions?.events?.[id]
      if (!ev) return
      ev.feedbackSubmissions = Array.isArray(ev.feedbackSubmissions) ? ev.feedbackSubmissions : []
      const payload = {
        ts: Date.now(),
        lang,
        overall: fb.overall,
        interested: fb.interested.slice(),
        timePlace: fb.timePlace,
        foundLocation: fb.foundLocation,
        categories: fb.categories,
        notes: fb.notes,
        consent: !!fb.consent,
        name: fb.consent ? fb.name.trim() : '',
        email: fb.consent ? fb.email.trim() : '',
        tel: fb.consent ? fb.tel.trim() : '',
      }
      ev.feedbackSubmissions.push(payload)
      saveContent(next)
      window.dispatchEvent(new StorageEvent('storage', { key: 'ar_site_content_v1' }))
      setSubmitted(true)
    } catch {}
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid gap-6">
        <header className="section-card p-5">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-2xl">{titleText || tl('Live Auktion','Live Auction')}</h1>
            {showTotals && (
              <div className="text-sm text-neutral-700">{tl('Totalt','Total')}: <span className="font-medium">{total.toLocaleString('sv-SE')} SEK</span></div>
            )}
          </div>
          {linked && (
            <div className="mt-2 grid md:grid-cols-3 gap-2 text-sm text-neutral-700">
              {!!addrText && <div><span className="text-neutral-500">{tl('Adress','Address')}:</span> {addrText}</div>}
              {!!viewingText && <div><span className="text-neutral-500">{tl('Visning','Viewing')}:</span> {viewingText}</div>}
              {!!startTimeText && <div><span className="text-neutral-500">{tl('Start','Start')}:</span> {startTimeText}</div>}
            </div>
          )}
          {startIso && !started && (
            <div className="mt-2">
              <div className="text-neutral-600 text-sm">{tl('Startar','Starts in')}</div>
              <Countdown startIso={startIso} />
            </div>
          )}
          {started && (
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div className="p-2 bg-vintage-cream/60 rounded"><div className="text-neutral-600">{tl('Visade','Revealed')}</div><div className="font-medium">{Math.max(0, currentIndex+1)}</div></div>
              {showSold && <div className="p-2 bg-vintage-cream/60 rounded"><div className="text-neutral-600">{tl('Sålda','Sold')}</div><div className="font-medium">{items.filter(i=>i.sold).length}</div></div>}
              {showTotals && <div className="p-2 bg-vintage-cream/60 rounded"><div className="text-neutral-600">{tl('Summa','Total')}</div><div className="font-medium">{total.toLocaleString('sv-SE')} SEK</div></div>}
            </div>
          )}
        </header>

        {started ? (
          <section className="grid gap-6">
            <div className="section-card p-5">
              <div className="text-neutral-600 text-sm mb-2">{tl('Pågående','Now showing')}</div>
              {currentItem ? (
                <div className="grid md:grid-cols-2 gap-4 items-start">
                  <div className="aspect-[4/3] bg-vintage-cream/70 rounded grid place-items-center text-neutral-500 relative">
                    {currentItem.img ? (
                      <img src={currentItem.img} alt={pick(currentItem.title)} className="w-full h-full object-cover rounded" />
                    ) : (
                      <span>{tl('Ingen bild','No image')}</span>
                    )}
                    {showSold && currentItem.sold && (
                      <div className="absolute top-2 left-2 z-20 pointer-events-none">
                        <SoldStamp key={soldKey} play={soldMode==='play'} size={120} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-serif text-xl">{pick(currentItem.title) || tl('Vara','Item')}</h2>
                    {!!pick(currentItem.desc) && (
                      <div className="text-neutral-700 mt-2 whitespace-pre-wrap">{pick(currentItem.desc)}</div>
                    )}
                    {/* Artist and Country (optional) */}
                    {(() => {
                      const artistText = pick(currentItem.artist)
                      const countryText = currentItem.country ? regionLabel(currentItem.country, lang) : ''
                      return (
                        <>
                          {!!artistText && (
                            <div className="text-neutral-700 mt-1">{tl('Konstnär','Artist')}: {artistText}</div>
                          )}
                          {!!countryText && (
                            <div className="text-neutral-700 mt-1">{tl('Land','Country')}: {countryText}</div>
                          )}
                        </>
                      )
                    })()}
                    {!!currentItem.startPrice && (
                      <div className="text-neutral-700 mt-1">{tl('Utropspris','Start price')}: {currentItem.startPrice} SEK</div>
                    )}
                    {showSold && currentItem.sold ? (
                      <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 rounded bg-emerald-600 text-white">
                        <span className="text-xs font-semibold">{tl('SÅLD','SOLD')}</span>
                        <span className="text-xs">{parseFloat(currentItem.finalPrice||0).toLocaleString('sv-SE')} SEK</span>
                      </div>
                    ) : showSold && currentItem.unsold ? (
                      <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 rounded bg-neutral-500 text-white">
                        <span className="text-xs font-semibold">{tl('EJ SÅLD','NOT SOLD')}</span>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-neutral-600">{tl('Väntar på försäljning...','Waiting for sale...')}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-neutral-600">{tl('Inget föremål visas just nu.','No item is shown right now.')}</div>
              )}
            </div>

            <div className="section-card p-5">
              <div className="text-neutral-600 text-sm mb-2">{tl('Tidigare visade','Previously shown')}</div>
              {prevItems.length === 0 && (
                <div className="text-neutral-600 text-sm">{tl('Inga ännu.','None yet.')}</div>
              )}
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {prevItems.map((it, i) => (
                  <div key={i} className="border rounded overflow-hidden">
                    <div className="aspect-[4/3] bg-vintage-cream/70 grid place-items-center text-neutral-500">
                      {it.img ? (
                        <img src={it.img} alt={pick(it.title)} className="w-full h-full object-cover" />
                      ) : (
                        <span>{tl('Ingen bild','No image')}</span>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="font-medium truncate">{pick(it.title) || tl('Vara','Item')}</div>
                      {/* optional artist/country line */}
                      {(() => {
                        const artistText = pick(it.artist)
                        const countryText = it.country ? regionLabel(it.country, lang) : ''
                        const line = [artistText, countryText].filter(Boolean).join(' · ')
                        return line ? (
                          <div className="text-[11px] text-neutral-600 mt-1 truncate">{line}</div>
                        ) : null
                      })()}
                      <div className="text-xs text-neutral-600 mt-1">
                        {showSold && it.sold ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">{tl('SÅLD','SOLD')} · {parseFloat(it.finalPrice||0).toLocaleString('sv-SE')} SEK</span>
                        ) : showSold && it.unsold ? (
                          <span className="inline-flex items-center gap-1 text-neutral-600">{tl('EJ SÅLD','NOT SOLD')}</span>
                        ) : (
                          <span>{tl('Visad','Shown')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="section-card p-5">
            <p className="text-neutral-700">{tl('Livesändningen börjar när nedräkningen är klar. Välkommen då!','The live show starts when the countdown reaches zero. Welcome!')}</p>
            <div className="mt-3"><Link to="/" className="underline">{tl('Till startsidan','Back to home')}</Link></div>
          </section>
        )}

        {/* Post-action feedback window */}
        {!started && endedAt > 0 && (
          <section className="section-card p-5">
            <h2 className="font-serif text-xl mb-2">{pick(event.settings?.messages?.thankYou) || tl('Tack! Vi uppskattar din feedback.','Thank you! We appreciate your feedback.')}</h2>
            {isWithinPost ? (
              <>
                <div className="text-sm text-neutral-700 mb-3">{tl('Feedbackfönstret stänger om','Feedback window closes in')}: {Math.floor(postRemaining/60000)}:{String(Math.floor((postRemaining%60000)/1000)).padStart(2,'0')}</div>
                {!submitted ? (
                  <form onSubmit={submitFeedback} className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-neutral-600 mb-1">{tl('Hur var din upplevelse?','How was your overall experience?')}</label>
                      <div className="flex items-center gap-2">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} type="button" aria-label={`star-${n}`} onClick={()=>setFb(s=>({...s, overall:n}))} className={`text-2xl ${fb.overall>=n?'text-amber-500':'text-neutral-400'}`}>★</button>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-neutral-600 mb-1">{tl('Vilka produkter intresserade dig mest?','Which products interested you most?')}</label>
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {items.map((it, i)=> (
                          <label key={i} className={`border rounded overflow-hidden cursor-pointer ${fb.interested.includes(i)?'ring-2 ring-earth-dark':''}`}>
                            <input type="checkbox" className="sr-only" checked={fb.interested.includes(i)} onChange={()=>toggleInterested(i)} />
                            <div className="aspect-[4/3] bg-neutral-100 grid place-items-center">
                              {it.img ? <img src={it.img} alt={pick(it.title)} className="w-full h-full object-cover"/> : <span className="text-neutral-500">{tl('Ingen bild','No image')}</span>}
                            </div>
                            <div className="p-2 text-sm">{pick(it.title)}</div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">{tl('Var tid och plats bra?','Was the event time and location convenient?')}</label>
                      <select className="w-full border rounded px-3 py-2" value={fb.timePlace} onChange={(e)=>setFb(s=>({...s, timePlace:e.target.value}))}>
                        <option value="">—</option>
                        <option value="yes">{tl('Ja','Yes')}</option>
                        <option value="no">{tl('Nej','No')}</option>
                        <option value="idk">{tl('Vet ej','I don\'t know')}</option>
                        <option value="better">{tl('Kan bli bättre','It could be better')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">{tl('Hittade du platsen enkelt?','Could you find the location easily?')}</label>
                      <select className="w-full border rounded px-3 py-2" value={fb.foundLocation} onChange={(e)=>setFb(s=>({...s, foundLocation:e.target.value}))}>
                        <option value="">—</option>
                        <option value="yes">{tl('Ja','Yes')}</option>
                        <option value="no">{tl('Nej','No')}</option>
                        <option value="idk">{tl('Vet ej','I don\'t know')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">{tl('Vilka typer av produkter är du mest intresserad av?','What types of products are you most interested in?')}</label>
                      <input className="w-full border rounded px-3 py-2" value={fb.categories} onChange={(e)=>setFb(s=>({...s, categories:e.target.value}))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-neutral-600 mb-1">{tl('Vad kan vi förbättra?','What can we improve for the future?')}</label>
                      <textarea className="w-full border rounded px-3 py-2 min-h-[100px]" value={fb.notes} onChange={(e)=>setFb(s=>({...s, notes:e.target.value}))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                        <input type="checkbox" checked={fb.consent} onChange={(e)=>setFb(s=>({...s, consent:e.target.checked}))} />
                        <span>{tl('Jag vill bli meddelad om nästa Action i mitt område','I\'d like to be notified of your next Action')}</span>
                      </label>
                      <div className="grid md:grid-cols-3 gap-3 mt-2">
                        <input disabled={!fb.consent} placeholder={tl('Namn','Name')} className="w-full border rounded px-3 py-2" value={fb.name} onChange={(e)=>setFb(s=>({...s, name:e.target.value}))} />
                        <input disabled={!fb.consent} placeholder="Email" className="w-full border rounded px-3 py-2" value={fb.email} onChange={(e)=>setFb(s=>({...s, email:e.target.value}))} />
                        <input disabled={!fb.consent} placeholder={tl('Telefon','Phone')} className="w-full border rounded px-3 py-2" value={fb.tel} onChange={(e)=>setFb(s=>({...s, tel:e.target.value}))} />
                      </div>
                    </div>
                    <div className="md:col-span-2 flex items-center justify-between">
                      <div className="text-xs text-neutral-500">{tl('Vi lagrar kontaktuppgifter endast med samtycke.','We only store contact info with consent.')}</div>
                      <button type="submit" className="btn-primary">{tl('Skicka feedback','Submit feedback')}</button>
                    </div>
                  </form>
                ) : (
                  <div className="text-emerald-700">{tl('Tack! Vi tar med oss dina svar.','Thank you! We\'ll consider your feedback.')}</div>
                )}
              </>
            ) : (
              <div className="text-neutral-600">{tl('Feedbackfönstret är stängt.','The feedback window is closed.')}</div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
