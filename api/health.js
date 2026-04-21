const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
};

/**
 * GET /api/health — health check for all Prophet services
 * Returns status of Supabase, Ollama, and logs DB size
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const results = {
    supabase: false,
    ollama: false,
    db_stats: null,
    timestamp: new Date().toISOString(),
  };

  // Test Supabase
  try {
    const [storiesRes, articlesRes, logsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/stories?select=id`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/raw_articles?select=id`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/logs?select=id&limit=1`, { headers }),
    ]);
    results.supabase = storiesRes.ok && articlesRes.ok;
    if (results.supabase) {
      const [stories, articles, logs] = await Promise.all([
        storiesRes.json(),
        articlesRes.json(),
        logsRes.json(),
      ]);
      results.db_stats = {
        stories: Array.isArray(stories) ? stories.length : 0,
        articles: Array.isArray(articles) ? articles.length : 0,
        logs: Array.isArray(logs) ? logs.length : 0,
      };
      // Log daily health ping (only if we get real data)
      if (Array.isArray(logs)) {
        await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
          body: JSON.stringify({
            level: 'info',
            source: 'health',
            message: `Health check OK — stories:${results.db_stats.stories} articles:${results.db_stats.articles}`,
            context: JSON.stringify(results.db_stats),
          }),
        }).catch(() => {});
      }
    }
  } catch (_) {
    results.supabase = false;
  }

  // Test Ollama
  try {
    const ollamaRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OLLAMA_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemma-4-31b',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
    });
    results.ollama = ollamaRes.ok;
  } catch (_) {
    results.ollama = false;
  }

  const allHealthy = results.supabase && results.ollama;
  return res.status(allHealthy ? 200 : 503).json(results);
}
