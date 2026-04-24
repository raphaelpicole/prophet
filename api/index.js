import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple RSS parser
function parseRSS(xml, sourceId) {
  const items = xml.matchAll(/<item[\s\S]*?<\/item>/g);
  const articles = [];
  for (const item of items) {
    const raw = item[0];
    const title = raw.match(/<title>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/title>/)?.[1]
      ?? raw.match(/<title>(.*?)<\/title>/)?.[1]?.trim() ?? '';
    const link = raw.match(/<link>(.*?)<\/link>/)?.[1]?.trim() ?? '';
    const pubDate = raw.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
    if (title && link) {
      let published_at;
      if (pubDate) {
        const date = new Date(pubDate);
        if (!isNaN(date.getTime())) published_at = date.toISOString();
      }
      articles.push({ title: title.replace(/&amp;/g, '&'), url: link, source_id: sourceId, published_at });
    }
  }
  return articles;
}

async function fetchRSS(url, sourceId) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'ProphetBot/0.1' } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, sourceId);
  } catch (e) {
    console.error(`RSS error ${sourceId}:`, e.message);
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = req.url.split('?')[0];

  try {
    if (path === '/api/sources' || path === '/api/sources/') {
      const { data, error } = await supabase.from('sources').select('*').eq('active', true);
      if (error) throw error;
      return res.status(200).json({ sources: data || [] });
    }

    if (path === '/api/stories' || path === '/api/stories/') {
      const { limit = '50', offset = '0' } = req.query;
      const { data, error } = await supabase
        .from('v_story_indicators')
        .select('*')
        .eq('archived', false)
        .order('updated_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      if (error) throw error;
      return res.status(200).json({ stories: data || [], pagination: { limit: parseInt(limit), offset: parseInt(offset) } });
    }

    if (path === '/api/story' || path === '/api/story/') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const { data, error } = await supabase.from('stories').select('*').eq('id', id).single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (path === '/api/indicators' || path === '/api/indicators/') {
      const today = new Date().toISOString().split('T')[0];
      const { data: stories } = await supabase.from('stories').select('*').gte('updated_at', today + 'T00:00:00').eq('archived', false);
      const { data: articles } = await supabase.from('raw_articles').select('*').gte('published_at', today + 'T00:00:00');
      return res.status(200).json({
        stories_today: stories?.length || 0,
        articles_today: articles?.length || 0,
        predictions: 0,
        hot_stories: (stories || []).filter(s => (s.article_count || 0) >= 2).slice(0, 5),
      });
    }

    if (path === '/api/collect' || path === '/api/collect/' || path === '/api/cron/collect') {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Coleta do banco de fontes
      const { data: dbSources, error: dbError } = await supabase.from('sources').select('*').eq('active', true);
      if (dbError) throw dbError;

      const log = [];
      let totalCollected = 0;

      for (const src of (dbSources || [])) {
        if (!src.rss_url) {
          log.push(`${src.slug}: sem RSS URL`);
          continue;
        }
        const articles = await fetchRSS(src.rss_url, src.slug);
        totalCollected += articles.length;
        log.push(`${src.slug}: ${articles.length} artigos`);

        if (articles.length > 0) {
          for (const article of articles) {
            await supabase.from('raw_articles').upsert({
              source_id: article.source_id,
              title: article.title,
              url: article.url,
              published_at: article.published_at,
              status: 'pending',
            }, { onConflict: 'url' });
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Coleta concluída',
        total: totalCollected,
        log,
      });
    }

    return res.status(404).json({ error: 'Not found', path });
  } catch (err) {
    console.error('API Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
