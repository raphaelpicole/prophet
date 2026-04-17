const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'missing env', hasUrl: !!url, hasKey: !!key });
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('archived', false)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message, code: error.code });
  return res.json({ stories: data || [], count: data?.length || 0 });
};
