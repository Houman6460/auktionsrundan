import React from 'react'
import { loadContent, saveContent } from '../services/store'

function ensureActions(data) {
  const next = { ...data }
  if (!next.actions || typeof next.actions !== 'object') next.actions = { order: [], events: {} }
  if (!Array.isArray(next.actions.order)) next.actions.order = []
  if (!next.actions.events || typeof next.actions.events !== 'object') next.actions.events = {}
  return next
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function upsert(data, setData, updater) {
  const next = ensureActions({ ...data })
  updater(next)
  setData(next)
}

function saveNow(data) {
  try {
    saveContent(data)
    window.dispatchEvent(new StorageEvent('storage', { key: 'ar_site_content_v1' }))
  } catch {}
}

// --- CSV helpers (lightweight) ---
function csvEscape(value) {
  const str = String(value ?? '')
  return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str
}

function csvParse(text) {
  // Returns array of rows (array of strings). Handles quotes and escaped quotes.
  const rows = []
  let i = 0, cur = '', row = [], inQuotes = false
  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i+1] === '"') { cur += '"'; i += 2; continue }
        inQuotes = false; i++; continue
      }
      cur += ch; i++; continue
    } else {
      if (ch === '"') { inQuotes = true; i++; continue }
      if (ch === ',') { row.push(cur); cur = ''; i++; continue }
      if (ch === '\n' || ch === '\r') {
        // finalize row (support CRLF/CR)
        if (ch === '\r' && text[i+1] === '\n') i++
        row.push(cur); rows.push(row); row = []; cur = ''; i++; continue
      }
      cur += ch; i++
    }
  }
  // flush last
  row.push(cur); rows.push(row)
  // Trim possible trailing empty row
  if (rows.length && rows[rows.length-1].length === 1 && rows[rows.length-1][0] === '') rows.pop()
  return rows
}

function downloadBlob(filename, mime, data) {
  const blob = new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// --- Country helpers ---
function getRegionCodes(sortLang = 'sv') {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      const list = Intl.supportedValuesOf('region')
      if (Array.isArray(list) && list.length) {
        const codes = list.filter(c => /^[A-Z]{2}$/.test(c))
        // stable sort by localized label for better UX
        return codes.sort((a,b) => (regionLabel(a, sortLang) || a).localeCompare(regionLabel(b, sortLang) || b, sortLang))
      }
    }
  } catch {}
  // Fallback to a practical subset
  const fallback = ['SE','NO','DK','FI','IS','DE','FR','NL','BE','LU','GB','IE','ES','PT','IT','GR','PL','CZ','SK','AT','CH','EE','LV','LT','HU','RO','BG','HR','SI','RS','BA','ME','MK','AL','UA','MD','BY','GE','AM','AZ','TR','US','CA','MX','BR','AR','CL','CO','PE','UY','AU','NZ','JP','CN','KR','IN','AE','SA','EG','MA','TN','ZA']
  return fallback.sort((a,b)=>a.localeCompare(b))
}
function regionLabel(code, lang) {
  try {
    const dn = new Intl.DisplayNames([lang === 'en' ? 'en' : 'sv'], { type: 'region' })
    return dn.of(code) || code
  } catch {
    return code
  }
}

// Switch-style toggle (same look & feel as Admin)
function Toggle({ checked, onChange, id, disabled, title }) {
  const S = { box: 'w-10 h-6', knob: 'w-4 h-4', move: 'peer-checked:translate-x-4', inset: 'top-1 left-1' }
  return (
    <label htmlFor={id} title={title} className={`relative inline-flex items-center ${S.box} cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      <input id={id} type="checkbox" className="sr-only peer" checked={!!checked} onChange={onChange} disabled={disabled} />
      <span aria-hidden className={`absolute inset-0 rounded-full bg-neutral-300 transition-colors peer-checked:bg-earth-dark peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-earth-dark/30`}></span>
      <span aria-hidden className={`absolute ${S.inset} ${S.knob} bg-white rounded-full shadow transition-transform ${S.move}`}></span>
    </label>
  )
}

export default function LiveActionAdmin({ data, setData, L }) {
  const [linkCopied, setLinkCopied] = React.useState(null)
  const [activeEventId, setActiveEventId] = React.useState(null)
  const [dragging, setDragging] = React.useState({ eventId: null, from: -1 })

  const actions = (data.actions && typeof data.actions === 'object') ? data.actions : { order: [], events: {} }
  const auctionsList = (data.auctions && Array.isArray(data.auctions.list)) ? data.auctions.list : []

  const auctionLabel = (a) => {
    const title = (a?.title?.sv || a?.title?.en || '').trim() || L('Namnlös','Untitled')
    const date = a?.date || ''
    const time = a?.start || ''
    return `${title}${date ? ' — '+date : ''}${time ? ' '+time : ''}`
  }

  const auctionStartIso = (a) => {
    try {
      if (!a?.date) return ''
      const t = (/\d{1,2}:\d{2}/.test(a.start||'')) ? a.start : '00:00'
      return `${a.date}T${t}:00`
    } catch { return '' }
  }
  const createEvent = () => {
    upsert(data, setData, (next) => {
      const id = 'act-' + Date.now()
      next.actions.events[id] = {
        id,
        title: { sv: L('Nytt Live Event','New Live Event'), en: 'New Live Event' },
        startIso: '',
        visible: false,
        linkedAuctionIndex: null,
        items: [],
        settings: {
          durationMinutes: 60,
          postMinutes: 10,
          publicDisplay: { showTotals: true, showSold: true },
          feedback: { enabled: true, rating: true, notes: true, contact: true },
          messages: { thankYou: { sv: 'Tack! Vi uppskattar din feedback.', en: 'Thank you! We appreciate your feedback.' } }
        },
        state: { started: false, currentIndex: -1, startedAt: 0, endedAt: 0, salesLog: [] },
        feedbackSubmissions: []
      }
      if (!next.actions.order.includes(id)) next.actions.order.unshift(id)
      saveNow(next)
    })
  }

  const removeEvent = (id) => {
    if (!confirm(L('Ta bort detta event?','Delete this event?'))) return
    upsert(data, setData, (next) => {
      delete next.actions.events[id]
      next.actions.order = (next.actions.order || []).filter(x => x !== id)
      saveNow(next)
    })
  }

  const updateField = (id, path, value) => {
    upsert(data, setData, (next) => {
      let cur = next.actions.events[id]
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]]
      cur[path[path.length - 1]] = value
      saveNow(next)
    })
  }

  const setStart = (id, dateStr, timeStr) => {
    const tStr = (/\d{1,2}:\d{2}/.test(timeStr||'')) ? timeStr : '00:00'
    const iso = dateStr ? `${dateStr}T${tStr}:00` : ''
    updateField(id, ['startIso'], iso)
  }

  const linkAuction = (id, idx) => {
    upsert(data, setData, (next) => {
      const ev = next.actions.events[id]
      ev.linkedAuctionIndex = (Number.isInteger(idx) && idx >= 0) ? idx : null
      // When linking, we can clear manual startIso; countdown will derive from auction
      if (ev.linkedAuctionIndex != null) ev.startIso = ''
      saveNow(next)
    })
  }

  const addItem = (id) => {
    upsert(data, setData, (next) => {
      const ev = next.actions.events[id]
      ev.items = Array.isArray(ev.items) ? ev.items : []
      ev.items.push({ title: { sv: 'Ny vara', en: 'New item' }, desc: { sv: '', en: '' }, artist: { sv: '', en: '' }, country: '', tags: [], startPrice: '', img: '', sold: false, finalPrice: '' })
      saveNow(next)
    })
  }

  const removeItem = (id, idx) => {
    upsert(data, setData, (next) => {
      const ev = next.actions.events[id]
      ev.items.splice(idx, 1)
      saveNow(next)
    })
  }

  const moveItem = (id, idx, dir) => {
    upsert(data, setData, (next) => {
      const ev = next.actions.events[id]
      const arr = ev.items
      const j = idx + dir
      if (j < 0 || j >= arr.length) return
      const tmp = arr[idx]
      arr[idx] = arr[j]
      arr[j] = tmp
      saveNow(next)
    })
  }

  const dragStart = (eventId, idx) => (e) => {
    setDragging({ eventId, from: idx })
    try { e.dataTransfer.effectAllowed = 'move' } catch {}
  }
  const dragOver = (idx) => (e) => {
    e.preventDefault()
    try { e.dataTransfer.dropEffect = 'move' } catch {}
  }
  const dropOn = (eventId, to) => (e) => {
    e.preventDefault()
    const { eventId: evId, from } = dragging
    setDragging({ eventId: null, from: -1 })
    if (evId !== eventId || from === -1 || from === to) return
    upsert(data, setData, (next) => {
      const ev = next.actions.events[eventId]
      const arr = ev.items
      const item = arr.splice(from, 1)[0]
      arr.splice(to, 0, item)
      saveNow(next)
    })
  }

  async function fileToCompressedDataUrl(file, maxDim = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const w = img.naturalWidth || img.width
          const h = img.naturalHeight || img.height
          let tw = w, th = h
          if (w > h && w > maxDim) { tw = maxDim; th = Math.round(h * (maxDim / w)) }
          else if (h >= w && h > maxDim) { th = maxDim; tw = Math.round(w * (maxDim / h)) }
          const canvas = document.createElement('canvas')
          canvas.width = tw; canvas.height = th
          const ctx = canvas.getContext('2d')
          const type = (file && file.type) ? file.type.toLowerCase() : ''
          if (type.includes('svg')) return resolve(reader.result)
          if (type.includes('png')) { ctx.drawImage(img, 0, 0, tw, th); try { return resolve(canvas.toDataURL('image/png')) } catch { return resolve(canvas.toDataURL()) } }
          ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,tw,th); ctx.restore()
          ctx.drawImage(img, 0, 0, tw, th)
          try { resolve(canvas.toDataURL('image/jpeg', quality)) } catch { resolve(canvas.toDataURL()) }
        }
        img.onerror = () => resolve(reader.result)
        img.src = reader.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const uploadImg = async (id, idx, file) => {
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      upsert(data, setData, (next) => {
        const ev = next.actions.events[id]
        ev.items[idx].img = dataUrl
        saveNow(next)
      })
    } catch {}
  }

  const startEvent = (id) => {
    upsert(data, setData, (next) => {
      const ev = next.actions.events[id]
      ev.state = ev.state || { started: false, currentIndex: -1 }
      ev.state.started = true
      ev.state.startedAt = Date.now()
      ev.state.endedAt = 0
      if (ev.state.currentIndex < 0) ev.state.currentIndex = 0
      saveNow(next)
    })
  }

  const stopEvent = (id) => {
    upsert(data, setData, (next) => {
      const ev = next.actions.events[id]
      ev.state = ev.state || { started: false, currentIndex: -1 }
      ev.state.started = false
      ev.state.endedAt = Date.now()
      saveNow(next)
    })
  }

  const revealNext = (id) => {
    upsert(data, setData, (next) => {
      const ev = next.actions.events[id]
      ev.state = ev.state || { started: false, currentIndex: -1 }
      const cur = (Number.isInteger(ev.state.currentIndex) ? ev.state.currentIndex : -1)
      const n = cur + 1
      if (n < (ev.items?.length || 0)) ev.state.currentIndex = n
      saveNow(next)
    })
  }

  const markSold = (id) => {
    const nextData = ensureActions({ ...data })
    const ev = nextData.actions.events[id]
    if (!ev || !Array.isArray(ev.items)) return
    const cur = ev.state?.currentIndex ?? -1
    if (cur < 0 || cur >= ev.items.length) return
    const p = prompt(L('Slutpris (SEK)?','Final price (SEK)?'), ev.items[cur].finalPrice || '')
    if (p == null) return
    const price = String(p).replace(/[^0-9.,]/g,'').replace(',', '.')
    ev.items[cur].sold = true
    ev.items[cur].unsold = false
    ev.items[cur].finalPrice = price
    try { ev.state.salesLog = Array.isArray(ev.state.salesLog) ? ev.state.salesLog : [] } catch {}
    ev.state.salesLog.push({ index: cur, price: parseFloat(price)||0, ts: Date.now() })
    setData(nextData)
    saveNow(nextData)
  }

  const markSoldAndNext = (id) => {
    const nextData = ensureActions({ ...data })
    const ev = nextData.actions.events[id]
    if (!ev || !Array.isArray(ev.items)) return
    const cur = ev.state?.currentIndex ?? -1
    if (cur < 0 || cur >= ev.items.length) return
    const p = prompt(L('Slutpris (SEK)?','Final price (SEK)?'), ev.items[cur].finalPrice || '')
    if (p == null) return
    const price = String(p).replace(/[^0-9.,]/g,'').replace(',', '.')
    ev.items[cur].sold = true
    ev.items[cur].unsold = false
    ev.items[cur].finalPrice = price
    try { ev.state.salesLog = Array.isArray(ev.state.salesLog) ? ev.state.salesLog : [] } catch {}
    ev.state.salesLog.push({ index: cur, price: parseFloat(price)||0, ts: Date.now(), action: 'sold' })
    const hasNext = cur + 1 < ev.items.length
    if (hasNext) ev.state.currentIndex = cur + 1
    saveNow(nextData)
  }

  const markUnsoldAndNext = (id) => {
    upsert(data, setData, (next) => {
      const ev = next.actions.events[id]
      if (!ev || !Array.isArray(ev.items)) return
      const cur = ev.state?.currentIndex ?? -1
      if (cur < 0 || cur >= ev.items.length) return
      ev.items[cur].sold = false
      ev.items[cur].unsold = true
      ev.items[cur].finalPrice = ''
      try { ev.state.salesLog = Array.isArray(ev.state.salesLog) ? ev.state.salesLog : [] } catch {}
      ev.state.salesLog.push({ index: cur, price: 0, ts: Date.now(), action: 'unsold' })
      const hasNext = cur + 1 < ev.items.length
      if (hasNext) ev.state.currentIndex = cur + 1
      saveNow(next)
    })
  }

  const copyLink = async (id) => {
    try {
      const url = new URL(`/action/${id}`, window.location.origin).toString()
      await navigator.clipboard.writeText(url)
      setLinkCopied(id)
      setTimeout(() => setLinkCopied(null), 1200)
    } catch {}
  }

  const getTotal = (ev) => (ev.items||[]).reduce((sum, it) => sum + (it.sold ? (parseFloat(it.finalPrice) || 0) : 0), 0)

  const exportFeedbackCsv = (id) => {
    const ev = actions.events[id]
    if (!ev) return
    const list = Array.isArray(ev.feedbackSubmissions) ? ev.feedbackSubmissions : []
    const headers = ['ts','lang','overall','interested_indices','time_place','found_location','categories','notes','consent','name','email','tel']
    const rows = list.map(f => [
      new Date(f.ts||0).toISOString(),
      csvEscape(f.lang||''),
      csvEscape(f.overall||''),
      csvEscape((f.interested||[]).join('|')),
      csvEscape(f.timePlace||''),
      csvEscape(f.foundLocation||''),
      csvEscape(f.categories||''),
      csvEscape(f.notes||''),
      csvEscape(f.consent ? 'TRUE' : 'FALSE'),
      csvEscape(f.consent ? (f.name||'') : ''),
      csvEscape(f.consent ? (f.email||'') : ''),
      csvEscape(f.consent ? (f.tel||'') : ''),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    downloadBlob(`live-auction-feedback-${id}.csv`, 'text/csv;charset=utf-8;', csv)
  }

  const exportSalesCsv = (id) => {
    const ev = actions.events[id]
    if (!ev) return
    const headers = ['index','title_sv','title_en','artist_sv','artist_en','country','start_price','sold','final_price']
    const rows = (ev.items||[]).map((it, i) => [
      String(i),
      csvEscape(it.title?.sv||''),
      csvEscape(it.title?.en||''),
      csvEscape(it.artist?.sv||''),
      csvEscape(it.artist?.en||''),
      csvEscape(it.country||''),
      csvEscape(it.startPrice||''),
      it.sold ? 'TRUE' : 'FALSE',
      csvEscape(it.finalPrice||''),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    downloadBlob(`live-auction-sales-${id}.csv`, 'text/csv;charset=utf-8;', csv)
  }

  React.useEffect(() => {
    const onKey = (e) => {
      if (!activeEventId) return
      if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return
      if (e.code === 'Space') { e.preventDefault(); const ev = actions.events[activeEventId]; if (ev?.state?.started) stopEvent(activeEventId); else startEvent(activeEventId); }
      else if (e.key?.toLowerCase() === 'n') { e.preventDefault(); revealNext(activeEventId) }
      else if (e.key?.toLowerCase() === 's') { e.preventDefault(); markSold(activeEventId) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeEventId, actions])

  const exportItemsCsv = (id) => {
    const ev = actions.events[id]
    if (!ev) return
    const headers = ['title_sv','title_en','desc_sv','desc_en','artist_sv','artist_en','country','tags','start_price_sek','img','sold','final_price_sek']
    const rows = (ev.items||[]).map(it => [
      csvEscape(it.title?.sv || ''),
      csvEscape(it.title?.en || ''),
      csvEscape(it.desc?.sv || ''),
      csvEscape(it.desc?.en || ''),
      csvEscape(it.artist?.sv || ''),
      csvEscape(it.artist?.en || ''),
      csvEscape(it.country || ''),
      csvEscape((it.tags||[]).join('|')),
      csvEscape(it.startPrice || ''),
      csvEscape(it.img || ''),
      csvEscape(it.sold ? 'TRUE' : 'FALSE'),
      csvEscape(it.finalPrice || ''),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    downloadBlob(`live-auction-items-${id}.csv`, 'text/csv;charset=utf-8;', csv)
  }

  const downloadTemplateCsv = () => {
    const headers = ['title_sv','title_en','desc_sv','desc_en','artist_sv','artist_en','country','tags','start_price_sek','img','sold','final_price_sek']
    const sample = ['Exempelvara','Sample item','Kort beskrivning','Short description','Konstnärens namn','Artist name','SE','antik|retro','100','','FALSE','']
    const csv = [headers.join(','), sample.map(csvEscape).join(',')].join('\n')
    downloadBlob('live-auction-items-template.csv', 'text/csv;charset=utf-8;', csv)
  }

  const importItemsCsv = async (id, file) => {
    if (!file) return
    try {
      const text = await file.text()
      const rows = csvParse(text)
      if (!rows.length) return
      const headers = rows[0].map(h => String(h || '').trim().toLowerCase())
      const idxOf = (name) => headers.indexOf(name)
      const idx = {
        sv: idxOf('title_sv'),
        en: idxOf('title_en'),
        dsv: idxOf('desc_sv'),
        den: idxOf('desc_en'),
        asv: idxOf('artist_sv'),
        aen: idxOf('artist_en'),
        country: idxOf('country'),
        tags: idxOf('tags'),
        start: idxOf('start_price_sek'),
        img: idxOf('img'),
        sold: idxOf('sold'),
        final: idxOf('final_price_sek'),
      }
      const required = ['title_sv','title_en','start_price_sek']
      const missing = required.filter(h => !headers.includes(h))
      if (missing.length) { alert(L('Ogiltig CSV. Saknade kolumner: ','Invalid CSV. Missing columns: ') + missing.join(', ')); return }
      const normCountry = (val) => {
        const raw = String(val||'').trim()
        if (!raw) return ''
        const up = raw.toUpperCase()
        if (/^[A-Z]{2}$/.test(up)) return up
        try {
          const codes = getRegionCodes('en')
          const lower = raw.toLowerCase()
          const found = codes.find(c => {
            const sv = (regionLabel(c,'sv')||'').toLowerCase()
            const en = (regionLabel(c,'en')||'').toLowerCase()
            return sv === lower || en === lower
          })
          return found || ''
        } catch { return '' }
      }
      const items = rows.slice(1).filter(r => r.some(cell => String(cell||'').trim() !== '')).map(r => {
        const soldRaw = String((idx.sold>=0 ? r[idx.sold] : '') || '').trim().toLowerCase()
        const isSold = ['true','1','yes','y','ja'].includes(soldRaw)
        const final = String((idx.final>=0 ? r[idx.final] : '') || '').replace(/[^0-9.,]/g,'').replace(',', '.')
        return {
          title: { sv: String((idx.sv>=0 ? r[idx.sv] : '') || '').trim(), en: String((idx.en>=0 ? r[idx.en] : '') || '').trim() },
          desc: { sv: String((idx.dsv>=0 ? r[idx.dsv] : '') || '').trim(), en: String((idx.den>=0 ? r[idx.den] : '') || '').trim() },
          artist: { sv: String((idx.asv>=0 ? r[idx.asv] : '') || '').trim(), en: String((idx.aen>=0 ? r[idx.aen] : '') || '').trim() },
          country: normCountry(idx.country>=0 ? r[idx.country] : ''),
          tags: String((idx.tags>=0 ? r[idx.tags] : '') || '').split('|').map(s=>s.trim()).filter(Boolean),
          startPrice: String((idx.start>=0 ? r[idx.start] : '') || '').trim(),
          img: String((idx.img>=0 ? r[idx.img] : '') || '').trim(),
          sold: isSold,
          finalPrice: isSold ? final : '',
        }
      })
      const replace = confirm(L('Importera CSV: ersätta befintliga varor?\nOK = ersätt, Avbryt = lägg till.','Import CSV: replace existing items?\nOK = replace, Cancel = append.'))
      upsert(data, setData, (next) => {
        const ev = next.actions.events[id]
        ev.items = Array.isArray(ev.items) ? ev.items : []
        ev.items = replace ? items : [...ev.items, ...items]
        saveNow(next)
      })
    } catch (e) {
      console.error('CSV import failed', e)
      alert(L('Import misslyckades.','Import failed.'))
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-neutral-700 text-sm">{L('Live Auktion','Live Auction')}</div>
          <div className="text-xs text-neutral-500">{L('Skapa live-event, koppla mot Kommande Auktioner, lägg till varor och styr visningen i realtid.','Create live events, link to Upcoming Auctions, add items and control the show in real time.')}</div>
        </div>
        <button type="button" className="btn-primary" onClick={createEvent} title={L('Skapa ett nytt live‑event','Create a new live event')}>{L('Nytt event','New event')}</button>
      </div>

      {(actions.order || []).map((id) => {
        const ev = actions.events[id]
        if (!ev) return null
        const linked = Number.isInteger(ev.linkedAuctionIndex) && ev.linkedAuctionIndex >= 0 && ev.linkedAuctionIndex < auctionsList.length
        const linkedAuction = linked ? auctionsList[ev.linkedAuctionIndex] : null
        const startDate = linked ? (linkedAuction?.date || '') : (ev.startIso ? ev.startIso.slice(0,10) : '')
        const startTime = linked ? (linkedAuction?.start || '') : (ev.startIso ? ev.startIso.slice(11,16) : '')
        const total = getTotal(ev)
        const publicUrl = (typeof window !== 'undefined') ? new URL(`/action/${id}`, window.location.origin).toString() : ''
        return (
          <div key={id} className="section-card p-4" onMouseEnter={()=>setActiveEventId(id)}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                {/* Link to auction */}
                <div className="mb-3">
                  <label className="block text-sm text-neutral-600 mb-1">{L('Kopplat till auktion','Linked auction')}</label>
                  <select className="w-full border rounded px-3 py-2" title={L('Välj auktion att länka (valfritt)','Select auction to link (optional)')} value={linked ? String(ev.linkedAuctionIndex) : ''} onChange={(e)=>{
                    const v = e.target.value
                    if (v === '') linkAuction(id, null)
                    else linkAuction(id, parseInt(v,10))
                  }}>
                    <option value="">{L('Ej kopplat','Not linked')}</option>
                    {auctionsList.map((a, idx) => (
                      <option key={idx} value={String(idx)}>{auctionLabel(a)}</option>
                    ))}
                  </select>
                  {linked && (
                    <div className="text-xs text-neutral-600 mt-1">
                      <div>{L('Adress','Address')}: {(linkedAuction?.address?.sv || linkedAuction?.address?.en || '')}</div>
                      {!!linkedAuction?.viewing && <div>{L('Visning','Viewing')}: {(linkedAuction.viewing.sv || linkedAuction.viewing.en || '')}</div>}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">{L('Titel (SV)','Title (SV)')}</label>
                    <input className="w-full border rounded px-3 py-2" value={linked ? (linkedAuction?.title?.sv || '') : (ev.title?.sv||'')} onChange={(e)=>updateField(id,['title','sv'], e.target.value)} disabled={linked} />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">{L('Title (EN)','Title (EN)')}</label>
                    <input className="w-full border rounded px-3 py-2" value={linked ? (linkedAuction?.title?.en || '') : (ev.title?.en||'')} onChange={(e)=>updateField(id,['title','en'], e.target.value)} disabled={linked} />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">{L('Datum','Date')}</label>
                    <input type="date" className="w-full border rounded px-3 py-2" value={startDate} onChange={(e)=>setStart(id, e.target.value, startTime)} disabled={linked} />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">{L('Tid','Time')}</label>
                    <input type="time" className="w-full border rounded px-3 py-2" value={startTime} onChange={(e)=>setStart(id, startDate, e.target.value)} disabled={linked} />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-600">{L('Totalt','Total')}</div>
                <div className="text-xl font-serif">{total.toLocaleString('sv-SE')} SEK</div>
                <div className="mt-2 flex items-center justify-end gap-2 text-sm text-neutral-700" title={L('Visa eventet i arkivet när det är klart','Show this event in the public archive after it is finished')}>
                  <span>{L('Visa historik','Show in history')}</span>
                  <Toggle id={`ev-visible-${id}`} checked={!!ev.visible} onChange={(e)=>updateField(id,['visible'], e.target.checked)} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <a href={publicUrl} className="btn-outline text-xs" target="_blank" rel="noopener noreferrer" title={L('Öppna den publika sidan i en ny flik','Open the public page in a new tab')}>{L('Öppna','Open')}</a>
                  <button type="button" className="btn-outline text-xs" onClick={()=>copyLink(id)} title={L('Kopiera offentlig URL till urklipp','Copy public URL to clipboard')}>{linkCopied===id ? L('Kopierad!','Copied!') : L('Kopiera länk','Copy link')}</button>
                  <button type="button" className="btn-outline text-xs" onClick={()=>removeEvent(id)} title={L('Ta bort detta event permanent','Delete this event permanently')}>{L('Ta bort','Remove')}</button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" className="btn-outline text-xs" onClick={()=>exportSalesCsv(id)} title={L('Exportera försäljning (CSV)','Export sales (CSV)')}>{L('Försäljning CSV','Sales CSV')}</button>
                  <button type="button" className="btn-outline text-xs" onClick={()=>exportFeedbackCsv(id)} title={L('Exportera feedback (CSV)','Export feedback (CSV)')}>{L('Feedback CSV','Feedback CSV')}</button>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-700">{L('Styrning','Controls')}</div>
                <div className="flex items-center gap-2">
                  {!ev.state?.started ? (
                    <button type="button" className="btn-primary text-xs" onClick={()=>startEvent(id)} title={L('Starta livesändningen (Kortkommando: Mellanslag)','Start the live show (Shortcut: Space)')}>{L('Starta','Start')}</button>
                  ) : (
                    <button type="button" className="btn-outline text-xs" onClick={()=>stopEvent(id)} title={L('Stoppa livesändningen (Kortkommando: Mellanslag)','Stop the live show (Shortcut: Space)')}>{L('Stoppa','Stop')}</button>
                  )}
                  <button type="button" className="btn-outline text-xs" onClick={()=>revealNext(id)} title={L('Visa nästa vara (Kortkommando: N)','Reveal next item (Shortcut: N)')}>{L('Visa nästa','Reveal next')}</button>
                  <button type="button" className="btn-outline text-xs" onClick={()=>markUnsoldAndNext(id)} title={L('Markera nuvarande vara som inte såld och gå till nästa','Mark current item as not sold and advance to next')}>{L('Inte såld + Nästa','Not sold + Next')}</button>
                  <button type="button" className="btn-primary text-xs" onClick={()=>markSoldAndNext(id)} title={L('Markera nuvarande vara som såld och gå till nästa','Mark current item as sold and advance to next')}>{L('Såld + Nästa','Sold + Next')}</button>
                </div>
              </div>
              <div className="text-xs text-neutral-600 mb-3" title={L('0-baserad position för varan som visas nu','0-based position of the item currently showing')}>{L('Aktuell index','Current index')}: {Number.isInteger(ev.state?.currentIndex) ? ev.state.currentIndex : -1}</div>

              {/* Event settings */}
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-neutral-600 mb-1">{L('Varaktighet (minuter)','Duration (minutes)')}</label>
                  <input type="number" min="1" className="w-full border rounded px-3 py-2" title={L('Hur länge själva auktionen pågår (minuter)','How long the live show runs (minutes)')} value={ev.settings?.durationMinutes||60} onChange={(e)=>updateField(id,['settings','durationMinutes'], Math.max(1, parseInt(e.target.value||'60',10)||60))} />
                </div>
                <div>
                  <label className="block text-xs text-neutral-600 mb-1">{L('Efterfönster (minuter)','Post window (minutes)')}</label>
                  <input type="number" min="0" className="w-full border rounded px-3 py-2" title={L('Tiden efter stopp då feedbackformulär är öppet (minuter)','Time after stop when feedback form stays open (minutes)')} value={ev.settings?.postMinutes||10} onChange={(e)=>updateField(id,['settings','postMinutes'], Math.max(0, parseInt(e.target.value||'10',10)||10))} />
                </div>
                <div className="flex items-center gap-6 mt-6">
                  <div className="flex items-center gap-2 text-sm text-neutral-700" title={L('Visa total försäljning på publika sidan','Show total sales amount on public page')}>
                    <span>{L('Visa totalsumma','Show total')}</span>
                    <Toggle id={`ev-showtotals-${id}`} checked={ev.settings?.publicDisplay?.showTotals!==false} onChange={(e)=>updateField(id,['settings','publicDisplay','showTotals'], e.target.checked)} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-700" title={L('Visa SÅLD-märkning och slutpris på publika sidan','Show SOLD badges and final price on public page')}>
                    <span>{L('Visa sålda-status','Show sold status')}</span>
                    <Toggle id={`ev-showsold-${id}`} checked={ev.settings?.publicDisplay?.showSold!==false} onChange={(e)=>updateField(id,['settings','publicDisplay','showSold'], e.target.checked)} />
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-3 mt-3">
                <div className="grid md:grid-cols-2 gap-4 items-start">
                  <div className="flex items-center gap-2 text-sm text-neutral-700" title={L('Aktivera insamling av feedback efter eventet','Enable collecting feedback after the event')}>
                    <span>{L('Feedback aktiv','Feedback enabled')}</span>
                    <Toggle id={`ev-fb-enabled-${id}`} checked={ev.settings?.feedback?.enabled!==false} onChange={(e)=>updateField(id,['settings','feedback','enabled'], e.target.checked)} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-700" title={L('Visa stjärnor för helhetsbetyg','Show stars for overall rating')}>
                    <span>{L('Stjärnbetyg','Star rating')}</span>
                    <Toggle id={`ev-fb-rating-${id}`} checked={ev.settings?.feedback?.rating!==false} onChange={(e)=>updateField(id,['settings','feedback','rating'], e.target.checked)} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-700" title={L('Låt besökaren skriva fritext','Let visitors write free‑text notes')}>
                    <span>{L('Anteckningar','Notes')}</span>
                    <Toggle id={`ev-fb-notes-${id}`} checked={ev.settings?.feedback?.notes!==false} onChange={(e)=>updateField(id,['settings','feedback','notes'], e.target.checked)} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-700" title={L('Visa fält för namn, email och telefon med samtycke','Show fields for name, email and phone with consent')}>
                    <span>{L('Kontaktuppgifter','Contact details')}</span>
                    <Toggle id={`ev-fb-contact-${id}`} checked={ev.settings?.feedback?.contact!==false} onChange={(e)=>updateField(id,['settings','feedback','contact'], e.target.checked)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-neutral-600 mb-1">{L('Tack-meddelande (SV)','Thank-you message (SV)')}</label>
                  <input className="w-full border rounded px-3 py-2" title={L('Text som visas över feedbackformuläret','Text shown above the feedback form')} value={ev.settings?.messages?.thankYou?.sv||''} onChange={(e)=>updateField(id,['settings','messages','thankYou','sv'], e.target.value)} />
                  <label className="block text-xs text-neutral-600 mb-1 mt-2">{L('Tack-meddelande (EN)','Thank-you message (EN)')}</label>
                  <input className="w-full border rounded px-3 py-2" title={L('Text som visas över feedbackformuläret (engelska)','Text shown above the feedback form (English)')} value={ev.settings?.messages?.thankYou?.en||''} onChange={(e)=>updateField(id,['settings','messages','thankYou','en'], e.target.value)} />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-700">{L('Varor','Items')}</div>
                <div className="flex items-center gap-2">
                  <button type="button" className="btn-outline text-xs" onClick={()=>addItem(id)} title={L('Lägg till en ny vara längst ned','Add a new item at the end')}>{L('Lägg till vara','Add item')}</button>
                  <button type="button" className="btn-outline text-xs" onClick={()=>exportItemsCsv(id)} title={L('Exportera varor som CSV','Export items as CSV')}>CSV {L('Export','Export')}</button>
                  <button type="button" className="btn-outline text-xs" onClick={downloadTemplateCsv} title={L('Ladda ned CSV-mall','Download CSV template')}>{L('CSV‑mall','CSV template')}</button>
                  <label className="btn-outline text-xs cursor-pointer" title={L('Importera varor från CSV','Import items from CSV')}>
                    {L('CSV Import','CSV Import')}
                    <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) { importItemsCsv(id, f); e.target.value = '' } }} />
                  </label>
                </div>
              </div>
              <details className="mb-3">
                <summary className="cursor-pointer text-xs text-neutral-700">{L('Tips & Hjälp','Tips & Help')}</summary>
                <div className="mt-2 text-xs text-neutral-700 space-y-1">
                  <div>• {L('Dra en vara för att ändra ordning.','Drag an item to re‑order.')}</div>
                  <div>• {L('Kortkommandon: Mellanslag = Start/Stop, N = Nästa, S = Såld.','Shortcuts: Space = Start/Stop, N = Next, S = Sold.')}</div>
                  <div>• {L('CSV‑import stödjer beskrivning, konstnär och land (land som ISO‑kod eller namn), samt taggar ("tags" separerade med |).','CSV import supports description, artist, and country (country as ISO code or name), and tags ("tags" separated by |).')}</div>
                </div>
              </details>
              <div className="grid gap-3">
                {(ev.items||[]).map((it, idx) => (
                  <div key={idx} className="p-3 rounded border bg-white" draggable onDragStart={dragStart(id, idx)} onDragOver={dragOver(idx)} onDrop={dropOn(id, idx)} title={L('Dra för att ändra ordning','Drag to re‑order')}>
                    <div className="grid md:grid-cols-4 gap-3 items-start">
                      <div>
                        <div className="aspect-[4/3] bg-neutral-100 rounded overflow-hidden grid place-items-center text-neutral-500">
                          {it.img ? (
                            <img src={it.img} alt={(it.title?.sv||it.title?.en||'')+ ' image'} className="w-full h-full object-cover" />
                          ) : (
                            <span>{L('Ingen bild','No image')}</span>
                          )}
                        </div>
                        <input type="file" accept="image/*" className="mt-1 text-xs" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) uploadImg(id, idx, f)}} title={L('Ladda upp bild','Upload image')} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-neutral-600 mb-1">{L('Titel (SV)','Title (SV)')}</label>
                        <input className="w-full border rounded px-3 py-2" title={L('Svensk titel som visas publikt','Swedish title shown publicly')} value={it.title?.sv||''} onChange={(e)=>updateField(id,['items',idx,'title','sv'], e.target.value)} />
                        <label className="block text-xs text-neutral-600 mb-1 mt-2">{L('Title (EN)','Title (EN)')}</label>
                        <input className="w-full border rounded px-3 py-2" title={L('Engelsk titel som visas publikt','English title shown publicly')} value={it.title?.en||''} onChange={(e)=>updateField(id,['items',idx,'title','en'], e.target.value)} />
                        {/* Artist bilingual */}
                        <div className="grid md:grid-cols-2 gap-3 mt-2">
                          <div>
                            <label className="block text-xs text-neutral-600 mb-1">{L('Konstnär (SV)','Artist (SV)')}</label>
                            <input className="w-full border rounded px-3 py-2" title={L('Artistnamn på svenska (valfritt)','Artist name in Swedish (optional)')} value={it.artist?.sv||''} onChange={(e)=>updateField(id,['items',idx,'artist','sv'], e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-600 mb-1">{L('Artist (EN)','Artist (EN)')}</label>
                            <input className="w-full border rounded px-3 py-2" title={L('Artist name in English (optional)','Artist name in English (optional)')} value={it.artist?.en||''} onChange={(e)=>updateField(id,['items',idx,'artist','en'], e.target.value)} />
                          </div>
                        </div>
                        {/* Country select */}
                        <div className="mt-2">
                          <label className="block text-xs text-neutral-600 mb-1">{L('Land','Country')}</label>
                          <select className="w-full border rounded px-3 py-2" value={it.country || ''} onChange={(e)=>updateField(id,['items',idx,'country'], e.target.value)}>
                            <option value="">{L('— inget valt —','— none —')}</option>
                            {getRegionCodes('sv').map(code => (
                              <option key={code} value={code}>{regionLabel(code, 'sv')} / {regionLabel(code, 'en')}</option>
                            ))}
                          </select>
                          <div className="text-[11px] text-neutral-500 mt-1">{L('Lämna tomt om du inte vill visa på publika sidan.','Leave empty if you don\'t want to show on the public page.')}</div>
                        </div>
                        <label className="block text-xs text-neutral-600 mb-1 mt-2">{L('Beskrivning (SV)','Description (SV)')}</label>
                        <textarea className="w-full border rounded px-3 py-2" title={L('Svensk beskrivning (valfritt)','Swedish description (optional)')} value={it.desc?.sv||''} onChange={(e)=>updateField(id,['items',idx,'desc','sv'], e.target.value)} />
                        <label className="block text-xs text-neutral-600 mb-1 mt-2">{L('Description (EN)','Description (EN)')}</label>
                        <textarea className="w-full border rounded px-3 py-2" title={L('Engelsk beskrivning (valfritt)','English description (optional)')} value={it.desc?.en||''} onChange={(e)=>updateField(id,['items',idx,'desc','en'], e.target.value)} />
                        <label className="block text-xs text-neutral-600 mb-1 mt-2">{L('Utropspris (SEK)','Start price (SEK)')}</label>
                        <input className="w-full border rounded px-3 py-2" title={L('Visas publikt som referenspris','Shown publicly as a reference price')} value={it.startPrice||''} onChange={(e)=>updateField(id,['items',idx,'startPrice'], e.target.value)} />
                        <label className="block text-xs text-neutral-600 mb-1 mt-2">{L('Taggar (komma-separerade)','Tags (comma-separated)')}</label>
                        <input className="w-full border rounded px-3 py-2" title={L('Skriv taggar separerade med komma – t.ex. antik, keramik','Write tags separated by commas – e.g., antique, ceramic')} value={(it.tags||[]).join(', ')} onChange={(e)=>updateField(id,['items',idx,'tags'], e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} />
                        <div className="mt-2 text-sm text-neutral-700">
                          {it.sold ? (
                            <span>{L('SÅLD','SOLD')} · {parseFloat(it.finalPrice||0).toLocaleString('sv-SE')} SEK</span>
                          ) : (
                            <span>{L('Ej såld','Not sold')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-stretch gap-2">
                        <button type="button" className="btn-outline text-xs" onClick={()=>moveItem(id, idx, -1)} title={L('Flytta upp','Move up')}>{L('Upp','Up')}</button>
                        <button type="button" className="btn-outline text-xs" onClick={()=>moveItem(id, idx, +1)} title={L('Flytta ned','Move down')}>{L('Ner','Down')}</button>
                        <button type="button" className="btn-outline text-xs" onClick={()=>removeItem(id, idx)} title={L('Ta bort denna vara','Remove this item')}>{L('Ta bort','Remove')}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}

      {actions.order.length === 0 && (
        <div className="section-card p-4 text-neutral-600">{L('Inga event skapade ännu.','No events created yet.')}</div>
      )}
    </div>
  )
}
