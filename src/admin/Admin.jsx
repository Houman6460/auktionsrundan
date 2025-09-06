import React from 'react'
import { Link } from 'react-router-dom'
import { loadContent, saveContent, resetContent } from '../services/store'
import { exportCsv, loadSubscribers } from '../services/newsletter'
import AnalyticsChart from '../components/AnalyticsChart.jsx'
import LiveActionAdmin from './LiveActionAdmin.jsx'
import Sparkline from '../components/Sparkline.jsx'
import { queryEvents as analyticsQueryEvents, summarize as analyticsSummarize, bucketize as analyticsBucketize, exportAnalyticsCsv as analyticsExportAnalyticsCsv, exportEventsCsv as analyticsExportEventsCsv, previousRange as analyticsPreviousRange } from '../services/analytics'

function Section({ id, title, children, visible = true, help }) {
  const [showHelp, setShowHelp] = React.useState(false)
  return (
    <section id={id} className={`section-card p-5 ${visible ? '' : 'hidden'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="font-serif text-2xl">{title}</h2>
        {help ? (
          <button
            type="button"
            className="btn-outline text-xs whitespace-nowrap"
            onClick={()=>setShowHelp(v=>!v)}
            aria-expanded={showHelp}
            aria-controls={`${id}-help`}
            title="Help / Hjälp"
          >{showHelp ? '✕ ' : '❓ '}Help</button>
        ) : null}
      </div>
      {help && showHelp && (
        <div id={`${id}-help`} className="mb-4 p-3 rounded border bg-neutral-50 text-sm text-neutral-700 whitespace-pre-wrap">{help}</div>
      )}
      {children}
    </section>
  )
}

// Accessible toggle switch built on a native checkbox using Tailwind's peer utilities
function Toggle({ checked, onChange, disabled, id, size = 'sm', title }) {
  const S = size === 'sm'
    ? { wrap: 'w-8 h-4', knob: 'w-3 h-3', move: 'peer-checked:translate-x-3', inset: 'top-0.5 left-0.5' }
    : { wrap: 'w-10 h-6', knob: 'w-4 h-4', move: 'peer-checked:translate-x-4', inset: 'top-1 left-1' }
  return (
    <label htmlFor={id} title={title} className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      <input
        id={id}
        type="checkbox"
        className="sr-only peer"
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div className={`relative ${S.wrap} rounded-full bg-neutral-300 transition-colors peer-checked:bg-earth-dark peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-earth-dark/30`}>
        <span className={`absolute ${S.inset} ${S.knob} bg-white rounded-full shadow transition-transform ${S.move}`}></span>
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
  const [subscribers, setSubscribers] = React.useState(loadSubscribers())
  const [expandDesign, setExpandDesign] = React.useState(true)
  // New sidebar groups
  const [expandMarketing, setExpandMarketing] = React.useState(true)
  const [expandEngagement, setExpandEngagement] = React.useState(true)
  const [expandIntegrations, setExpandIntegrations] = React.useState(true)
  const [expandAnalytics, setExpandAnalytics] = React.useState(true)
  const [expandSubscribers, setExpandSubscribers] = React.useState(true)
  const [tipsEnabled, setTipsEnabled] = React.useState(() => localStorage.getItem('ar_admin_tooltips') !== '0')
  const rootRef = React.useRef(null)
  // Filtering state: null = show all, or a group key (design, marketing, engagement, integrations, subscribers) or a section id (e.g. 'admin-header')
  const [activeFilter, setActiveFilter] = React.useState(null)
  const groupSections = React.useMemo(() => ({
    design: ['admin-header','admin-hero','admin-auctions','admin-items','admin-terms','admin-instagram','admin-faq','admin-footer'],
    marketing: ['admin-newsletter','admin-share','admin-chat'],
    engagement: ['admin-liveaction','admin-registration','admin-ratings'],
    integrations: ['admin-maps'],
    analytics: ['admin-analytics'],
    subscribers: ['admin-subscribers'],
  }), [])
  const isSectionVisible = React.useCallback((id) => {
    if (!activeFilter) return true
    if (groupSections[activeFilter]) return groupSections[activeFilter].includes(id)
    return activeFilter === id
  }, [activeFilter, groupSections])
  const L = (sv, en) => (currentLang === 'en' ? en : sv)

  // Small delta badge component
  function Delta({ now = 0, prev = 0 }) {
    const n = Number(now)||0
    const p = Number(prev)||0
    const diff = n - p
    const pct = p === 0 ? (n > 0 ? 100 : 0) : Math.round((diff / p) * 100)
    const up = diff >= 0
    const color = up ? 'text-emerald-700' : 'text-rose-700'
    const bg = up ? 'bg-emerald-50' : 'bg-rose-50'
    const sign = up ? '+' : ''
    return (
      <span className={`ml-1 px-2 py-0.5 rounded text-xs ${bg} ${color}`}>{sign}{diff} ({sign}{pct}%)</span>
    )
  }

  // Build sparkline data for a given type using current selection buckets
  function buildSpark(selection, comparison, type) {
    try {
      const events = selection.events.filter(e => e.type === type)
      const rows = analyticsBucketize(events, selection.gran)
      const pts = rows.map(r => Number(r.count)||0)
      // Ensure at least two points for a line
      if (pts.length === 1) return [0, pts[0]]
      if (pts.length === 0) return [0,0]
      return pts
    } catch {
      return [0,0]
    }
  }

  // Analytics state
  const [analyticsRange, setAnalyticsRange] = React.useState('week') // 'now' | 'week' | 'month' | 'year' | 'custom'
  const [analyticsFrom, setAnalyticsFrom] = React.useState('')
  const [analyticsTo, setAnalyticsTo] = React.useState('')
  const [analyticsTypes, setAnalyticsTypes] = React.useState({
    page_view: true,
    section_view: true,
    newsletter_subscribe: true,
    registration_submit: true,
    rating_submit: true,
  })
  const [analyticsTick, setAnalyticsTick] = React.useState(0)
  const [analyticsCompare, setAnalyticsCompare] = React.useState(false)
  const [analyticsFilters, setAnalyticsFilters] = React.useState({ lang: [], device: [], route: [] })
  const [drill, setDrill] = React.useState({ open: false, type: null, rows: [] })
  const [annotations, setAnnotations] = React.useState([])

  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || e.key === 'ar_analytics_events_v1') setAnalyticsTick((n)=>n+1)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const getRange = React.useCallback(() => {
    const now = new Date()
    if (analyticsRange === 'now') {
      const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return { from: d0.getTime(), to: now.getTime(), gran: 'hour' }
    }
    if (analyticsRange === 'week') {
      const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
      return { from: d0.getTime(), to: now.getTime(), gran: 'day' }
    }
    if (analyticsRange === 'month') {
      const d0 = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: d0.getTime(), to: now.getTime(), gran: 'day' }
    }
    if (analyticsRange === 'year') {
      const d0 = new Date(now.getFullYear(), 0, 1)
      return { from: d0.getTime(), to: now.getTime(), gran: 'month' }
    }
    // custom
    const f = analyticsFrom ? new Date(analyticsFrom) : new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const t = analyticsTo ? new Date(analyticsTo) : now
    const days = Math.max(1, Math.ceil((t - f) / 86400000))
    let gran = 'day'
    if (days <= 2) gran = 'hour'
    else if (days > 60) gran = 'month'
    return { from: f.getTime(), to: t.getTime(), gran }
  }, [analyticsRange, analyticsFrom, analyticsTo])

  const analyticsSelection = React.useMemo(() => {
    const { from, to, gran } = getRange()
    const types = Object.entries(analyticsTypes).filter(([,v]) => v).map(([k])=>k)
    const ev = analyticsQueryEvents({ types, from, to, filters: analyticsFilters })
    const sum = analyticsSummarize(ev)
    const buckets = analyticsBucketize(ev, gran)
    const topSectionsMap = {}
    const topAuctionsMap = {}
    ev.forEach((e) => {
      if (e.type === 'section_view') {
        const sid = e.payload?.sectionId || 'unknown'
        topSectionsMap[sid] = (topSectionsMap[sid] || 0) + 1
      } else if (e.type === 'registration_submit') {
        const key = e.payload?.title || e.payload?.auctionId || 'unknown'
        topAuctionsMap[key] = (topAuctionsMap[key] || 0) + 1
      }
    })
    const topSections = Object.entries(topSectionsMap).map(([label,count])=>({label, count})).sort((a,b)=>b.count-a.count).slice(0,8)
    const topAuctions = Object.entries(topAuctionsMap).map(([label,count])=>({label, count})).sort((a,b)=>b.count-a.count).slice(0,8)
    // Build segmentation options from current result set
    const langs = Array.from(new Set(ev.map(e=>e.lang).filter(Boolean)))
    const devices = Array.from(new Set(ev.map(e=>e.device).filter(Boolean)))
    const routes = Array.from(new Set(ev.map(e=>e.route).filter(Boolean)))
    return { from, to, gran, events: ev, sum, buckets, topSections, topAuctions, langs, devices, routes }
  }, [analyticsTypes, analyticsTick, analyticsFilters, getRange])

  const analyticsComparison = React.useMemo(() => {
    if (!analyticsCompare) return null
    const { from, to, gran } = getRange()
    const prev = analyticsPreviousRange(from, to)
    const types = Object.entries(analyticsTypes).filter(([,v]) => v).map(([k])=>k)
    const evPrev = analyticsQueryEvents({ types, from: prev.from, to: prev.to, filters: analyticsFilters })
    return { prevFrom: prev.from, prevTo: prev.to, sumPrev: analyticsSummarize(evPrev), bucketsPrev: analyticsBucketize(evPrev, gran) }
  }, [analyticsTypes, analyticsFilters, analyticsCompare, getRange])

  // CSV export for Registrations
  const escapeCsvLocal = (value) => {
    const str = String(value ?? '')
    return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str
  }
  const exportRegistrationCsv = React.useCallback(() => {
    try {
      const subs = data.registration?.submissions || {}
      const rows = []
      Object.entries(subs).forEach(([auctionId, arr]) => {
        ;(arr || []).forEach((it) => {
          rows.push({
            auctionId,
            title: it.title || '',
            name: it.name || '',
            email: it.email || '',
            tel: it.tel || '',
            notes: it.notes || '',
            lang: it.lang || '',
            answers: it.answers ? JSON.stringify(it.answers) : '',
            timestamp: new Date(it.ts || 0).toISOString(),
          })
        })
      })
      const headers = ['auctionId','title','name','email','tel','notes','lang','answers','timestamp']
      const csv = [
        headers.join(','),
        ...rows.map((r) => headers.map((h) => escapeCsvLocal(r[h])).join(','))
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'registrations.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export registrations CSV failed', err)
      alert(L('Kunde inte exportera CSV.','Could not export CSV.'))
    }
  }, [data])

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

  const createLiveEventFromAuction = (idx) => {
    const next = { ...data }
    // Ensure actions namespace exists
    next.actions = (next.actions && typeof next.actions === 'object') ? next.actions : { order: [], events: {} }
    next.actions.order = Array.isArray(next.actions.order) ? next.actions.order : []
    next.actions.events = (next.actions.events && typeof next.actions.events === 'object') ? next.actions.events : {}
    const id = 'act-' + Date.now()
    const a = next.auctions.list[idx]
    next.actions.events[id] = {
      id,
      title: { sv: a?.title?.sv || 'Live Event', en: a?.title?.en || 'Live Event' },
      startIso: '',
      visible: false,
      linkedAuctionIndex: idx,
      items: [],
      settings: {
        durationMinutes: 60,
        postMinutes: 10,
        publicDisplay: { showTotals: true, showSold: true },
        feedback: { enabled: true, rating: true, notes: true, contact: true },
        messages: { thankYou: { sv: 'Tack! Vi uppskattar din feedback.', en: 'Thank you! We appreciate your feedback.' } }
      },
      state: { started: false, currentIndex: -1, salesLog: [] }
    }
    if (!next.actions.order.includes(id)) next.actions.order.unshift(id)
    setData(next)
    // Auto-focus Live Action section for convenience
    try { document.querySelector('a[href="#admin-liveaction"]').click() } catch {}
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

  // Live-update subscribers list when stored from popup or other tabs
  React.useEffect(() => {
    const handler = (e) => {
      if (!e || e.key === 'ar_newsletter_subscribers_v1') {
        setSubscribers(loadSubscribers())
      }
    }
    window.addEventListener('storage', handler)
    // Also poll once after mount to ensure fresh state
    setSubscribers(loadSubscribers())
    return () => window.removeEventListener('storage', handler)
  }, [])

  // Custom tooltip behavior inside Admin: use CSS [data-tip] and avoid native title tooltip
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let lastTipEl = null
    const measureTip = (el) => {
      try {
        const txt = el.getAttribute('data-tip') || ''
        const m = document.createElement('div')
        m.style.position = 'fixed'
        m.style.left = '-9999px'
        m.style.top = '0'
        m.style.maxWidth = '280px'
        m.style.fontSize = '12px'
        m.style.lineHeight = '1.25'
        m.style.padding = '6px 8px'
        m.style.borderRadius = '8px'
        m.style.visibility = 'hidden'
        m.style.whiteSpace = 'pre-wrap'
        m.textContent = txt
        document.body.appendChild(m)
        const w = m.offsetWidth
        const h = m.offsetHeight
        document.body.removeChild(m)
        return { w: Math.max(40, w), h: Math.max(24, h) }
      } catch { return { w: 280, h: 48 } }
    }
    const updatePosition = (el) => {
      try {
        if (!el || !el.hasAttribute('data-tip')) return
        const pref = el.getAttribute('data-tip-pos') || 'top'
        // Only use viewport-fixed layout in constrained containers (sidebar) or forced right-placement
        const withinSidebar = !!el.closest('aside')
        const shouldFixed = withinSidebar
        if (!shouldFixed) {
          // Ensure we fall back to relative tooltip
          el.removeAttribute('data-tip-fixed')
          el.removeAttribute('data-tip-pos-active')
          el.style.removeProperty('--tip-left')
          el.style.removeProperty('--tip-top')
          return
        }
        const rect = el.getBoundingClientRect()
        const vw = window.innerWidth || document.documentElement.clientWidth
        const vh = window.innerHeight || document.documentElement.clientHeight
        const margin = 10
        const { w: estW, h: estH } = measureTip(el)
        let pos = pref
        if (pos === 'right' && (rect.right + estW + margin) > vw) pos = 'left'
        if (pos === 'left' && (rect.left - estW - margin) < 0) pos = 'right'
        if (pos === 'top' && (rect.top - estH - margin) < 0) pos = 'bottom'
        if (pos === 'bottom' && (rect.bottom + estH + margin) > vh) pos = 'top'
        el.setAttribute('data-tip-pos-active', pos)
        // Compute anchor and clamp to viewport
        let left = rect.left + rect.width / 2
        let top = rect.top + rect.height / 2
        if (pos === 'right') {
          left = rect.right + margin
          // clamp vertical center so bubble stays on-screen
          const halfH = estH / 2
          top = Math.min(Math.max(rect.top + rect.height / 2, halfH + margin), vh - halfH - margin)
        } else if (pos === 'left') {
          left = rect.left - margin
          const halfH = estH / 2
          top = Math.min(Math.max(rect.top + rect.height / 2, halfH + margin), vh - halfH - margin)
        } else if (pos === 'bottom') {
          top = rect.bottom + margin
          const halfW = estW / 2
          left = Math.min(Math.max(rect.left + rect.width / 2, halfW + margin), vw - halfW - margin)
        } else { // top
          top = rect.top - margin
          const halfW = estW / 2
          left = Math.min(Math.max(rect.left + rect.width / 2, halfW + margin), vw - halfW - margin)
        }
        el.style.setProperty('--tip-left', `${Math.round(left)}px`)
        el.style.setProperty('--tip-top', `${Math.round(top)}px`)
        el.setAttribute('data-tip-fixed', '1')
      } catch {}
    }
    const show = (el) => {
      try {
        if (!tipsEnabled) return
        const t = el.getAttribute('title')
        if (!t) return
        el.__tipTitle = t
        el.setAttribute('data-tip', t)
        el.removeAttribute('title')
        lastTipEl = el
        updatePosition(el)
      } catch {}
    }
    const hide = (el) => {
      try {
        if (el && el.__tipTitle != null) {
          el.setAttribute('title', el.__tipTitle)
          delete el.__tipTitle
        }
        if (el) {
          el.removeAttribute('data-tip')
          el.removeAttribute('data-tip-fixed')
          el.removeAttribute('data-tip-pos-active')
          el.style.removeProperty('--tip-left')
          el.style.removeProperty('--tip-top')
        }
        if (lastTipEl === el) lastTipEl = null
      } catch {}
    }
    const onOver = (e) => {
      const el = e.target && e.target.closest('[title]')
      if (el && root.contains(el)) show(el)
    }
    const onOut = (e) => {
      const el = e.target && (e.target.closest('[data-tip]') || e.target.closest('[title]'))
      if (!el) return
      if (el.contains(e.relatedTarget)) return
      hide(el)
    }
    const onFocusIn = (e) => {
      const el = e.target && e.target.closest('[title]')
      if (el && root.contains(el)) show(el)
    }
    const onFocusOut = (e) => {
      const el = e.target && e.target.closest('[data-tip]')
      if (el) hide(el)
    }
    const onScrollOrResize = () => {
      if (lastTipEl) updatePosition(lastTipEl)
    }
    root.addEventListener('mouseover', onOver)
    root.addEventListener('mouseout', onOut)
    root.addEventListener('focusin', onFocusIn)
    root.addEventListener('focusout', onFocusOut)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      root.removeEventListener('mouseover', onOver)
      root.removeEventListener('mouseout', onOut)
      root.removeEventListener('focusin', onFocusIn)
      root.removeEventListener('focusout', onFocusOut)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [tipsEnabled])

  // When tooltips are turned off, clean up any active [data-tip]
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (!tipsEnabled) {
      root.querySelectorAll('[data-tip]').forEach((el) => {
        try {
          if (el.__tipTitle && !el.getAttribute('title')) el.setAttribute('title', el.__tipTitle)
          el.removeAttribute('data-tip')
          if (el.__tipTitle) delete el.__tipTitle
        } catch {}
      })
    }
  }, [tipsEnabled])

  // Derive tooltip theme colors from Tailwind tokens (bg-earth-dark/text-white)
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const probe = document.createElement('div')
    probe.className = 'bg-earth-dark text-white fixed -z-50 opacity-0 pointer-events-none'
    root.appendChild(probe)
    const cs = getComputedStyle(probe)
    const bg = cs.backgroundColor || 'rgba(82, 65, 43, 0.95)'
    const fg = cs.color || '#ffffff'
    root.style.setProperty('--tooltip-bg', bg)
    root.style.setProperty('--tooltip-fg', fg)
    root.removeChild(probe)
  }, [])

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
    <div ref={rootRef} className={`min-h-screen bg-vintage-cream tooltip-root ${tipsEnabled ? '' : 'tips-off'}`}>
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
                data-tip-pos="bottom"
              >SV</button>
              <button
                className={`px-2 py-1 rounded text-sm ${currentLang==='en' ? 'bg-earth-dark text-white' : 'btn-outline'}`}
                onClick={()=>{setCurrentLang('en'); localStorage.setItem('ar_admin_lang','en')}}
                disabled={!data.header.languages?.en}
                title={!data.header.languages?.en ? 'EN inaktiverat' : 'English'}
                data-tip-pos="bottom"
              >EN</button>
            </div>
            {/* Tabs removed; navigation moved to left accordion */}
            <Link to="/" className="btn-outline text-sm" title={L('Öppna webbplatsen i ny flik','Open the site in a new tab')} data-tip-pos="bottom">{L('Till webbplatsen','View site')}</Link>
            <button className="btn-primary text-sm" onClick={save} title={L('Spara alla ändringar','Save all changes')} data-tip-pos="bottom">{L('Spara','Save')}</button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {saved && <div className="section-card p-3 text-emerald-700 bg-emerald-50 mb-6">{L('Sparat!','Saved!')}</div>}

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-3">
            <div className="section-card p-4 sticky top-0 max-h-[100vh] overflow-y-auto">
              <nav className="flex flex-col gap-2 text-sm">
                <div>
                  <button type="button" className="w-full text-left font-medium py-2" title={L('Visa endast Design‑sektioner','Show only Design sections')} data-tip-pos="right" onClick={()=>{setExpandDesign(v=>!v); setActiveFilter('design')}}>
                    {expandDesign ? '▾' : '▸'} {L('Design','Design')}
                  </button>
                  {expandDesign && (
                    <div className="pl-3 flex flex-col gap-1">
                      <a href="#admin-header" className="hover:underline" data-tip-pos="right" title={L('Konfigurera logotyp, navigering och språk','Configure logo, navigation and languages')} onClick={()=>setActiveFilter('admin-header')}>{L('Header','Header')}</a>
                      <a href="#admin-hero" className="hover:underline" data-tip-pos="right" title={L('Lägg till hero‑bild och rubriker för startsidan','Add hero image and titles for the homepage')} onClick={()=>setActiveFilter('admin-hero')}>{L('Hero (Hem)','Hero (Home)')}</a>
                      <a href="#admin-auctions" className="hover:underline" data-tip-pos="right" title={L('Hantera kommande platsauktioner','Manage upcoming in‑person auctions')} onClick={()=>setActiveFilter('admin-auctions')}>{L('Kommande Auktioner','Upcoming Auctions')}</a>
                      <a href="#admin-items" className="hover:underline" data-tip-pos="right" title={L('Hantera varukategorier och bilder','Manage item categories and images')} onClick={()=>setActiveFilter('admin-items')}>{L('Auktionsvaror','Auction Items')}</a>
                      <a href="#admin-terms" className="hover:underline" data-tip-pos="right" title={L('Redigera auktionsvillkor på svenska och engelska','Edit auction terms in Swedish and English')} onClick={()=>setActiveFilter('admin-terms')}>{L('Auktionsvillkor','Terms')}</a>
                      <a href="#admin-instagram" className="hover:underline" data-tip-pos="right" title={L('Visa ett Instagramflöde på sajten','Show an Instagram feed on the site')} onClick={()=>setActiveFilter('admin-instagram')}>{L('Instagram','Instagram')}</a>
                      <a href="#admin-faq" className="hover:underline" data-tip-pos="right" title={L('Hantera vanliga frågor och svar','Manage frequently asked questions')} onClick={()=>setActiveFilter('admin-faq')}>FAQ</a>
                      <a href="#admin-footer" className="hover:underline" data-tip-pos="right" title={L('Redigera kontaktuppgifter och sociala länkar','Edit contact details and social links')} onClick={()=>setActiveFilter('admin-footer')}>{L('Footer','Footer')}</a>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <button type="button" className="w-full text-left font-medium py-2" title={L('Visa endast Marknadsföring','Show only Marketing')} data-tip-pos="right" onClick={()=>{setExpandMarketing(v=>!v); setActiveFilter('marketing')}}>
                    {expandMarketing ? '▾' : '▸'} {L('Marknadsföring','Marketing')}
                  </button>
                  {expandMarketing && (
                    <div className="pl-3 flex flex-col gap-1">
                      <a href="#admin-newsletter" className="hover:underline" data-tip-pos="right" title={L('Aktivera popup, rubriker och triggrar','Enable newsletter popup, titles and triggers')} onClick={()=>setActiveFilter('admin-newsletter')}>{L('Nyhetsbrev','Newsletter')}</a>
                      <a href="#admin-share" className="hover:underline" data-tip-pos="right" title={L('Konfigurera delningsmeny och kanaler','Configure sharing menu and platforms')} onClick={()=>setActiveFilter('admin-share')}>{L('Dela (Social)','Share (Social)')}</a>
                      <a href="#admin-chat" className="hover:underline" data-tip-pos="right" title={L('WhatsApp‑chatt, nummer och hälsning','WhatsApp chat, number and greeting')} onClick={()=>setActiveFilter('admin-chat')}>{L('Chat (WhatsApp)','Chat (WhatsApp)')}</a>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <button type="button" className="w-full text-left font-medium py-2" title={L('Visa endast Engagemang','Show only Engagement')} data-tip-pos="right" onClick={()=>{setExpandEngagement(v=>!v); setActiveFilter('engagement')}}>
                    {expandEngagement ? '▾' : '▸'} {L('Engagemang','Engagement')}
                  </button>
                  {expandEngagement && (
                    <div className="pl-3 flex flex-col gap-1">
                      <a href="#admin-liveaction" className="hover:underline" data-tip-pos="right" title={L('Skapa live‑event, lägg till varor och styr visningen','Create live events, add items and control the show')} onClick={()=>setActiveFilter('admin-liveaction')}>{L('Action (Live)','Action (Live)')}</a>
                      <a href="#admin-registration" className="hover:underline" data-tip-pos="right" title={L('Formulär för anmälan, fält och egna frågor','Registration form, fields and custom questions')} onClick={()=>setActiveFilter('admin-registration')}>{L('Registrering','Registration')}</a>
                      <a href="#admin-ratings" className="hover:underline" data-tip-pos="right" title={L('Stjärnbetyg och besökaromdömen','Star ratings and visitor feedback')} onClick={()=>setActiveFilter('admin-ratings')}>{L('Betyg','Ratings')}</a>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <button type="button" className="w-full text-left font-medium py-2" title={L('Visa endast Integrationer','Show only Integrations')} data-tip-pos="right" onClick={()=>{setExpandIntegrations(v=>!v); setActiveFilter('integrations')}}>
                    {expandIntegrations ? '▾' : '▸'} {L('Integrationer','Integrations')}
                  </button>
                  {expandIntegrations && (
                    <div className="pl-3 flex flex-col gap-1">
                      <a href="#admin-maps" className="hover:underline" data-tip-pos="right" title={L('Ange Google Maps API‑nyckel och inställningar','Provide Google Maps API key and settings')} onClick={()=>setActiveFilter('admin-maps')}>{L('Google Maps','Google Maps')}</a>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <button type="button" className="w-full text-left font-medium py-2" title={L('Visa endast Analys','Show only Analytics')} data-tip-pos="right" onClick={()=>{setExpandAnalytics(v=>!v); setActiveFilter('analytics')}}>
                    {expandAnalytics ? '▾' : '▸'} {L('Analys','Analytics')}
                  </button>
                  {expandAnalytics && (
                    <div className="pl-3 flex flex-col gap-1">
                      <a href="#admin-analytics" className="hover:underline" data-tip-pos="right" title={L('Visa trafik, händelser och toppsektioner','View traffic, events and top sections')} onClick={()=>setActiveFilter('admin-analytics')}>{L('Instrumentpanel','Dashboard')}</a>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <button type="button" className="w-full text-left font-medium py-2" title={L('Visa endast Prenumeranter','Show only Subscribers')} data-tip-pos="right" onClick={()=>{setExpandSubscribers(v=>!v); setActiveFilter('subscribers')}}>
                    {expandSubscribers ? '▾' : '▸'} {L('Prenumeranter','Subscribers')}
                  </button>
                  {expandSubscribers && (
                    <div className="pl-3 flex flex-col gap-1">
                      <a href="#admin-subscribers" className="hover:underline" data-tip-pos="right" title={L('Visa och exportera prenumeranter','View and export subscribers')} onClick={()=>setActiveFilter('admin-subscribers')}>{L('Prenumeranter','Subscribers')}</a>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <label className="flex items-center justify-between gap-2" title={L('Slå på/av hjälptooltips i adminpanelen','Toggle help tooltips in the admin panel')} data-tip-pos="right">
                    <span>{L('Hjälp‑tooltips','Help tooltips')}</span>
                    <Toggle id="tips-toggle" checked={!!tipsEnabled} onChange={(e)=>{ const v=e.target.checked; setTipsEnabled(v); localStorage.setItem('ar_admin_tooltips', v ? '1' : '0') }} title={L('Slå på/av hjälptooltips','Toggle help tooltips')} />
                  </label>
                </div>
                <div className="mt-3">
                  <button type="button" className="btn-outline w-full" onClick={()=>setActiveFilter(null)} title={L('Visa alla sektioner','Show all sections')} data-tip-pos="right">{L('Visa alla','Show all')}</button>
                </div>
                <hr className="my-3" />
                <button className="btn-primary w-full" onClick={save} title={L('Spara alla ändringar','Save all changes')} data-tip-pos="right">{L('Spara','Save')}</button>
                <button className="btn-outline w-full" onClick={hardReset} title={L('Återställ allt innehåll till standard','Reset all content to defaults')} data-tip-pos="right">{L('Återställ standard','Reset to defaults')}</button>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="col-span-12 md:col-span-9 lg:col-span-9 grid gap-6">

        {/* Analytics Dashboard */}
        <Section id="admin-analytics" title={L('Analys','Analytics Dashboard')} visible={isSectionVisible('admin-analytics')} help={L('Visa trafik, händelser och toppsektioner. Justera tidsintervall, filtrera på språk, enhet och sidor. Exportera CSV från panelen.','View traffic, events and top sections. Adjust time range, filter by language, device and routes. Export CSV from the dashboard.') }>
          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Tidsintervall','Time range')}</label>
              <select className="w-full border rounded px-3 py-2" title={L('Välj tidsintervall för analyspanelen','Choose time range for the analytics dashboard')} value={analyticsRange} onChange={(e)=>setAnalyticsRange(e.target.value)}>
                <option value="now">{L('Idag','Today')}</option>
                <option value="week">{L('Denna vecka','This week')}</option>
                <option value="month">{L('Denna månad','This month')}</option>
                <option value="year">{L('Detta år','This year')}</option>
                <option value="custom">{L('Anpassad','Custom')}</option>
              </select>
            </div>
            {analyticsRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">{L('Från','From')}</label>
                  <input type="date" className="w-full border rounded px-3 py-2" title={L('Startdatum för anpassat intervall','Start date for custom range')} value={analyticsFrom} onChange={(e)=>setAnalyticsFrom(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">{L('Till','To')}</label>
                  <input type="date" className="w-full border rounded px-3 py-2" title={L('Slutdatum för anpassat intervall','End date for custom range')} value={analyticsTo} onChange={(e)=>setAnalyticsTo(e.target.value)} />
                </div>
              </>
            )}
            <div className="flex items-end justify-end gap-2">
              <label className="inline-flex items-center gap-2 text-sm text-neutral-700 mr-2" title={L('Jämför mot föregående period i grafer och nyckeltal','Compare against previous period in charts and KPIs')} data-tip-pos="bottom">
                <Toggle checked={analyticsCompare} onChange={(e)=>setAnalyticsCompare(e.target.checked)} />
                <span>{L('Jämför föregående period','Compare previous period')}</span>
              </label>
              <button type="button" className="btn-outline" onClick={()=>analyticsExportAnalyticsCsv()} title={L('Exportera sammanfattning som CSV','Export summary as CSV')}>{L('Exportera CSV','Export CSV')}</button>
            </div>
          </div>

          {/* Event filters row */}
          <div className="section-card p-3 mb-4 sticky top-0 z-10">
            <div className="flex flex-wrap items-center gap-4">
              {([
                { key: 'page_view', label: L('Sidvisningar','Page views') },
                { key: 'section_view', label: L('Sektionsvisningar','Section views') },
                { key: 'newsletter_subscribe', label: L('Prenumerationer','Subscriptions') },
                { key: 'registration_submit', label: L('Anmälningar','Registrations') },
                { key: 'rating_submit', label: L('Betyg','Ratings') },
              ]).map(({key,label}) => (
                <label key={key} className="inline-flex items-center gap-2 text-sm text-neutral-700" title={L('Visa/dölj denna händelsetyp i grafer','Show/hide this event type in charts')} data-tip-pos="bottom">
                  <Toggle size="sm" checked={!!analyticsTypes[key]} onChange={(e)=>setAnalyticsTypes((t)=>({ ...t, [key]: e.target.checked }))} />
                  <span className="truncate">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Segmentation filters */}
          <div className="section-card p-3 mb-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-neutral-600 mb-1">{L('Språk','Language')}</div>
                <div className="flex flex-wrap gap-2">
                  {analyticsSelection.langs.map((v)=> (
                    <button key={v} type="button" className={`px-2 py-1 text-xs rounded border ${analyticsFilters.lang.includes(v) ? 'bg-earth-dark text-white' : 'bg-white'}`} title={L('Filtrera på språk: ','Filter by language: ') + v.toUpperCase()} data-tip-pos="bottom" onClick={()=>setAnalyticsFilters((f)=>({ ...f, lang: f.lang.includes(v) ? f.lang.filter(x=>x!==v) : [...f.lang, v] }))}>{v.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-600 mb-1">{L('Enhet','Device')}</div>
                <div className="flex flex-wrap gap-2">
                  {analyticsSelection.devices.map((v)=> (
                    <button key={v} type="button" className={`px-2 py-1 text-xs rounded border ${analyticsFilters.device.includes(v) ? 'bg-earth-dark text-white' : 'bg-white'}`} title={L('Filtrera på enhet: ','Filter by device: ') + v} data-tip-pos="bottom" onClick={()=>setAnalyticsFilters((f)=>({ ...f, device: f.device.includes(v) ? f.device.filter(x=>x!==v) : [...f.device, v] }))}>{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-600 mb-1">{L('Sida','Route')}</div>
                <div className="flex flex-wrap gap-2 max-h-16 overflow-y-auto">
                  {analyticsSelection.routes.map((v)=> (
                    <button key={v} type="button" className={`px-2 py-1 text-xs rounded border ${analyticsFilters.route.includes(v) ? 'bg-earth-dark text-white' : 'bg-white'}`} title={L('Filtrera på sida: ','Filter by route: ') + v} data-tip-pos="bottom" onClick={()=>setAnalyticsFilters((f)=>({ ...f, route: f.route.includes(v) ? f.route.filter(x=>x!==v) : [...f.route, v] }))}>{v}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="section-card p-3 mb-4">
            <div className="grid md:grid-cols-5 gap-3">
              {([
                { key: 'page_view', label: L('Sidvisningar','Page views') },
                { key: 'section_view', label: L('Sektionsvisningar','Section views') },
                { key: 'newsletter_subscribe', label: L('Prenumerationer','Subscriptions') },
                { key: 'registration_submit', label: L('Anmälningar','Registrations') },
                { key: 'rating_submit', label: L('Betyg','Ratings') },
              ]).map(({key,label}) => (
                <button key={key} type="button" onClick={()=>{
                  const type = key
                  const ev = analyticsSelection.events.filter(e=>e.type===type)
                  setDrill({ open: true, type, rows: ev })
                }} className="p-3 rounded border bg-white min-h-[88px] flex flex-col justify-between text-left hover:bg-neutral-50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-neutral-700 truncate">{label}</div>
                    <div className="w-20"><Sparkline points={buildSpark(analyticsSelection, analyticsComparison, key)} /></div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="text-2xl font-serif">{analyticsSelection.sum[key] || 0}</div>
                    {analyticsCompare && (
                      <Delta now={analyticsSelection.sum[key]||0} prev={analyticsComparison?.sumPrev?.[key]||0} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="font-serif text-lg mb-2">{L('Händelser över tid','Events over time')}</h3>
              <div className="section-card p-3">
                <AnalyticsChart data={analyticsSelection.buckets} />
              </div>
            </div>
            <div>
              <h3 className="font-serif text-lg mb-2">{L('Toppsektioner','Top sections')}</h3>
              <div className="section-card p-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-100 text-left">
                      <th className="px-2 py-1">{L('Sektion','Section')}</th>
                      <th className="px-2 py-1">{L('Antal','Count')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsSelection.topSections.length === 0 && (
                      <tr><td className="px-2 py-2 text-neutral-600" colSpan={2}>{L('Inga data ännu.','No data yet.')}</td></tr>
                    )}
                    {analyticsSelection.topSections.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{row.label}</td>
                        <td className="px-2 py-1">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="font-serif text-lg mb-2">{L('Toppauktioner (anmälningar)','Top auctions (registrations)')}</h3>
              <div className="section-card p-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-100 text-left">
                      <th className="px-2 py-1">{L('Auktion','Auction')}</th>
                      <th className="px-2 py-1">{L('Antal','Count')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsSelection.topAuctions.length === 0 && (
                      <tr><td className="px-2 py-2 text-neutral-600" colSpan={2}>{L('Inga data ännu.','No data yet.')}</td></tr>
                    )}
                    {analyticsSelection.topAuctions.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{row.label}</td>
                        <td className="px-2 py-1">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Annotations simple list */}
          <div className="section-card p-3">
            <h3 className="font-serif text-lg mb-2">{L('Anteckningar','Annotations')}</h3>
            <form className="flex gap-2 mb-3" onSubmit={(e)=>{e.preventDefault(); const f = e.currentTarget; const txt = f.note?.value?.trim(); if (!txt) return; setAnnotations((a)=>[{ ts: Date.now(), text: txt }, ...a]); f.reset();}}>
              <input name="note" className="flex-1 border rounded px-3 py-2" placeholder={L('Lägg till notering (syns här som historik)','Add a note (appears here as history)')} />
              <button className="btn-outline" type="submit">{L('Lägg till','Add')}</button>
            </form>
            <ul className="space-y-1 text-sm">
              {annotations.length===0 && <li className="text-neutral-500">{L('Inga noteringar ännu.','No annotations yet.')}</li>}
              {annotations.map((a,i)=> (
                <li key={i} className="flex items-center justify-between border-b py-1">
                  <span>{new Date(a.ts).toLocaleString()} — {a.text}</span>
                  <button className="text-xs underline" onClick={()=>setAnnotations((arr)=>arr.filter((_,idx)=>idx!==i))}>{L('Ta bort','Remove')}</button>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Drill down modal */}
        {drill.open && (
          <div className="fixed inset-0 z-50 grid place-items-center">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setDrill({ open:false, type:null, rows:[] })}></div>
            <div className="relative section-card w-[95vw] max-w-4xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg">{L('Detaljer','Details')}: {drill.type}</h3>
                <div className="flex items-center gap-2">
                  <button className="btn-outline" onClick={()=>analyticsExportEventsCsv(drill.rows)}>{L('Exportera','Export')}</button>
                  <button className="btn-primary" onClick={()=>setDrill({ open:false, type:null, rows:[] })}>{L('Stäng','Close')}</button>
                </div>
              </div>
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-100 text-left">
                      <th className="px-2 py-1">{L('Tid','Time')}</th>
                      <th className="px-2 py-1">Type</th>
                      <th className="px-2 py-1">Route</th>
                      <th className="px-2 py-1">Lang</th>
                      <th className="px-2 py-1">Device</th>
                      <th className="px-2 py-1">Payload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drill.rows.length===0 && (<tr><td className="px-2 py-2 text-neutral-600" colSpan={6}>{L('Inga data.','No data.')}</td></tr>)}
                    {drill.rows.map((r,i)=> (
                      <tr key={r.id||i} className="border-t">
                        <td className="px-2 py-1">{new Date(r.ts).toLocaleString()}</td>
                        <td className="px-2 py-1">{r.type}</td>
                        <td className="px-2 py-1">{r.route||''}</td>
                        <td className="px-2 py-1">{(r.lang||'').toUpperCase()}</td>
                        <td className="px-2 py-1">{r.device||''}</td>
                        <td className="px-2 py-1"><code className="text-xs">{JSON.stringify(r.payload)}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <Section id="admin-header" title={L('Header','Header')} visible={isSectionVisible('admin-header')} help={L('Ställ in logotyp, navigationsetiketter och aktiva språk.','Configure logo, navigation labels, and active languages.') }>
          <label className="flex items-center gap-2 mb-3" title={L('Visa/Dölj headern på webbplatsen','Show/Hide the header on the site')}>
            <Toggle checked={!!data.header.visible} onChange={handleToggle(['header','visible'])} />
            <span>{L('Visa header','Show header')}</span>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Logotyp URL','Logo URL')}</label>
              <input className="w-full border rounded px-3 py-2" title={L('Länk till logotypbilden (URL)','Link to logo image (URL)')} value={data.header.logo || ''} onChange={handleChange(['header','logo'])} placeholder="https://..." />
              <div className="mt-2 flex items-center gap-2">
                <input type="file" accept="image/*" title={L('Ladda upp logotypbild','Upload logo image')} onChange={handleFileToDataUrl(['header','logo'])} />
                <button type="button" className="btn-outline text-xs" onClick={clearField(['header','logo'])} title={L('Rensa fältet','Clear the field')}>{L('Rensa','Clear')}</button>
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
              <input className="w-full border rounded px-3 py-2 mb-2" title={L('Text för Hem‑länken i menyn','Text for Home link in the menu')} value={data.header.nav.home?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.header.nav.home[currentLang]=e.target.value; setData(n)}} />
              <label className="block text-sm text-neutral-600 mb-1">{L('Kommande auktioner','Upcoming auctions')}</label>
              <input className="w-full border rounded px-3 py-2 mb-2" title={L('Text för Kommande Auktioner i menyn','Text for Upcoming Auctions in the menu')} value={data.header.nav.auctions?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.header.nav.auctions[currentLang]=e.target.value; setData(n)}} />
              <label className="block text-sm text-neutral-600 mb-1">{L('Auktionsvaror','Auction items')}</label>
              <input className="w-full border rounded px-3 py-2 mb-2" title={L('Text för Auktionsvaror i menyn','Text for Auction Items in the menu')} value={data.header.nav.items?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.header.nav.items[currentLang]=e.target.value; setData(n)}} />
              <label className="block text-sm text-neutral-600 mb-1">{L('Auktionsvillkor','Terms')}</label>
              <input className="w-full border rounded px-3 py-2" title={L('Text för Auktionsvillkor i menyn','Text for Terms in the menu')} value={data.header.nav.terms?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.header.nav.terms[currentLang]=e.target.value; setData(n)}} />
            </div>
          </div>
        </Section>

        {/* Registration moved to Engagement group below (after Ratings) */}

        {/* Marketing: Newsletter, Share, Chat */}
        <Section id="admin-newsletter" title={L('Nyhetsbrev','Newsletter')} visible={isSectionVisible('admin-newsletter')} help={L('Aktivera popup för nyhetsbrev. Anpassa rubriker, fält och triggrar (timer eller scroll).','Enable the newsletter popup. Customize titles, fields and triggers (timer or scroll).') }>
          <label className="flex items-center gap-2 mb-3" title={L('Aktivera/avaktivera popup för nyhetsbrev','Enable/disable newsletter popup')}>
            <Toggle checked={!!data.newsletter?.popupEnabled} onChange={(e)=>{const n={...data}; n.newsletter = n.newsletter||{}; n.newsletter.popupEnabled = e.target.checked; setData(n)}} />
            <span>{L('Aktivera popup','Enable popup')}</span>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Titel','Title')} ({currentLang.toUpperCase()})</label>
              <input className="w-full border rounded px-3 py-2" title={L('Rubrik i popup (aktuellt språk)','Popup headline (current language)')} value={data.newsletter?.title?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.newsletter = n.newsletter||{}; n.newsletter.title = { ...(n.newsletter.title||{}), [currentLang]: e.target.value }; setData(n)}} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Undertitel','Subtitle')} ({currentLang.toUpperCase()})</label>
              <input className="w-full border rounded px-3 py-2" title={L('Underrubrik i popup (aktuellt språk)','Popup subtitle (current language)')} value={data.newsletter?.subtitle?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.newsletter = n.newsletter||{}; n.newsletter.subtitle = { ...(n.newsletter.subtitle||{}), [currentLang]: e.target.value }; setData(n)}} />
            </div>
          </div>
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-serif text-lg mb-2">{L('Fält','Fields')}</h3>
              <label className="flex items-center gap-2 mb-1" title={L('Visa fält för namn i popupen','Show name field in the popup')}><Toggle checked={!!data.newsletter?.fields?.name} onChange={(e)=>{const n={...data}; n.newsletter=n.newsletter||{}; n.newsletter.fields=n.newsletter.fields||{}; n.newsletter.fields.name=e.target.checked; setData(n)}} />{L('Namn','Name')}</label>
              <label className="flex items-center gap-2 mb-1" title={L('Visa fält för e‑post i popupen','Show email field in the popup')}><Toggle checked={data.newsletter?.fields?.email !== false} onChange={(e)=>{const n={...data}; n.newsletter=n.newsletter||{}; n.newsletter.fields=n.newsletter.fields||{}; n.newsletter.fields.email=e.target.checked; setData(n)}} />Email</label>
              <label className="flex items-center gap-2" title={L('Visa fält för telefon i popupen','Show phone field in the popup')}><Toggle checked={!!data.newsletter?.fields?.tel} onChange={(e)=>{const n={...data}; n.newsletter=n.newsletter||{}; n.newsletter.fields=n.newsletter.fields||{}; n.newsletter.fields.tel=e.target.checked; setData(n)}} />{L('Telefon','Phone')}</label>
            </div>
            <div>
              <h3 className="font-serif text-lg mb-2">{L('Utlösare','Triggers')}</h3>
              <label className="block text-sm text-neutral-600 mb-1">{L('Läge','Mode')}</label>
              <select className="w-full border rounded px-3 py-2 mb-2" title={L('Välj hur popupen ska triggas','Choose how the popup should trigger')} value={data.newsletter?.triggers?.mode || 'timer'} onChange={(e)=>{const n={...data}; n.newsletter=n.newsletter||{}; n.newsletter.triggers = { ...(n.newsletter.triggers||{}), mode: e.target.value }; setData(n)}}>
                <option value="timer">{L('Timer','Timer')}</option>
                <option value="scroll">{L('Skroll','Scroll')}</option>
              </select>
              <label className="block text-sm text-neutral-600 mb-1">{L('Fördröjning (ms)','Delay (ms)')}</label>
              <input type="number" className="w-full border rounded px-3 py-2 mb-2" title={L('Fördröjning i millisekunder innan popup visas','Delay in milliseconds before popup shows')} value={data.newsletter?.triggers?.delayMs ?? 5000} onChange={(e)=>{const n={...data}; n.newsletter=n.newsletter||{}; n.newsletter.triggers = { ...(n.newsletter.triggers||{}), delayMs: parseInt(e.target.value||'0',10) }; setData(n)}} />
              <label className="block text-sm text-neutral-600 mb-1">{L('Scroll %','Scroll %')}</label>
              <input type="number" min="0" max="100" className="w-full border rounded px-3 py-2 mb-2" title={L('Procent scroll på sidan innan popup visas','Page scroll percentage before popup shows')} value={data.newsletter?.triggers?.scrollPercent ?? 50} onChange={(e)=>{const n={...data}; n.newsletter=n.newsletter||{}; n.newsletter.triggers = { ...(n.newsletter.triggers||{}), scrollPercent: parseInt(e.target.value||'0',10) }; setData(n)}} />
              <label className="flex items-center gap-2"><Toggle checked={data.newsletter?.triggers?.oncePerSession !== false} onChange={(e)=>{const n={...data}; n.newsletter=n.newsletter||{}; n.newsletter.triggers = { ...(n.newsletter.triggers||{}), oncePerSession: e.target.checked }; setData(n)}} />{L('Visa en gång per session','Show once per session')}</label>
            </div>
            <div>
              <h3 className="font-serif text-lg mb-2">{L('Prenumeranter','Subscribers')}</h3>
              <div className="section-card p-3">
                <div className="text-sm mb-2">{L('Antal','Count')}: {loadSubscribers().length}</div>
                <button type="button" className="btn-outline" onClick={exportCsv} title={L('Exportera prenumeranter som CSV','Export subscribers as CSV')}>{L('Exportera CSV','Export CSV')}</button>
              </div>
            </div>
          </div>
        </Section>

        <Section id="admin-share" title={L('Dela (Social)','Share (Social)')} visible={isSectionVisible('admin-share')} help={L('Aktivera delningsmenyn och välj kanaler (Facebook, Twitter m.fl.).','Enable the share menu and choose platforms (Facebook, Twitter, etc.).') }>
          <label className="flex items-center gap-2 mb-3" title={L('Aktivera/avaktivera delningsmenyn','Enable/disable the share menu')}>
            <Toggle checked={!!data.share?.enabled} onChange={(e)=>{const n={...data}; n.share=n.share||{}; n.share.enabled=e.target.checked; setData(n)}} />
            <span>{L('Aktivera delningsmeny','Enable share menu')}</span>
          </label>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Position','Position')}</label>
              <select className="w-full border rounded px-3 py-2" title={L('Placering av delningsmeny','Placement of the share menu')} value={data.share?.position||'right'} onChange={(e)=>{const n={...data}; n.share=n.share||{}; n.share.position = e.target.value==='left'?'left':'right'; setData(n)}}>
                <option value="right">{L('Höger','Right')}</option>
                <option value="left">{L('Vänster','Left')}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-neutral-600 mb-1">{L('Omslagsbild (URL)','Cover image (URL)')}</label>
              <input className="w-full border rounded px-3 py-2" title={L('OG‑bild/omslagsbild som används vid delning','Open Graph / cover image used when sharing')} value={data.share?.coverUrl||''} onChange={(e)=>{const n={...data}; n.share=n.share||{}; n.share.coverUrl=e.target.value; setData(n)}} placeholder="https://..." />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Delningstext (SV)','Share text (SV)')}</label>
              <textarea className="w-full border rounded px-3 py-2 min-h-[80px]" title={L('Text som följer med vid delning (svenska)','Text included when sharing (Swedish)')} value={data.share?.text?.sv||''} onChange={(e)=>{const n={...data}; n.share=n.share||{}; n.share.text = { ...(n.share.text||{}), sv: e.target.value }; setData(n)}} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Delningstext (EN)','Share text (EN)')}</label>
              <textarea className="w-full border rounded px-3 py-2 min-h-[80px]" title={L('Text som följer med vid delning (engelska)','Text included when sharing (English)')} value={data.share?.text?.en||''} onChange={(e)=>{const n={...data}; n.share=n.share||{}; n.share.text = { ...(n.share.text||{}), en: e.target.value }; setData(n)}} />
            </div>
          </div>
          <div className="grid md:grid-cols-5 gap-4 mt-4">
            {['facebook','twitter','linkedin','telegram','copy'].map((k)=> (
              <label key={k} className="flex items-center gap-2">
                <Toggle size="sm" title={L('Visa/dölj kanal','Show/hide platform')} checked={data.share?.platforms?.[k]!==false} onChange={(e)=>{const n={...data}; n.share=n.share||{}; n.share.platforms = { ...(n.share.platforms||{}), [k]: e.target.checked }; setData(n)}} />
                <span className="capitalize">{k}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-neutral-600 mt-3">
            {L('Omslagsbild används av sociala medier vid delning (Open Graph). Se till att din domän har rätt meta-taggar.','Cover image is used by social platforms (Open Graph). Ensure proper meta tags on your domain.')}
          </p>
        </Section>

        <Section id="admin-chat" title={L('Chat (WhatsApp)','Chat (WhatsApp)')} visible={isSectionVisible('admin-chat')} help={L('Aktivera WhatsApp-chatt och hälsningsmeddelande. Ange telefonnummer i E.164-format.','Enable WhatsApp chat and greeting text. Provide phone number in E.164 format.') }>
          <label className="flex items-center gap-2 mb-3" title={L('Aktivera/avaktivera WhatsApp‑chatten','Enable/disable WhatsApp chat')}>
            <Toggle checked={!!data.chat?.enabled} onChange={(e)=>{const n={...data}; n.chat = n.chat||{}; n.chat.enabled = e.target.checked; setData(n)}} />
            <span>{L('Aktivera WhatsApp-chat','Enable WhatsApp chat')}</span>
          </label>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Telefon (E.164, t.ex. +46701234567)','Phone (E.164, e.g. +46701234567)')}</label>
              <input className="w-full border rounded px-3 py-2" title={L('Telefon i E.164‑format, t.ex. +46701234567','Phone in E.164 format, e.g. +46701234567')} value={data.chat?.phoneE164||''} onChange={(e)=>{const n={...data}; n.chat=n.chat||{}; n.chat.phoneE164=e.target.value; setData(n)}} placeholder="+4670..." />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Position','Position')}</label>
              <select className="w-full border rounded px-3 py-2" title={L('Placering av chatknappen','Placement of the chat button')} value={data.chat?.position||'right'} onChange={(e)=>{const n={...data}; n.chat=n.chat||{}; n.chat.position = e.target.value==='left'?'left':'right'; setData(n)}}>
                <option value="right">{L('Höger','Right')}</option>
                <option value="left">{L('Vänster','Left')}</option>
              </select>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Hälsning (SV)','Greeting (SV)')}</label>
              <textarea className="w-full border rounded px-3 py-2 min-h-[80px]" title={L('Hälsningsmeddelande på svenska','Greeting message in Swedish')} value={data.chat?.greeting?.sv||''} onChange={(e)=>{const n={...data}; n.chat=n.chat||{}; n.chat.greeting = { ...(n.chat.greeting||{}), sv: e.target.value }; setData(n)}} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Hälsning (EN)','Greeting (EN)')}</label>
              <textarea className="w-full border rounded px-3 py-2 min-h-[80px]" title={L('Hälsningsmeddelande på engelska','Greeting message in English')} value={data.chat?.greeting?.en||''} onChange={(e)=>{const n={...data}; n.chat=n.chat||{}; n.chat.greeting = { ...(n.chat.greeting||{}), en: e.target.value }; setData(n)}} />
            </div>
          </div>
          <p className="text-xs text-neutral-600 mt-3">
            {L('Knappen öppnar WhatsApp i en ny flik och förifyller ditt meddelande.','The button opens WhatsApp in a new tab and pre-fills your message.')}
          </p>
        </Section>

        {/* Newsletter moved above into Marketing group */}

        <Section id="admin-faq" title="FAQ" visible={isSectionVisible('admin-faq')} help={L('Hantera vanliga frågor och svar. Lägg till, redigera och ordna poster.','Manage frequently asked questions. Add, edit, and arrange entries.') }>
          <label className="flex items-center gap-2 mb-3" title={L('Visa/Dölj FAQ‑sektionen','Show/Hide the FAQ section')}>
            <Toggle checked={!!data.faq?.visible} onChange={(e)=>{const n={...data}; n.faq = n.faq||{}; n.faq.visible = e.target.checked; setData(n)}} />
            <span>{L('Visa sektion','Show section')}</span>
          </label>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-lg">{L('Frågor & svar','Questions & Answers')}</h3>
            <button className="btn-outline text-sm" onClick={()=>{const n={...data}; n.faq = n.faq||{}; n.faq.items = n.faq.items||[]; n.faq.items.push({ q:{sv:'',en:''}, a:{sv:'',en:''} }); setData(n)}} title={L('Lägg till en ny fråga','Add a new question')}>{L('Lägg till','Add')}</button>
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
                    <input className="w-full border rounded px-3 py-2" title={L('Frågetext (aktuellt språk)','Question text (current language)')} value={it.q?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.faq.items[idx].q = { ...(n.faq.items[idx].q||{}), [currentLang]: e.target.value }; setData(n)}} />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">{L('Svar','Answer')} ({currentLang.toUpperCase()})</label>
                    <textarea className="w-full border rounded px-3 py-2 min-h-[80px]" title={L('Svarstext (aktuellt språk)','Answer text (current language)')} value={it.a?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.faq.items[idx].a = { ...(n.faq.items[idx].a||{}), [currentLang]: e.target.value }; setData(n)}} />
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

        <Section id="admin-hero" title={L('Hero (Hem)','Hero (Home)')} visible={isSectionVisible('admin-hero')} help={L('Hjälptext: Startsektion på hemsidan. Ange bakgrundsbild, nästa auktioner och CTA-knapp.','Help: Home hero section. Set background image, next auctions and CTA link/text.') }>
          <label className="flex items-center gap-2 mb-3" title={L('Visa/Dölj Hero‑sektionen på startsidan','Show/Hide the Home hero section')}>
            <Toggle checked={!!data.hero.visible} onChange={handleToggle(['hero','visible'])} />
            <span>{L('Visa hero','Show hero')}</span>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            {/* hero details form fields here */}
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Titel','Title')} ({currentLang.toUpperCase()})</label>
              <input className="w-full border rounded px-3 py-2" title={L('Hjälprubrik på startsidan (aktuellt språk)','Home hero title (current language)')} value={data.hero.title?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.hero.title = { ...(n.hero.title||{}), [currentLang]: e.target.value }; setData(n)}} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Undertitel','Subtitle')} ({currentLang.toUpperCase()})</label>
              <input className="w-full border rounded px-3 py-2" title={L('Underrubrik på startsidan (aktuellt språk)','Home hero subtitle (current language)')} value={data.hero.subtitle?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.hero.subtitle = { ...(n.hero.subtitle||{}), [currentLang]: e.target.value }; setData(n)}} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-neutral-600 mb-1">{L('Bakgrundsbild (URL)','Background image (URL)')}</label>
              <input
                className="w-full border rounded px-3 py-2"
                title={L('Länk till bakgrundsbild (URL)','Link to background image (URL)')}
                value={data.hero.bg || ''}
                onChange={(e)=>{const n={...data}; n.hero.bg = e.target.value; setData(n)}}
                placeholder="https://..."
              />
              <div className="mt-2 flex items-center gap-2">
                <input type="file" accept="image/*" title={L('Ladda upp bakgrundsbild','Upload background image')} onChange={handleFileToDataUrl(['hero','bg'])} />
                <button type="button" className="btn-outline text-xs" onClick={clearField(['hero','bg'])} title={L('Rensa fältet','Clear the field')}>{L('Rensa','Clear')}</button>
              </div>
              {data.hero.bg && (
                <div className="mt-2">
                  <img src={data.hero.bg} alt={L('Hero bakgrund','Hero background')} className="h-32 w-auto border rounded bg-white object-cover" />
                </div>
              )}
              <p className="text-xs text-neutral-600 mt-2">
                {L('Tips: Använd en bred bild för bästa resultat (t.ex. 1600×900).','Tip: Use a wide image for best results (e.g., 1600×900).')}
              </p>
            </div>
          </div>
        </Section>

        <Section id="admin-auctions" title={L('Kommande Auktioner','Upcoming Auctions')} visible={isSectionVisible('admin-auctions')} help={L('Lägg till och redigera platsauktioner med adress, visningstid, datum och start. Du kan skapa Live‑Event direkt från en auktion.','Add and edit in‑person auctions with address, viewing window, date and start time. You can create a Live Event directly from an auction.') }>
          <label className="flex items-center gap-2 mb-3" title={L('Visa/Dölj sektionen Kommande Auktioner','Show/Hide Upcoming Auctions section')}>
            <Toggle checked={!!data.auctions.visible} onChange={handleToggle(['auctions','visible'])} />
            <span>{L('Visa sektion','Show section')}</span>
          </label>
          <div className="flex items-center justify-between mb-2">
            {/* auctions management controls here */}
            <button className="btn-outline text-sm" type="button" onClick={addAuction} title={L('Skapa en ny auktion i listan','Create a new auction in the list')}>{L('Lägg till auktion','Add auction')}</button>
          </div>
          <div className="grid gap-3">
            {(data.auctions.list||[]).length === 0 && (
              <div className="section-card p-3 text-neutral-600 text-sm">{L('Inga auktioner ännu.','No auctions yet.')}</div>
            )}
            {(data.auctions.list||[]).map((a, idx) => (
              <div key={idx} className="section-card p-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">{L('Titel','Title')} ({currentLang.toUpperCase()})</label>
                    <input className="w-full border rounded px-3 py-2" title={L('Auktionens titel (aktuellt språk)','Auction title (current language)')} value={a.title?.[currentLang] || ''} onChange={(e)=>updateAuction(idx,'title',{...(a.title||{}), [currentLang]: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">{L('Adress','Address')} ({currentLang.toUpperCase()})</label>
                    <input className="w-full border rounded px-3 py-2" title={L('Auktionens adress (aktuellt språk)','Auction address (current language)')} value={a.address?.[currentLang] || ''} onChange={(e)=>updateAuction(idx,'address',{...(a.address||{}), [currentLang]: e.target.value})} />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="btn-outline" onClick={()=>removeAuction(idx)} title={L('Ta bort denna auktion','Remove this auction')}>{L('Ta bort','Remove')}</button>
                  <button className="btn-primary" onClick={()=>createLiveEventFromAuction(idx)} title={L('Skapa ett Live‑Event kopplat till denna auktion','Create a Live Event linked to this auction')}>{L('Skapa Live Event','Create Live Event')}</button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="admin-items" title={L('Auktionsvaror','Auction Items')} visible={isSectionVisible('admin-items')} help={L('Kategorisera och lista varor som visas på publika sidan. Varje post kan ha namn, typ, storlek och pris.','Categorize and list items shown on the public site. Each entry may include name, type, size and price.') }>
          <label className="flex items-center gap-2 mb-3" title={L('Visa/Dölj sektionen Auktionsvaror','Show/Hide Auction Items section')}>
            <Toggle checked={!!data.items.visible} onChange={handleToggle(['items','visible'])} />
            <span>{L('Visa sektion','Show section')}</span>
          </label>
          <p className="text-sm text-neutral-600 mb-3">{L('Hantera kategorier och lägg upp bilder för varje kategori. På framsidan visas en flik för Alla samt per kategori.','Manage categories and upload pictures per category. The frontend shows an All tab and per-category tabs.')}</p>
          {/* items/categories management UI here */}
          <div className="section-card p-3 text-neutral-600 text-sm">{L('Hantera auktionsvaror kommer här.','Auction items management coming here.')}</div>
        </Section>

        {/* Engagement: Registration then Ratings */}
        <Section id="admin-registration" title={L('Registrering','Registration')} visible={isSectionVisible('admin-registration')} help={L('Aktivera besökaranmälan före auktion. Ställ in fält och egna frågor. Exportera inskick via CSV.','Enable visitor registration before auctions. Configure fields and custom questions. Export submissions via CSV.') }>
          <label className="flex items-center gap-2 mb-3" title={L('Aktivera/avaktivera registreringsformulär','Enable/disable the registration form')}>
            <Toggle checked={!!data.registration?.enabled} onChange={(e)=>{const n={...data}; n.registration=n.registration||{}; n.registration.enabled=e.target.checked; setData(n)}} />
            <span>{L('Aktivera registrering','Enable registration')}</span>
          </label>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-serif text-lg mb-2">{L('Fält','Fields')}</h3>
              {['name','email','tel','notes'].map((k)=> (
                <label key={k} className="flex items-center gap-2 mb-1">
                  <Toggle checked={data.registration?.fields?.[k] !== false} onChange={(e)=>{const n={...data}; n.registration=n.registration||{}; n.registration.fields={...(n.registration.fields||{}) ,[k]: e.target.checked}; setData(n)}} />
                  <span className="capitalize">{k}</span>
                </label>
              ))}
            </div>
            <div className="md:col-span-2">
              <h3 className="font-serif text-lg mb-2">{L('Frågor','Questions')}</h3>
              <button type="button" className="btn-outline text-sm mb-2" onClick={()=>{const n={...data}; n.registration=n.registration||{}; n.registration.questions = [...(n.registration.questions||[]), { id: `q${(n.registration.questions?.length||0)+1}`, label:{sv:'',en:''}, options: [] }]; setData(n)}} title={L('Lägg till en ny fråga','Add a new question')}>{L('Lägg till fråga','Add question')}</button>
              <div className="grid gap-3">
                {(data.registration?.questions||[]).map((q, i)=> (
                  <div key={q.id||i} className="section-card p-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-neutral-600 mb-1">Label (SV)</label>
                        <input className="w-full border rounded px-3 py-2" title={L('Etikett på svenska','Label in Swedish')} value={q.label?.sv||''} onChange={(e)=>{const n={...data}; n.registration.questions[i].label = { ...(n.registration.questions[i].label||{}), sv: e.target.value }; setData(n)}} />
                      </div>
                      <div>
                        <label className="block text-sm text-neutral-600 mb-1">Label (EN)</label>
                        <input className="w-full border rounded px-3 py-2" title={L('Etikett på engelska','Label in English')} value={q.label?.en||''} onChange={(e)=>{const n={...data}; n.registration.questions[i].label = { ...(n.registration.questions[i].label||{}), en: e.target.value }; setData(n)}} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-neutral-600 mb-1">{L('Svarsalternativ (komma-separerade)','Options (comma-separated)')}</label>
                        <input className="w-full border rounded px-3 py-2" title={L('Ange alternativ separerade med komma','Provide options separated by commas')} value={(q.options||[]).join(', ')} onChange={(e)=>{const n={...data}; n.registration.questions[i].options = e.target.value.split(',').map(s=>s.trim()).filter(Boolean); setData(n)}} />
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button type="button" className="btn-outline text-xs" onClick={()=>{const n={...data}; n.registration.questions.splice(i,1); setData(n)}}>{L('Ta bort','Remove')}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg">{L('Inkomna anmälningar','Submissions')}</h3>
              <button type="button" className="btn-outline text-sm" onClick={exportRegistrationCsv}>{L('Exportera CSV','Export CSV')}</button>
            </div>
            <div className="section-card p-3 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-100 text-left">
                    <th className="px-2 py-1">ID</th>
                    <th className="px-2 py-1">{L('Titel','Title')}</th>
                    <th className="px-2 py-1">Email</th>
                    <th className="px-2 py-1">{L('Telefon','Phone')}</th>
                    <th className="px-2 py-1">{L('Tid','Time')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.registration?.submissions||{}).flatMap(([aid, arr]) => (arr||[]).map((it, idx)=> (
                    <tr key={`${aid}-${idx}`} className="border-t">
                      <td className="px-2 py-1 whitespace-nowrap">{aid}</td>
                      <td className="px-2 py-1">{it.title||''}</td>
                      <td className="px-2 py-1">{it.email||''}</td>
                      <td className="px-2 py-1">{it.tel||''}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{it.ts ? new Date(it.ts).toLocaleString() : ''}</td>
                    </tr>
                  )))}
                  {(!data.registration || !data.registration.submissions || Object.keys(data.registration.submissions).length===0) && (
                    <tr><td className="px-2 py-2 text-neutral-600" colSpan={5}>{L('Inga anmälningar ännu.','No submissions yet.')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section id="admin-ratings" title={L('Betyg','Ratings')} visible={isSectionVisible('admin-ratings')} help={L('Aktivera stjärnbetyg för att samla in omdömen från besökare.','Enable star ratings to collect visitor feedback.') }>
          <label className="flex items-center gap-2 mb-3" title={L('Aktivera/avaktivera betyg','Enable/disable ratings')}>
            <Toggle checked={!!data.ratings?.enabled} onChange={(e)=>{const n={...data}; n.ratings = n.ratings||{}; n.ratings.enabled = e.target.checked; setData(n)}} />
            <span>{L('Aktivera betygssystem (stjärnor)','Enable ratings (stars)')}</span>
          </label>
          <p className="text-sm text-neutral-600">
            {L('När detta är aktiverat visas stjärnbetyg i sektionen Kommande Auktioner och för varje auktionsvara. Backend använder Cloudflare D1.','When enabled, star ratings appear in Upcoming Auctions and for each Auction Item. Backend uses Cloudflare D1.')}
          </p>
        </Section>

        {/* Live Action (Admin) */}
        <Section id="admin-liveaction" title={L('Action (Live)','Action (Live)')} visible={isSectionVisible('admin-liveaction')} help={L('Skapa live‑event, länka till Kommande Auktioner, lägg in varor. Styr i realtid: Start/Stop, Visa nästa, Markera såld. CSV‑import/export stöds.','Create live events, link to Upcoming Auctions, add items. Control in real‑time: Start/Stop, Reveal next, Mark sold. CSV import/export supported.') }>
          <LiveActionAdmin data={data} setData={setData} L={L} />
        </Section>

        <Section id="admin-terms" title={L('Auktionsvillkor','Terms')} visible={isSectionVisible('admin-terms')} help={L('Redigera villkorstexter på svenska och engelska.','Edit terms text in Swedish and English.') }>
          <label className="flex items-center gap-2 mb-3" title={L('Visa/Dölj sektionen Auktionsvillkor','Show/Hide Terms section')}>
            <Toggle checked={!!data.terms.visible} onChange={handleToggle(['terms','visible'])} />
            <span>{L('Visa sektion','Show section')}</span>
          </label>
          {Object.entries(data.terms.blocks).map(([key, val]) => (
            <div key={key} className="mb-4">
              <label className="block text-sm text-neutral-600 mb-1">{key} ({currentLang.toUpperCase()})</label>
              <textarea className="w-full border rounded px-3 py-2 min-h-[100px]" title={L('Villkorstext (aktuellt språk)','Terms text (current language)')} value={val?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.terms.blocks[key] = { ...(n.terms.blocks[key]||{}), [currentLang]: e.target.value }; setData(n)}} />
            </div>
          ))}
        </Section>

        <Section id="admin-instagram" title={L('Instagram','Instagram')} visible={isSectionVisible('admin-instagram')} help={L('Visa ett Instagramflöde på webbplatsen. Ange användarnamn och token.','Show an Instagram feed on the website. Provide username and token.') }>
          <label className="flex items-center gap-2 mb-3" title={L('Visa/Dölj Instagram‑sektionen','Show/Hide Instagram section')}>
            <Toggle checked={!!data.instagram.visible} onChange={handleToggle(['instagram','visible'])} />
            <span>{L('Visa sektion','Show section')}</span>
          </label>
          <div className="grid md:grid-cols-3 gap-3">
            {/* instagram configuration inputs here */}
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Layout','Layout')}</label>
              <select className="w-full border rounded px-3 py-2" title={L('Välj layout för Instagramflödet','Choose layout for Instagram feed')} value={data.instagram.layout} onChange={(e)=>{const n={...data}; n.instagram.layout=e.target.value; setData(n)}}>
                <option value="grid">{L('Rutnät','Grid')}</option>
                <option value="carousel">{L('Karusell','Carousel')}</option>
              </select>
            </div>
          </div>
        </Section>

        <Section id="admin-maps" title={L('Google Maps','Google Maps')} visible={isSectionVisible('admin-maps')} help={L('Ange Google Maps API‑nyckel, språk och standardzoom.','Provide Google Maps API key, language and default zoom.') }>
          <label className="flex items-center gap-2 mb-3" title={L('Visa/Dölj kartsektionen','Show/Hide the map section')}>
            <Toggle checked={!!data.maps?.visible} onChange={handleToggle(['maps','visible'])} />
            <span>{L('Visa sektion','Show section')}</span>
          </label>
          <div className="grid md:grid-cols-3 gap-3">
            {/* maps configuration inputs here */}
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('API-nyckel','API key')}</label>
              <input className="w-full border rounded px-3 py-2" title={L('Google Maps API‑nyckel','Google Maps API key')} value={data.maps?.apiKey||''} onChange={(e)=>{const n={...data}; n.maps = n.maps||{}; n.maps.apiKey = e.target.value; setData(n)}} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-neutral-600">
              {L('Tips: Använd Google Cloud Console för att skapa en nyckel och begränsa den till Maps JavaScript & Places API.','Tip: Use Google Cloud Console to create a key and restrict it to Maps JavaScript & Places API.')}
            </p>
          </div>
        </Section>

        <Section id="admin-footer" title={L('Footer','Footer')} visible={isSectionVisible('admin-footer')} help={L('Redigera kontaktuppgifter, logotyp och sociala länkar i sidfoten.','Edit contact details, logo and social links in the footer.') }>
          <label className="flex items-center gap-2 mb-3" title={L('Visa/Dölj sidfoten','Show/Hide the footer')}>
            <Toggle checked={!!data.footer.visible} onChange={handleToggle(['footer','visible'])} />
            <span>{L('Visa footer','Show footer')}</span>
          </label>
          <div className="grid md:grid-cols-3 gap-3">
            {/* footer configuration inputs here */}
            <div className="md:col-span-2">
              <label className="block text-sm text-neutral-600 mb-1">{L('Adress','Address')} ({currentLang.toUpperCase()})</label>
              <textarea className="w-full border rounded px-3 py-2 min-h-[100px]" title={L('Adressrad i sidfoten (aktuellt språk)','Footer address (current language)')} value={data.footer.address?.[currentLang] || ''} onChange={(e)=>{const n={...data}; n.footer.address = { ...(n.footer.address||{}), [currentLang]: e.target.value }; setData(n)}} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">{L('Nyhetsbrev','Newsletter')}</label>
              <label className="flex items-center gap-2" title={L('Visa nyhetsbrevsruta i sidfoten','Show a newsletter box in the footer')}><Toggle checked={!!data.footer.newsletter} onChange={handleToggle(['footer','newsletter'])} />{L('Aktivera','Enable')}</label>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="font-serif text-lg mb-2">{L('Sociala medier','Social media')}</h3>
              {[
                { key: 'facebook', label: 'Facebook' },
                { key: 'instagram', label: 'Instagram' },
                { key: 'tiktok', label: 'TikTok' },
                { key: 'youtube', label: 'YouTube' },
                { key: 'website', label: L('Webbplats','Website') },
              ].map(({key,label}) => (
                <div key={key} className="mb-3">
                  <label className="block text-sm text-neutral-600 mb-1">{label} URL</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="https://..."
                    value={data.footer?.social?.[key] || ''}
                    onChange={(e)=>{const n={...data}; n.footer=n.footer||{}; n.footer.social = { ...(n.footer.social||{}), [key]: e.target.value }; setData(n)}}
                    title={L('Länk till kanalens sida','Link to the channel page')}
                  />
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-serif text-lg mb-2">{L('Kanaler','Channels')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {['facebook','instagram','tiktok','youtube','website'].map((k)=> (
                  <label key={k} className="flex items-center gap-2">
                    <Toggle
                      title={L('Visa/dölj kanal i sidfoten','Show/hide channel in footer')}
                      checked={(data.footer?.socialEnabled?.[k] !== false)}
                      onChange={(e)=>{const n={...data}; n.footer=n.footer||{}; n.footer.socialEnabled = { ...(n.footer.socialEnabled||{}), [k]: e.target.checked }; setData(n)}}
                    />
                    <span className="capitalize">{k}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-neutral-600 mt-2">{L('Visa/ dölj varje kanal oberoende. Kanalen visas endast om URL är ifylld.','Show/hide each channel independently. A channel is shown only if its URL is provided.')}</p>
            </div>
          </div>
        </Section>

        <Section id="admin-subscribers" title={L('Prenumeranter','Subscribers')} visible={isSectionVisible('admin-subscribers')} help={L('Visa och exportera nya prenumeranter som samlats in via nyhetsbrevs‑popupen.','View and export newsletter subscribers collected via the popup.') }>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-neutral-600">{L('Totalt','Total')}: {subscribers.length}</div>
            <button type="button" className="btn-outline" onClick={exportCsv}>{L('Exportera CSV','Export CSV')}</button>
          </div>
          <div className="overflow-auto border rounded bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-100 text-left">
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">{L('Namn','Name')}</th>
                  <th className="px-3 py-2">Tel</th>
                  <th className="px-3 py-2">{L('Tid','Time')}</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{s.email||''}</td>
                    <td className="px-3 py-2">{s.name||''}</td>
                    <td className="px-3 py-2">{s.tel||''}</td>
                    <td className="px-3 py-2">{s.ts ? new Date(s.ts).toLocaleString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Bottom actions (duplicate for convenience) */}
        <div className="flex items-center gap-3">
          <button className="btn-primary" onClick={save}>{L('Spara','Save')}</button>
          <button className="btn-outline" onClick={hardReset}>{L('Återställ standard','Reset to defaults')}</button>
        </div>

        {/* end content grid */}
        </div>
        {/* end outer grid container */}
        </div>
      </main>
    </div>
  )
}
