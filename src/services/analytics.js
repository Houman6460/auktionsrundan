// Simple in-browser analytics service backed by localStorage
// Stores events like page views, newsletter subscriptions, registrations, ratings

const ANALYTICS_KEY = 'ar_analytics_events_v1'

export function loadEvents() {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveEvents(list) {
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(Array.isArray(list) ? list : []))
  // Notify listeners
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new StorageEvent('storage', { key: ANALYTICS_KEY }))
    }
  } catch {}
}

export function trackEvent(type, payload = {}) {
  const evt = { id: randomId(), type, payload, ts: Date.now() }
  const list = loadEvents()
  list.push(evt)
  saveEvents(list)
  return evt
}

export function trackPageView(path) {
  return trackEvent('page_view', { path })
}

export function trackNewsletterSubscribe({ email, name, tel }) {
  return trackEvent('newsletter_subscribe', { email, name, tel })
}

export function trackRegistrationSubmit({ auctionId, title, email, name, tel, answers }) {
  return trackEvent('registration_submit', { auctionId, title, email, name, tel, answers })
}

export function trackRating({ itemId, value }) {
  return trackEvent('rating_submit', { itemId, value })
}

export function trackSectionView(sectionId) {
  return trackEvent('section_view', { sectionId })
}

export function exportAnalyticsCsv() {
  const list = loadEvents()
  const headers = ['id','type','timestamp','payload']
  const rows = list.map((e) => [
    escapeCsv(e.id),
    escapeCsv(e.type),
    new Date(e.ts).toISOString(),
    escapeCsv(JSON.stringify(e.payload || {})),
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'analytics-events.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function queryEvents({ types, from, to } = {}) {
  const list = loadEvents()
  return list.filter((e) => {
    if (types && types.length && !types.includes(e.type)) return false
    if (typeof from === 'number' && e.ts < from) return false
    if (typeof to === 'number' && e.ts > to) return false
    return true
  })
}

export function summarize(events) {
  const byType = {}
  for (const e of events) byType[e.type] = (byType[e.type] || 0) + 1
  return byType
}

export function bucketize(events, granularity = 'day') {
  // granularity: 'hour' | 'day' | 'week' | 'month'
  const buckets = new Map()
  for (const e of events) {
    const d = new Date(e.ts)
    let tsFloor
    if (granularity === 'hour') {
      tsFloor = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours())
    } else if (granularity === 'week') {
      const iso = isoWeekStartUTC(d)
      tsFloor = iso.getTime()
    } else if (granularity === 'month') {
      tsFloor = Date.UTC(d.getFullYear(), d.getMonth(), 1)
    } else {
      tsFloor = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
    }
    const prev = buckets.get(tsFloor) || 0
    buckets.set(tsFloor, prev + 1)
  }
  const rows = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([ts, count]) => ({ label: formatBucketLabel(ts, granularity), count }))
  return rows
}

function isoWeekStartUTC(dLocal) {
  const d = new Date(Date.UTC(dLocal.getFullYear(), dLocal.getMonth(), dLocal.getDate()))
  const dayNum = d.getUTCDay() || 7
  if (dayNum !== 1) d.setUTCDate(d.getUTCDate() - (dayNum - 1))
  return d
}

function formatBucketLabel(tsUTC, granularity) {
  const d = new Date(tsUTC)
  const y = d.getUTCFullYear()
  const m = pad(d.getUTCMonth() + 1)
  const day = pad(d.getUTCDate())
  if (granularity === 'hour') {
    const h = pad(d.getUTCHours())
    return `${y}-${m}-${day} ${h}:00`
  }
  if (granularity === 'month') return `${y}-${m}`
  if (granularity === 'week') return weekKey(new Date(tsUTC))
  return `${y}-${m}-${day}`
}

function weekKey(d) {
  // ISO week-year-week-number
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${pad(weekNo)}`
}

function pad(n) { return String(n).padStart(2, '0') }
function randomId() { return Math.random().toString(36).slice(2, 10) }
function escapeCsv(value) {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"'
  return str
}
