const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
};

/**
 * GET /api/health — health check for all Prophet services
 * Returns status of Supabase and Ollama
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
    timestamp: new Date().toISOString(),
  };

  // Test Supabase
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=id&limit=1`, {
      headers,
    });
    results.supabase = r.ok;
  } catch (_) {
    results.supabase = false;
  }

  // Test Ollama (cloud health endpoint)
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
