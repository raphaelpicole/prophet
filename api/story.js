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

  const id = req.query.id || req.url.split('/').pop();
  if (!id) return res.status(400).json({ error: 'id obrigatório' });

  try {
    // Story
    const sr = await fetch(`${SUPABASE_URL}/rest/v1/stories?id=eq.${id}&select=*&limit=1`, { headers });
    const storyData = await sr.json();
    if (!Array.isArray(storyData) || storyData.length === 0) return res.status(404).json({ error: 'não encontrado' });
    const story = storyData[0];

    // Articles via story_articles junction table → raw_articles
    const ja = await fetch(`${SUPABASE_URL}/rest/v1/story_articles?story_id=eq.${id}&select=article_id`, { headers });
    const junction = await ja.json();
    const articleIds = Array.isArray(junction) ? junction.map(j => j.article_id) : [];
    const articles = [];
    if (articleIds.length > 0) {
      const aid = await fetch(`${SUPABASE_URL}/rest/v1/raw_articles?id=in.(${articleIds.join(',')})&select=*&order=published_at.desc&limit=20`, { headers });
      const rawArts = await aid.json();
      articles = Array.isArray(rawArts) ? rawArts : [];
    }

    return res.status(200).json({ ...story, articles });
  } catch (e) {
    await logError('error', 'api-story', e.message, { endpoint: 'story' });
    return res.status(500).json({ error: e.message });
  }
}