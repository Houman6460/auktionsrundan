// Simple ICS generator and downloader
// Usage: downloadIcs({ title, startIso, durationMinutes, description, location, filename })

function pad(n) { return String(n).padStart(2, '0') }

// Open Google Calendar event creation in a new tab
export function openGoogleCalendarEvent({ title, startIso, durationMinutes = 120, description = '', location = '' }) {
  try {
    if (!startIso) return
    const start = toIcsDate(startIso) // YYYYMMDDTHHMMSSZ
    const endMs = new Date(startIso).getTime() + (durationMinutes * 60000)
    const end = toIcsDate(new Date(endMs).toISOString())
    const params = new URLSearchParams()
    params.set('action', 'TEMPLATE')
    params.set('text', String(title || 'Event'))
    params.set('dates', `${start}/${end}`)
    if (description) params.set('details', String(description))
    if (location) params.set('location', String(location))
    params.set('sf', 'true')
    params.set('output', 'xml')
    const url = `https://calendar.google.com/calendar/render?${params.toString()}`
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch {}
}

function toIcsDate(iso) {
  const d = new Date(iso)
  const yyyy = d.getUTCFullYear()
  const mm = pad(d.getUTCMonth() + 1)
  const dd = pad(d.getUTCDate())
  const hh = pad(d.getUTCHours())
  const mi = pad(d.getUTCMinutes())
  const ss = '00'
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`
}

export function generateIcs({ title, startIso, durationMinutes = 120, description = '', location = '' }) {
  if (!startIso) return ''
  const dtStart = toIcsDate(startIso)
  const endMs = new Date(startIso).getTime() + (durationMinutes * 60000)
  const dtEnd = toIcsDate(new Date(endMs).toISOString())
  const safe = (s) => String(s || '').replace(/\n/g, '\\n')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Auktionsrundan//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Math.random().toString(36).slice(2)}@auktionsrundan`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${safe(title)}`,
    `DESCRIPTION:${safe(description)}`,
    `LOCATION:${safe(location)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
  return ics
}

export function downloadIcs({ title, startIso, durationMinutes, description, location, filename }) {
  const ics = generateIcs({ title, startIso, durationMinutes, description, location })
  if (!ics) return
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'event.ics'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
