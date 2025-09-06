import React from 'react'
import { trackRating } from '../services/analytics'

// RatingStars component
// Props:
// - targetType: 'upcoming' | 'item'
// - targetId?: string (required when targetType==='item')
// - className?: string
export default function RatingStars({ targetType, targetId, className }) {
  const [avg, setAvg] = React.useState(0)
  const [count, setCount] = React.useState(0)
  const [hover, setHover] = React.useState(0)
  const [pending, setPending] = React.useState(false)
  const [mine, setMine] = React.useState(0)
  const [msg, setMsg] = React.useState('')

  const key = targetType === 'upcoming' ? 'upcoming' : `item:${targetId || ''}`
  const lsKey = `ar_rating_${key}`

  const fetchRating = async () => {
    try {
      const params = new URLSearchParams()
      params.set('type', targetType === 'upcoming' ? 'upcoming' : 'item')
      if (targetType === 'item') params.set('id', targetId || '')
      const res = await fetch(`/api/ratings?${params.toString()}`, { headers: { 'accept': 'application/json' }})
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAvg(Number(data.average || 0))
      setCount(Number(data.totalVotes || 0))
    } catch {
      // If running locally without Functions, hint once
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        setMsg('Ratings API is unavailable in local dev. Deploy to Cloudflare Pages with D1 bound to use ratings.')
      }
    }
  }

  React.useEffect(() => {
    try {
      const mineStored = parseInt(localStorage.getItem(lsKey) || '0', 10)
      if (Number.isFinite(mineStored)) setMine(mineStored)
    } catch {}
    fetchRating()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const submit = async (score) => {
    if (pending) return
    setPending(true)
    setMsg('')
    try {
      const body = { type: targetType === 'upcoming' ? 'upcoming' : 'item', score }
      if (targetType === 'item') body.id = targetId || ''
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json().catch(()=>({}))
      if (res.status === 429) {
        setMsg('Please wait before voting again.')
      } else if (res.ok) {
        setAvg(Number(data.average || 0))
        setCount(Number(data.totalVotes || 0))
        setMine(score)
        try { localStorage.setItem(lsKey, String(score)) } catch {}
        try { trackRating({ itemId: key, value: score }) } catch {}
        setMsg('Thanks for rating!')
      } else {
        setMsg('Could not submit rating. If this is production, ensure Cloudflare D1 is configured.')
      }
    } catch {
      setMsg('Network error while submitting rating.')
    } finally {
      setPending(false)
    }
  }

  const stars = [1,2,3,4,5]
  const display = hover || mine || Math.round(avg)

  return (
    <div className={className}>
      <div className="inline-flex items-center gap-1 select-none">
        {stars.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            className={`text-xl ${display >= s ? 'text-amber-500' : 'text-neutral-300'} hover:text-amber-600 transition-colors`}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => submit(s)}
            aria-label={`rate ${s}`}
            title={`Rate ${s}`}
          >
            ★
          </button>
        ))}
        <span className="text-sm text-neutral-600 ml-2">{avg.toFixed(2)} ({count})</span>
      </div>
      {msg && (
        <div className="text-xs mt-1 ${pending ? 'text-neutral-500' : 'text-neutral-600'}">{msg}</div>
      )}
    </div>
  )
}
