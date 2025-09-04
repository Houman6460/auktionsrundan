// Local storage backed newsletter subscribers store and CSV export
const SUBSCRIBERS_KEY = 'ar_newsletter_subscribers_v1'

export function loadSubscribers() {
  try {
    const raw = localStorage.getItem(SUBSCRIBERS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function saveSubscribers(list) {
  localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(Array.isArray(list) ? list : []))
}

export function addSubscriber(entry) {
  const list = loadSubscribers()
  const normalized = {
    name: (entry?.name || '').trim(),
    email: (entry?.email || '').trim(),
    tel: (entry?.tel || '').trim(),
    ts: Date.now(),
  }
  list.push(normalized)
  saveSubscribers(list)
  return normalized
}

export function exportCsv() {
  const list = loadSubscribers()
  const headers = ['name','email','tel','timestamp']
  const rows = list.map(s => [
    escapeCsv(s.name || ''),
    escapeCsv(s.email || ''),
    escapeCsv(s.tel || ''),
    new Date(s.ts || 0).toISOString()
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'newsletter-subscribers.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function escapeCsv(value) {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}
