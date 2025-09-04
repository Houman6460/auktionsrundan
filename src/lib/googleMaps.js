// Lightweight Google Maps JS API loader (singleton)
let loaderPromise = null

function getApiKeyAndLang() {
  try {
    const raw = localStorage.getItem('ar_site_content_v1')
    if (!raw) return { key: '', language: 'sv' }
    const parsed = JSON.parse(raw)
    const maps = parsed?.maps || {}
    return { key: maps.apiKey || '', language: maps.language === 'en' ? 'en' : 'sv' }
  } catch {
    return { key: '', language: 'sv' }
  }
}

export function loadGoogleMaps() {
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return Promise.resolve(window.google.maps)
  }
  if (loaderPromise) return loaderPromise

  loaderPromise = new Promise((resolve, reject) => {
    const { key, language } = getApiKeyAndLang()
    if (!key) {
      reject(new Error('Google Maps API key is missing in Admin > Google Maps'))
      return
    }
    const script = document.createElement('script')
    const params = new URLSearchParams({
      key,
      libraries: 'places',
      v: 'weekly',
      language
    })
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error('Failed to load Google Maps script'))
    script.onload = () => {
      if (window.google && window.google.maps) resolve(window.google.maps)
      else reject(new Error('Google Maps did not initialize'))
    }
    document.head.appendChild(script)
  })

  return loaderPromise
}
