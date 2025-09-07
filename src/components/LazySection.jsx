import React from 'react'
import Loader from './Loader'

export default function LazySection({ children, minHeight = 300, rootMargin = '120px' }) {
  const [visible, setVisible] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          setVisible(true)
        }
      })
    }, { root: null, rootMargin, threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [visible, rootMargin])

  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : minHeight }}>
      {visible ? children : <Loader variant="page" label="Laddar…" />}
    </div>
  )
}
