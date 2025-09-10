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
    const toOverride = (body.to || '').toString().trim()
    const subjectOverride = (body.subject || '').toString().trim()
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

    // Attempt email via MailChannels if configured
    try {
      const toEmail = (toOverride || env?.CONTACT_TO || env?.MAIL_TO || '').toString().trim()
      const fromEmail = (env?.MAIL_FROM || '').toString().trim()
      const fromName = (env?.MAIL_FROM_NAME || 'Auktionsrundan').toString().trim()
      const subject = subjectOverride || env?.CONTACT_SUBJECT || 'New contact message'
      if (toEmail && fromEmail) {
        const text = `New contact message\n\nName: ${name}\nEmail: ${email}\nLanguage: ${lang}\nReferrer: ${referer}\nIP: ${ip}\nUA: ${ua}\nTime: ${new Date(record.ts).toISOString()}\n\nMessage:\n${message}`
        const html = `<!doctype html><html><body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.5;">`
          + `<h2 style="margin:0 0 12px;">New contact message</h2>`
          + `<p><strong>Name:</strong> ${escapeHtml(name)}<br/><strong>Email:</strong> ${escapeHtml(email)}<br/><strong>Language:</strong> ${escapeHtml(lang)}<br/>`
          + `<strong>Referrer:</strong> ${escapeHtml(referer)}<br/><strong>IP:</strong> ${escapeHtml(ip)}<br/><strong>UA:</strong> ${escapeHtml(ua)}<br/><strong>Time:</strong> ${new Date(record.ts).toLocaleString()}</p>`
          + `<hr/><p style="white-space:pre-wrap;">${escapeHtml(message)}</p>`
          + `</body></html>`
        const payload = {
          personalizations: [
            { to: [{ email: toEmail }] }
          ],
          from: { email: fromEmail, name: fromName },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html }
          ],
          headers: { 'Reply-To': email }
        }
        const mcRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload)
        })
        // Do not fail the request if email provider returns error; still return ok
        try { await mcRes.text() } catch {}
      }
    } catch (e) {
      // ignore send errors to not break UX
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

function escapeHtml(s) {
  try {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  } catch { return '' }
}
