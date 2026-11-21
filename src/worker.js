// Getaway in Hamina – pistetaulukon palvelin (Cloudflare Worker + D1)
// Pelin tiedostot tulevat public-kansiosta, /api/* hoidetaan täällä.

let ready = false;
async function init(db) {
  if (ready) return;
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, secs REAL NOT NULL, created INTEGER NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, started INTEGER NOT NULL, ip TEXT, used INTEGER NOT NULL DEFAULT 0)'),
    db.prepare('CREATE INDEX IF NOT EXISTS scores_secs ON scores (secs DESC)')
  ]);
  // Kulkuneuvokohtaiset taulukot: vanhat tulokset kuuluvat autolle
  try { await db.prepare("ALTER TABLE scores ADD COLUMN veh TEXT NOT NULL DEFAULT 'auto'").run(); } catch (e) { /* sarake on jo olemassa */ }
  ready = true;
}
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const TOP = 'SELECT name, MAX(secs) AS secs FROM scores WHERE veh = ? GROUP BY lower(name) ORDER BY secs DESC LIMIT 10';
const VEHS = ['auto', 'mopo'];
const vehOf = v => VEHS.includes(v) ? v : 'auto';
const BAD = /(vittu|perkele|saatana|helvetti|paska|huora|homo|neeke|fuck|shit|nigg|cunt)/i;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (!env.DB) return json({ error: 'tietokantaa (DB) ei ole liitetty' }, 500);
    try {
      await init(env.DB);
      const ip = request.headers.get('CF-Connecting-IP') || '';
      const now = Date.now();

      if (url.pathname === '/api/scores' && request.method === 'GET') {
        const { results } = await env.DB.prepare(TOP).bind(vehOf(url.searchParams.get('veh'))).all();
        return json({ top: results });
      }

      if (url.pathname === '/api/start' && request.method === 'POST') {
        // Rajoitus: enintään 30 aloitusta per IP tunnissa
        const c = await env.DB.prepare('SELECT COUNT(*) AS n FROM runs WHERE ip = ? AND started > ?').bind(ip, now - 3600e3).first();
        if (c && c.n > 30) return json({ error: 'liian monta yritystä, odota hetki' }, 429);
        const id = crypto.randomUUID();
        await env.DB.prepare('INSERT INTO runs (id, started, ip) VALUES (?, ?, ?)').bind(id, now, ip).run();
        if (Math.random() < 0.05) await env.DB.prepare('DELETE FROM runs WHERE started < ?').bind(now - 86400e3).run();
        return json({ run: id });
      }

      if (url.pathname === '/api/score' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const name = String(body.name || '').replace(/[^\p{L}\p{N} _.\-!?]/gu, '').trim().slice(0, 16);
        const secs = Number(body.secs), veh = vehOf(body.veh);
        if (!name) return json({ error: 'nimimerkki puuttuu' }, 400);
        if (BAD.test(name)) return json({ error: 'valitse toinen nimimerkki' }, 400);
        if (!Number.isFinite(secs) || secs < 5 || secs > 7200) return json({ error: 'virheellinen aika' }, 400);
        const rs = Math.floor(secs * 10) / 10;
        const run = await env.DB.prepare('SELECT started, used FROM runs WHERE id = ?').bind(String(body.run || '')).first();
        if (!run || run.used) return json({ error: 'jahti ei kelpaa (aloita uusi jahti)' }, 400);
        // Pakoaika ei voi olla pidempi kuin aloituksesta kulunut todellinen aika
        if (secs * 1000 > now - run.started + 3000) return json({ error: 'aika ei täsmää' }, 400);
        await env.DB.batch([
          env.DB.prepare('UPDATE runs SET used = 1 WHERE id = ?').bind(String(body.run)),
          env.DB.prepare('INSERT INTO scores (name, secs, created, veh) VALUES (?, ?, ?, ?)').bind(name, rs, now, veh)
        ]);
        const better = await env.DB.prepare('SELECT COUNT(*) AS n FROM (SELECT MAX(secs) AS s FROM scores WHERE veh = ? GROUP BY lower(name)) WHERE s > ?').bind(veh, rs).first();
        const { results } = await env.DB.prepare(TOP).bind(veh).all();
        return json({ rank: (better ? better.n : 0) + 1, top: results });
      }

      return json({ error: 'tuntematon osoite' }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  }
};
