import React from 'react'
import { loadGoogleMaps } from '../lib/googleMaps'

function getMapsConfig() {
  try {
    const raw = localStorage.getItem('ar_site_content_v1')
    const parsed = raw ? JSON.parse(raw) : {}
    const maps = parsed?.maps || {}
    return {
      apiKey: maps.apiKey || '',
      defaultZoom: Number.isFinite(parseInt(maps.defaultZoom, 10)) ? parseInt(maps.defaultZoom, 10) : 14,
    }
  } catch {
    return { apiKey: '', defaultZoom: 14 }
  }
}

export default function GoogleMap({ query, zoom, className, style }) {
  const containerRef = React.useRef(null)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let mounted = true
    const { apiKey, defaultZoom } = getMapsConfig()
    if (!apiKey) {
      setError('Google Maps API-nyckel saknas. Ange den i Admin → Google Maps.')
      return
    }
    loadGoogleMaps()
      .then((maps) => {
        if (!mounted || !containerRef.current) return
        const map = new maps.Map(containerRef.current, {
          center: { lat: 59.3293, lng: 18.0686 }, // Stockholm fallback
          zoom: zoom ?? defaultZoom,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        })
        if (query && typeof query === 'string' && query.trim()) {
          const geocoder = new maps.Geocoder()
          geocoder.geocode({ address: query }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              map.setCenter(results[0].geometry.location)
              new maps.Marker({ map, position: results[0].geometry.location })
            }
          })
        }
      })
      .catch((e) => {
        if (!mounted) return
        setError(e?.message || 'Kunde inte ladda Google Maps')
      })
    return () => { mounted = false }
  }, [query, zoom])

  return (
    <div className={className} style={style}>
      {error ? (
        <div className="text-xs text-red-600 p-2">{error}</div>
      ) : (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  )
}
