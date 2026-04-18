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

  try {
    // Tenta view v_source_stats (stats reais); se não existir, fallback p/ sources simples
    let data = [];
    let usingStatsView = false;

    const viewRes = await fetch(`${SUPABASE_URL}/rest/v1/v_source_stats?select=*&order=total_articles.desc`, { headers });
    if (viewRes.ok) {
      data = await viewRes.json();
      usingStatsView = Array.isArray(data);
    }

    if (!usingStatsView) {
      // Fallback: só fontes básicas
      const srcRes = await fetch(`${SUPABASE_URL}/rest/v1/sources?select=id,slug,name,ideology,active,last_fetched_at,fetch_error_count&active=eq.true&order=name`, { headers });
      const srcs = await srcRes.json();
      data = (Array.isArray(srcs) ? srcs : []).map(s => ({
        ...s,
        totalArticles: 0,
        articles24h: 0,
        analyzedCount: 0,
        failedCount: 0,
      }));
    } else {
      // Mapeia campos da view pro formato da API
      data = data.map(s => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        ideology: s.ideology,
        active: s.active,
        totalArticles: s.total_articles ?? 0,
        articles24h: s.articles_24h ?? 0,
        analyzedCount: s.analyzed_count ?? 0,
        failedCount: s.failed_count ?? 0,
        lastFetchedAt: s.last_fetched_at,
      }));
    }

    return res.status(200).json({ sources: data });
  } catch (e) { await logError("error", "api-sources", e.message, {endpoint: "sources"}); 
    return res.status(500).json({ error: e.message });
  }
}
