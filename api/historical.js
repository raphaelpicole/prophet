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

  const { cycle, limit = '10', significance_gte } = req.query;

  try {
    let params = `select=*&order=significance.desc,event_date.desc&limit=${limit}`;
    if (cycle) params += `&cycle_type=eq.${cycle}`;
    if (significance_gte) params += `&significance=gte.${significance_gte}`;

    const r = await fetch(`${SUPABASE_URL}/rest/v1/historical_events?${params}`, { headers });
    const events = await r.json();

    // Also fetch cycle patterns if cycle is specified
    let patterns = [];
    if (cycle) {
      const pRes = await fetch(
        `${SUPABASE_URL}/rest/v1/cycle_patterns?cycle_type=eq.${cycle}&select=*&order=historical_count.desc`,
        { headers }
      );
      patterns = await pRes.json();
    }

    return res.status(200).json({ events, patterns });
  } catch (e) {
    await logError('error', 'api-historical', e.message, { endpoint: 'historical' });
    return res.status(500).json({ error: e.message });
  }
}