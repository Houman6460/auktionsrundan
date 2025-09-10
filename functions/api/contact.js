export async function onRequestPost(context) {
  try {
    const { request, env } = context
    const ip = request.headers.get('CF-Connecting-IP') || ''
    const ua = request.headers.get('User-Agent') || ''
    const referer = request.headers.get('Referer') || ''

    if (!request.headers.get('content-type')?.includes('application/json')) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_content_type' }), { status: 400, headers: { 'content-type': 'application/json' } })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), { status: 400, headers: { 'content-type': 'application/json' } })
    }

    const name = (body.name || '').toString().trim()
    const email = (body.email || '').toString().trim()
    const message = (body.message || '').toString().trim()
    const lang = (body.lang || '').toString().trim().slice(0, 5)
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), { status: 400, headers: { 'content-type': 'application/json' } })
    }
    if (!/.+@.+\..+/.test(email)) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_email' }), { status: 400, headers: { 'content-type': 'application/json' } })
    }

    const id = `contact:${Date.now()}:${Math.random().toString(36).slice(2,10)}`
    const record = {
      id,
      name,
      email,
      message,
      lang,
      ip,
      ua,
      referer,
      ts: Date.now(),
    }

    // Store in KV if available (bind a KV namespace named CONTACTS in Cloudflare project settings)
    try {
      if (env && env.CONTACTS && typeof env.CONTACTS.put === 'function') {
        await env.CONTACTS.put(id, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 180 }) // 180 days
      }
    } catch (e) {
      // best effort; do not fail request
    }

    // Optional webhook (e.g., Slack) if configured
    try {
      const url = env?.CONTACT_WEBHOOK || env?.WEBHOOK_URL || ''
      if (url) {
        await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'contact', record }),
        })
      }
    } catch (e) {
      // ignore
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'server_error' }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}

export async function onRequestGet() {
  // Simple health endpoint
  return new Response(JSON.stringify({ ok: true, service: 'contact' }), { headers: { 'content-type': 'application/json' } })
}
