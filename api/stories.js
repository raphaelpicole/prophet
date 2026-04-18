const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function logError(level, source, message, context) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ level, source, message, context }),
    });
  } catch (_) {}
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { cycle, region, bias, sentiment, limit = '50', offset = '0', search } = req.query;

  let params = `select=*&archived=eq.false&order=updated_at.desc&limit=${limit}&offset=${offset}`;
  if (cycle) params += `&cycle=eq.${cycle}`;
  if (region) params += `&region=eq.${region}`;
  if (search) params += `&main_subject=ilike.*${search}*`;

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/stories?${params}`, { headers });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.message });
    return res.status(200).json({ stories: data, pagination: { limit: parseInt(limit), offset: parseInt(offset) } });
  } catch (e) {
    await logError('error', 'api-stories', e.message, { query: req.query });
    return res.status(500).json({ error: e.message });
  }
}