// Consolidated data API - predictions + logs combined to reduce function count
// Vercel Hobby plan limit: 12 serverless functions

const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function log(level, source, message, context) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
      method: 'POST',
      headers: { ...headers },
      body: JSON.stringify({ level, source, message, context }),
    });
  } catch (_) {}
}

// GET /api/predictions → list predictions with stats
// GET /api/logs → list system logs

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = req.url?.split('?')[0] || '';

  try {
    if (path === '/api/predictions') {
      const { cycle, status } = req.query;
      let params = 'select=*&order=created_at.desc';
      if (cycle) params += `&cycle=eq.${cycle}`;
      
      const r = await fetch(`${SUPABASE_URL}/rest/v1/predictions?${params}`, { headers });
      let predictions = await r.json();
      
      if (status === 'pending') predictions = predictions.filter(p => p.outcome === null);
      else if (status === 'resolved') predictions = predictions.filter(p => p.outcome !== null);
      
      const total = predictions.length;
      const correct = predictions.filter(p => p.outcome === true).length;
      const resolved = predictions.filter(p => p.outcome !== null).length;
      const accuracy = resolved > 0 ? Math.round(correct / resolved * 100) : 0;
      const brier = predictions.filter(p => p.brier_score !== null)
        .reduce((s, p) => s + p.brier_score, 0) / (predictions.filter(p => p.brier_score !== null).length || 1);
      
      return res.status(200).json({
        predictions,
        stats: { total, correct, accuracy, brierScore: Math.round(brier * 100) / 100, resolved }
      });
    }

    if (path === '/api/logs') {
      const { level, limit } = req.query;
      let params = 'order=created_at.desc&limit=' + (parseInt(limit) || 50);
      if (level) params += `&level=eq.${level}`;
      
      const r = await fetch(`${SUPABASE_URL}/rest/v1/logs?${params}`, { headers });
      const logs = await r.json();
      return res.status(200).json({ logs });
    }

    return res.status(404).json({ error: 'Not found', path });
  } catch (e) {
    await log('error', 'api-data', e.message, { path });
    return res.status(500).json({ error: e.message });
  }
}