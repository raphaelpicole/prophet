import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../src/db/supabase.js';
import { withSentry } from '../src/middleware/sentry.js';

/**
 * GET /api/sources
 * Lista fontes de notícias com stats
 */
export default withSentry(async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { data, error } = await supabase
    .from('v_source_stats')
    .select('*')
    .order('total_articles', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ sources: data || [] });
});
