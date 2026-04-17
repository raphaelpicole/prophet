const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Diagnostic endpoint
  const diagnostic = {
    url: url ? `${url.slice(0,30)}...` : 'MISSING',
    key: key ? `${key.slice(0,10)}... (len=${key.length})` : 'MISSING',
    nodeVersion: process.version,
    vercelEnv: process.env.VERCEL_ENV,
  };

  if (!url || !key) {
    return res.status(500).json({ error: 'missing env', ...diagnostic });
  }

  try {
    const fetchUrl = `${url}/rest/v1/stories?select=id&limit=1`;
    const r = await fetch(fetchUrl, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      }
    });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return res.status(r.status).json({ 
      ok: r.ok, 
      status: r.status,
      diagnostic,
      response: data 
    });
  } catch(e) {
    return res.status(500).json({ error: e.message, name: e.name, diagnostic });
  }
}
