// Cloudflare Pages Function for Ratings backed by D1
// Bindings required in Cloudflare Pages project:
// - D1 database binding name: DB (configure in Pages > Settings > Functions > D1 bindings)
//
// Tables (created on-demand):
// ratings(target TEXT PRIMARY KEY, total_votes INTEGER, total_score INTEGER, updated_at TEXT)
// votes(id INTEGER PRIMARY KEY AUTOINCREMENT, target TEXT, ip TEXT, ts INTEGER)

/** @typedef {import('@cloudflare/workers-types').Request} CFRequest */

async function ensureSchema(DB) {
  await DB.exec(`CREATE TABLE IF NOT EXISTS ratings (
    target TEXT PRIMARY KEY,
    total_votes INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );`)
  await DB.exec(`CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target TEXT NOT NULL,
    ip TEXT NOT NULL,
    ts INTEGER NOT NULL
  );`)
}

function jsonResponse(data, init = 200) {
  const status = typeof init === 'number' ? init : (init?.status || 200)
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function parseUrl(request) {
  const url = new URL(request.url)
  return { url, search: url.searchParams }
}

async function getAggregate(DB, target) {
  const res = await DB.prepare(`SELECT total_votes AS totalVotes, total_score AS totalScore, 
    CASE WHEN total_votes = 0 THEN 0 ELSE ROUND(CAST(total_score AS REAL)/total_votes, 2) END AS average
    FROM ratings WHERE target = ?`).bind(target).first()
  return res || { totalVotes: 0, totalScore: 0, average: 0 }
}

async function addVote(DB, target, score, ip) {
  const now = Date.now()
  // Simple per-IP cooldown for same target: 120s
  const recent = await DB.prepare(`SELECT 1 FROM votes WHERE target = ? AND ip = ? AND ts > ? LIMIT 1`)
    .bind(target, ip, now - 120000).first()
  if (recent) {
    return { ok: false, reason: 'cooldown' }
  }
  const existing = await DB.prepare(`SELECT total_votes AS totalVotes, total_score AS totalScore FROM ratings WHERE target = ?`)
    .bind(target).first()
  if (existing) {
    await DB.prepare(`UPDATE ratings SET total_votes = ?, total_score = ?, updated_at = ? WHERE target = ?`)
      .bind(existing.totalVotes + 1, existing.totalScore + score, new Date(now).toISOString(), target).run()
  } else {
    await DB.prepare(`INSERT INTO ratings(target, total_votes, total_score, updated_at) VALUES(?, ?, ?, ?)`)
      .bind(target, 1, score, new Date(now).toISOString()).run()
  }
  await DB.prepare(`INSERT INTO votes(target, ip, ts) VALUES(?, ?, ?)`).bind(target, ip, now).run()
  return { ok: true }
}

export async function onRequest(context) {
  const { request, env } = context
  const { DB } = env
  if (!DB) return jsonResponse({ error: 'D1 binding DB is missing' }, 500)
  await ensureSchema(DB)

  const { url, search } = parseUrl(request)
  const method = request.method.toUpperCase()

  try {
    if (method === 'GET') {
      const type = search.get('type')
      const id = search.get('id')
      if (!type || (type !== 'upcoming' && type !== 'item')) {
        return jsonResponse({ error: 'Invalid type' }, 400)
      }
      const target = type === 'upcoming' ? 'upcoming' : `item:${id || ''}`
      const data = await getAggregate(DB, target)
      return jsonResponse({ target, ...data })
    }

    if (method === 'POST') {
      const ct = request.headers.get('content-type') || ''
      if (!ct.includes('application/json')) return jsonResponse({ error: 'Expected JSON' }, 415)
      const body = await request.json()
      const type = body?.type
      const score = Number(body?.score)
      const id = body?.id
      if (!type || (type !== 'upcoming' && type !== 'item')) return jsonResponse({ error: 'Invalid type' }, 400)
      if (!Number.isFinite(score) || score < 1 || score > 5) return jsonResponse({ error: 'Invalid score' }, 400)
      const target = type === 'upcoming' ? 'upcoming' : `item:${id || ''}`
      const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0'
      const r = await addVote(DB, target, score, ip)
      if (!r.ok && r.reason === 'cooldown') {
        return jsonResponse({ error: 'Please wait before voting again.' }, 429)
      }
      const agg = await getAggregate(DB, target)
      return jsonResponse({ target, ...agg })
    }

    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (e) {
    return jsonResponse({ error: e?.message || 'Server error' }, 500)
  }
}
