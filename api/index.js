import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
      return res.status(200).json({ success: true, message: 'Collect endpoint - use npx tsx src/pipeline/worker.ts locally' });
    }

    return res.status(404).json({ error: 'Not found', path });
  } catch (err) {
    console.error('API Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
