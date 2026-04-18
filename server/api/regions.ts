import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../src/db/supabase.js';

/**
 * GET /api/regions
 * Lista regiões hierárquicas
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .order('name');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Organiza em árvore (parent_id)
  const roots = (data || []).filter((r: any) => !r.parent_id);
  const children = (data || []).filter((r: any) => r.parent_id);

  const withChildren = roots.map((root: any) => ({
    ...root,
    children: children.filter((c: any) => c.parent_id === root.id),
  }));

  return res.status(200).json({ regions: data || [], tree: withChildren });
}
