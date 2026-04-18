const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // GET /api/logs → list recent errors
  if (req.method === 'GET' && action !== 'create') {
    try {
      const since = req.query.since || '24 hours';
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/logs?order=created_at.desc&limit=50&created_at=gte.${new Date(Date.now() - 86400000).toISOString()}`,
        { headers }
      );
      const data = await r.json();
      return res.status(200).json({ logs: data, count: data.length });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST /api/logs?action=create → log an error
  if (req.method === 'POST') {
    const { level = 'error', source, message, context } = req.body;
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({
          level,
          source,
          message,
          context,
          resolved: false,
        }),
      });
      const result = await r.json();
      return res.status(201).json({ logged: result });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'invalid request' });
}