// Consolidated API handler - combines hello, regions, sources, historical into single function
// to reduce serverless function count for Vercel Hobby plan

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

// GET /api/hello → simple health check
// GET /api/regions → list regions with story counts
// GET /api/sources → list RSS sources
// GET /api/historical → historical predictions

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = req.url?.split('?')[0] || '';

  try {
    // Route based on path
    if (path === '/api/hello' || path === '/api/misc') {
      return res.status(200).json({ 
        status: 'ok', 
        service: 'prophet-api',
        timestamp: new Date().toISOString() 
      });
    }

    if (path === '/api/regions') {
      // Get stories grouped by region
      const r = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=region,cycle,count=eq.*&group=region,cycle`, { headers });
      const data = await r.json();
      const regions = ['BR', 'SAM', 'US', 'EU', 'CN', 'RU', 'ME', 'AF', 'AS', 'GLOBAL'];
      return res.status(200).json({ regions, data });
    }

    if (path === '/api/sources') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/sources?order=name.asc`, { headers });
      const sources = await r.json();
      return res.status(200).json({ sources });
    }

    if (path === '/api/historical') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/predictions?outcome=not.is.null&order=created_at.desc&limit=20`, { headers });
      const predictions = await r.json();
      return res.status(200).json({ predictions });
    }

    // Default: 404
    return res.status(404).json({ error: 'Not found', path });
  } catch (e) {
    await logError('error', 'api-misc', e.message, { path });
    return res.status(500).json({ error: e.message });
  }
}