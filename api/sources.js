const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // sources ativas com stats de raw_articles
    const q = `sources?select=id,slug,name,ideology,active,last_fetched_at,fetch_error_count&active=eq.true&order=name`;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.message });

    const sources = (data || []).map(s => ({
      ...s,
      totalArticles: 0,
      articles24h: 0,
    }));

    return res.status(200).json({ sources });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}