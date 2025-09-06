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

export default function LiveActionAdmin({ data, setData, L }) {
  const [linkCopied, setLinkCopied] = React.useState(null)

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
        state: { started: false, currentIndex: -1 }
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
      ev.items.push({ title: { sv: 'Ny vara', en: 'New item' }, startPrice: '', img: '', sold: false, finalPrice: '' })
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

  const uploadImg = async (id, idx, file) => {
    try {
      const dataUrl = await fileToDataUrl(file)
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
      if (ev.state.currentIndex < 0) ev.state.currentIndex = 0
      saveNow(next)
    })
  }

  const stopEvent = (id) => {
    upsert(data, setData, (next) => {
      const ev = next.actions.events[id]
      ev.state = ev.state || { started: false, currentIndex: -1 }
      ev.state.started = false
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
    ev.items[cur].finalPrice = price
    setData(nextData)
    saveNow(nextData)
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

  const exportItemsCsv = (id) => {
    const ev = actions.events[id]
    if (!ev) return
    const headers = ['title_sv','title_en','start_price_sek','img','sold','final_price_sek']
    const rows = (ev.items||[]).map(it => [
      csvEscape(it.title?.sv || ''),
      csvEscape(it.title?.en || ''),
      csvEscape(it.startPrice || ''),
      csvEscape(it.img || ''),
      csvEscape(it.sold ? 'TRUE' : 'FALSE'),
      csvEscape(it.finalPrice || ''),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    downloadBlob(`live-action-items-${id}.csv`, 'text/csv;charset=utf-8;', csv)
  }

  const downloadTemplateCsv = () => {
    const headers = ['title_sv','title_en','start_price_sek','img','sold','final_price_sek']
    const sample = ['Exempelvara','Sample item','100','','FALSE','']
    const csv = [headers.join(','), sample.map(csvEscape).join(',')].join('\n')
    downloadBlob('live-action-items-template.csv', 'text/csv;charset=utf-8;', csv)
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
        start: idxOf('start_price_sek'),
        img: idxOf('img'),
        sold: idxOf('sold'),
        final: idxOf('final_price_sek'),
      }
      const missing = ['title_sv','title_en','start_price_sek','img','sold','final_price_sek'].filter(h => !headers.includes(h))
      if (missing.length) {
        alert(L('Ogiltig CSV. Saknade kolumner: ','Invalid CSV. Missing columns: ') + missing.join(', '))
        return
      }
      const items = rows.slice(1).filter(r => r.some(cell => String(cell||'').trim() !== '')).map(r => {
        const soldRaw = String((idx.sold>=0 ? r[idx.sold] : '') || '').trim().toLowerCase()
        const isSold = ['true','1','yes','y','ja'].includes(soldRaw)
        const final = String((idx.final>=0 ? r[idx.final] : '') || '').replace(/[^0-9.,]/g,'').replace(',', '.')
        return {
          title: { sv: String((idx.sv>=0 ? r[idx.sv] : '') || '').trim(), en: String((idx.en>=0 ? r[idx.en] : '') || '').trim() },
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
          <div className="text-neutral-700 text-sm">{L('Live Action','Live Action')}</div>
          <div className="text-xs text-neutral-500">{L('Skapa live-event, koppla mot Kommande Auktioner, lägg till varor och styr visningen i realtid.','Create live events, link to Upcoming Auctions, add items and control the show in real time.')}</div>
        </div>
        <button type="button" className="btn-primary" onClick={createEvent}>{L('Nytt event','New event')}</button>
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
          <div key={id} className="section-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                {/* Link to auction */}
                <div className="mb-3">
                  <label className="block text-sm text-neutral-600 mb-1">{L('Kopplat till auktion','Linked auction')}</label>
                  <select className="w-full border rounded px-3 py-2" value={linked ? String(ev.linkedAuctionIndex) : ''} onChange={(e)=>{
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
                <div className="mt-2">
                  <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                    <input type="checkbox" checked={!!ev.visible} onChange={(e)=>updateField(id,['visible'], e.target.checked)} />
                    <span>{L('Visa historik','Show in history')}</span>
                  </label>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <a href={publicUrl} className="btn-outline text-xs" target="_blank" rel="noopener noreferrer">{L('Öppna','Open')}</a>
                  <button type="button" className="btn-outline text-xs" onClick={()=>copyLink(id)}>{linkCopied===id ? L('Kopierad!','Copied!') : L('Kopiera länk','Copy link')}</button>
                  <button type="button" className="btn-outline text-xs" onClick={()=>removeEvent(id)}>{L('Ta bort','Remove')}</button>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-700">{L('Styrning','Controls')}</div>
                <div className="flex items-center gap-2">
                  {!ev.state?.started ? (
                    <button type="button" className="btn-primary text-xs" onClick={()=>startEvent(id)}>{L('Starta','Start')}</button>
                  ) : (
                    <button type="button" className="btn-outline text-xs" onClick={()=>stopEvent(id)}>{L('Stoppa','Stop')}</button>
                  )}
                  <button type="button" className="btn-outline text-xs" onClick={()=>revealNext(id)}>{L('Visa nästa','Reveal next')}</button>
                  <button type="button" className="btn-outline text-xs" onClick={()=>markSold(id)}>{L('Markera såld','Mark sold')}</button>
                </div>
              </div>
              <div className="text-xs text-neutral-600 mb-3">{L('Aktuell index','Current index')}: {Number.isInteger(ev.state?.currentIndex) ? ev.state.currentIndex : -1}</div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-700">{L('Varor','Items')}</div>
                <div className="flex items-center gap-2">
                  <button type="button" className="btn-outline text-xs" onClick={()=>addItem(id)}>{L('Lägg till vara','Add item')}</button>
                  <button type="button" className="btn-outline text-xs" onClick={()=>exportItemsCsv(id)} title={L('Exportera varor som CSV','Export items as CSV')}>CSV {L('Export','Export')}</button>
                  <button type="button" className="btn-outline text-xs" onClick={downloadTemplateCsv} title={L('Ladda ned CSV-mall','Download CSV template')}>{L('CSV‑mall','CSV template')}</button>
                  <label className="btn-outline text-xs cursor-pointer" title={L('Importera varor från CSV','Import items from CSV')}>
                    {L('CSV Import','CSV Import')}
                    <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) { importItemsCsv(id, f); e.target.value = '' } }} />
                  </label>
                </div>
              </div>
              <div className="grid gap-3">
                {(ev.items||[]).map((it, idx) => (
                  <div key={idx} className="p-3 rounded border bg-white">
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
                        <input className="w-full border rounded px-3 py-2" value={it.title?.sv||''} onChange={(e)=>updateField(id,['items',idx,'title','sv'], e.target.value)} />
                        <label className="block text-xs text-neutral-600 mb-1 mt-2">{L('Title (EN)','Title (EN)')}</label>
                        <input className="w-full border rounded px-3 py-2" value={it.title?.en||''} onChange={(e)=>updateField(id,['items',idx,'title','en'], e.target.value)} />
                        <label className="block text-xs text-neutral-600 mb-1 mt-2">{L('Utropspris (SEK)','Start price (SEK)')}</label>
                        <input className="w-full border rounded px-3 py-2" value={it.startPrice||''} onChange={(e)=>updateField(id,['items',idx,'startPrice'], e.target.value)} />
                        <div className="mt-2 text-sm text-neutral-700">
                          {it.sold ? (
                            <span>{L('SÅLD','SOLD')} · {parseFloat(it.finalPrice||0).toLocaleString('sv-SE')} SEK</span>
                          ) : (
                            <span>{L('Ej såld','Not sold')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-stretch gap-2">
                        <button type="button" className="btn-outline text-xs" onClick={()=>moveItem(id, idx, -1)}>{L('Upp','Up')}</button>
                        <button type="button" className="btn-outline text-xs" onClick={()=>moveItem(id, idx, +1)}>{L('Ner','Down')}</button>
                        <button type="button" className="btn-outline text-xs" onClick={()=>removeItem(id, idx)}>{L('Ta bort','Remove')}</button>
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
