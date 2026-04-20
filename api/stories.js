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

  const { cycle, region, bias, sentiment, limit = '20', offset = '0', search } = req.query;

  let params = `select=*&archived=eq.false&order=updated_at.desc&limit=${limit}&offset=${offset}`;
  if (cycle) params += `&cycle=eq.${cycle}`;
  if (region) {
    // Treat SAM (South America) as inclusive of BR (Brazil)
    if (region === 'SAM') {
      params += `&(region=eq.SAM,region=eq.BR)`;
    } else {
      params += `&region=eq.${region}`;
    }
  }
  if (search) params += `&main_subject=ilike.*${search}*`;

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/stories?${params}`, { headers });
    const stories = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: stories.message });

    // Batch fetch preview articles for all returned stories (max 3 per story)
    const storyIds = Array.isArray(stories) ? stories.map(s => s.id) : [];
    if (storyIds.length > 0) {
      // Get article_ids from junction table
      const saRes = await fetch(
        `${SUPABASE_URL}/rest/v1/story_articles?story_id=in.(${storyIds.join(',')})&select=story_id,article_id&order=article_id.desc`,
        { headers }
      );
      const saData = await saRes.json();
      if (Array.isArray(saData) && saData.length > 0) {
        // Group by story, take first 3 article_ids per story
        const byStory = {};
        for (const row of saData) {
          if (!byStory[row.story_id]) byStory[row.story_id] = [];
          if (byStory[row.story_id].length < 3) byStory[row.story_id].push(row.article_id);
        }
        const allArticleIds = [...new Set(saData.map(r => r.article_id))];
        // Fetch article details
        const idsFilter = allArticleIds.map(id => `id=eq.${id}`).join('&');
        const artsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/raw_articles?${idsFilter}&select=id,title,url,source_id,published_at,summary&order=published_at.desc`,
          { headers }
        );
        const articles = await artsRes.json();
        const artsById = Array.isArray(articles)
          ? Object.fromEntries(articles.map(a => [a.id, a]))
          : {};
        // Attach preview_articles to each story
        for (const story of stories) {
          const ids = byStory[story.id] || [];
          story.preview_articles = ids.map(id => artsById[id]).filter(Boolean);
        }
      }
    }

    return res.status(200).json({
      stories,
      pagination: { limit: parseInt(limit), offset: parseInt(offset) },
    });
  } catch (e) {
    await logError('error', 'api-stories', e.message, { query: req.query });
    return res.status(500).json({ error: e.message });
  }
}