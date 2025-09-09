export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const revOnly = url.searchParams.get('revOnly') === '1' || url.searchParams.get('onlyRev') === '1'
  const KV = env.CONTENT_KV || env.KV || env.AR_CONTENT
  const KEY = 'ar_site_content_v1'
  const REV = 'ar_content_rev'
  let rev = 0
  let content = null
  if (KV) {
    try {
      const [c, r] = await Promise.all([
        revOnly ? null : KV.get(KEY, { type: 'json' }),
        KV.get(REV)
      ])
      content = c
      rev = Number(r || 0)
    } catch {}
  }
  // Fallback: if KV is not bound, just return 0 rev to indicate no remote authority
  if (revOnly) {
    return new Response(JSON.stringify({ rev }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
  }
  return new Response(JSON.stringify({ rev, content }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
}

export async function onRequestPut({ request, env }) {
  const KV = env.CONTENT_KV || env.KV || env.AR_CONTENT
  if (!KV) {
    return new Response(JSON.stringify({ ok: false, error: 'KV not bound' }), { status: 501, headers: { 'content-type': 'application/json' } })
  }
  let payload
  try {
    payload = await request.json()
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid json' }), { status: 400, headers: { 'content-type': 'application/json' } })
  }
  const REV = 'ar_content_rev'
  const KEY = 'ar_site_content_v1'
  const rev = Date.now()
  await Promise.all([
    KV.put(KEY, JSON.stringify(payload)),
    KV.put(REV, String(rev))
  ])
  return new Response(JSON.stringify({ ok: true, rev }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
}
