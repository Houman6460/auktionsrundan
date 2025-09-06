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

export default function LiveActionAdmin({ data, setData, L }) {
  const [linkCopied, setLinkCopied] = React.useState(null)

  const actions = (data.actions && typeof data.actions === 'object') ? data.actions : { order: [], events: {} }
  const createEvent = () => {
    upsert(data, setData, (next) => {
      const id = 'act-' + Date.now()
      next.actions.events[id] = {
        id,
        title: { sv: 'Nytt Live Event', en: 'New Live Event' },
        startIso: '',
        visible: false,
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

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-neutral-700 text-sm">Live Action</div>
          <div className="text-xs text-neutral-500">Skapa live-event, lägg till varor, och styr visning i realtid.</div>
        </div>
        <button type="button" className="btn-primary" onClick={createEvent}>Nytt event</button>
      </div>

      {(actions.order || []).map((id) => {
        const ev = actions.events[id]
        if (!ev) return null
        const startDate = ev.startIso ? ev.startIso.slice(0,10) : ''
        const startTime = ev.startIso ? ev.startIso.slice(11,16) : ''
        const total = getTotal(ev)
        const publicUrl = (typeof window !== 'undefined') ? new URL(`/action/${id}`, window.location.origin).toString() : ''
        return (
          <div key={id} className="section-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Titel (SV)</label>
                    <input className="w-full border rounded px-3 py-2" value={ev.title?.sv||''} onChange={(e)=>updateField(id,['title','sv'], e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Title (EN)</label>
                    <input className="w-full border rounded px-3 py-2" value={ev.title?.en||''} onChange={(e)=>updateField(id,['title','en'], e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Datum</label>
                    <input type="date" className="w-full border rounded px-3 py-2" value={startDate} onChange={(e)=>setStart(id, e.target.value, startTime)} />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Tid</label>
                    <input type="time" className="w-full border rounded px-3 py-2" value={startTime} onChange={(e)=>setStart(id, startDate, e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-600">Totalt</div>
                <div className="text-xl font-serif">{total.toLocaleString('sv-SE')} SEK</div>
                <div className="mt-2">
                  <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                    <input type="checkbox" checked={!!ev.visible} onChange={(e)=>updateField(id,['visible'], e.target.checked)} />
                    <span>Visa historik</span>
                  </label>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <a href={publicUrl} className="btn-outline text-xs" target="_blank" rel="noopener noreferrer">Öppna</a>
                  <button type="button" className="btn-outline text-xs" onClick={()=>copyLink(id)}>{linkCopied===id ? 'Kopierad!' : 'Kopiera länk'}</button>
                  <button type="button" className="btn-outline text-xs" onClick={()=>removeEvent(id)}>Ta bort</button>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-700">Styrning</div>
                <div className="flex items-center gap-2">
                  {!ev.state?.started ? (
                    <button type="button" className="btn-primary text-xs" onClick={()=>startEvent(id)}>Starta</button>
                  ) : (
                    <button type="button" className="btn-outline text-xs" onClick={()=>stopEvent(id)}>Stoppa</button>
                  )}
                  <button type="button" className="btn-outline text-xs" onClick={()=>revealNext(id)}>Visa nästa</button>
                  <button type="button" className="btn-outline text-xs" onClick={()=>markSold(id)}>Markera såld</button>
                </div>
              </div>
              <div className="text-xs text-neutral-600 mb-3">Aktuell index: {Number.isInteger(ev.state?.currentIndex) ? ev.state.currentIndex : -1}</div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-700">Varor</div>
                <button type="button" className="btn-outline text-xs" onClick={()=>addItem(id)}>Lägg till vara</button>
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
                            <span>Ingen bild</span>
                          )}
                        </div>
                        <input type="file" accept="image/*" className="mt-1 text-xs" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) uploadImg(id, idx, f)}} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-neutral-600 mb-1">Titel (SV)</label>
                        <input className="w-full border rounded px-3 py-2" value={it.title?.sv||''} onChange={(e)=>updateField(id,['items',idx,'title','sv'], e.target.value)} />
                        <label className="block text-xs text-neutral-600 mb-1 mt-2">Title (EN)</label>
                        <input className="w-full border rounded px-3 py-2" value={it.title?.en||''} onChange={(e)=>updateField(id,['items',idx,'title','en'], e.target.value)} />
                        <label className="block text-xs text-neutral-600 mb-1 mt-2">Utropspris (SEK)</label>
                        <input className="w-full border rounded px-3 py-2" value={it.startPrice||''} onChange={(e)=>updateField(id,['items',idx,'startPrice'], e.target.value)} />
                        <div className="mt-2 text-sm text-neutral-700">
                          {it.sold ? (
                            <span>SÅLD · {parseFloat(it.finalPrice||0).toLocaleString('sv-SE')} SEK</span>
                          ) : (
                            <span>Ej såld</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-stretch gap-2">
                        <button type="button" className="btn-outline text-xs" onClick={()=>moveItem(id, idx, -1)}>Upp</button>
                        <button type="button" className="btn-outline text-xs" onClick={()=>moveItem(id, idx, +1)}>Ner</button>
                        <button type="button" className="btn-outline text-xs" onClick={()=>removeItem(id, idx)}>Ta bort</button>
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
        <div className="section-card p-4 text-neutral-600">Inga event skapade ännu.</div>
      )}
    </div>
  )
}
