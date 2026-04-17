import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../src/db/supabase.js';

/**
 * API /api/stories — lista histórias com filtros
 * 
 * GET /api/stories
 * Query params:
 *   - cycle: conflito | economico | politico | ...
 *   - region: nome da região
 *   - bias: esquerda | centro | direita
 *   - sentiment: positivo | negativo | neutro
 *   - limit: número (default 50)
 *   - offset: número (default 0)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { 
    cycle, 
    region, 
    bias, 
    sentiment,
    limit = '50', 
    offset = '0',
    search,
  } = req.query;
  
  let query = supabase
    .from('v_story_indicators')
    .select('*')
    .eq('archived', false)
    .order('updated_at', { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);
  
  if (cycle) {
    query = query.eq('cycle', cycle);
  }
  
  if (bias) {
    // Filtro simplificado por faixa de bias_score
    const biasMap: Record<string, { min: number; max: number }> = {
      'esquerda': { min: -1, max: -0.5 },
      'centro-esquerda': { min: -0.5, max: -0.1 },
      'centro': { min: -0.1, max: 0.1 },
      'centro-direita': { min: 0.1, max: 0.5 },
      'direita': { min: 0.5, max: 1 },
    };
    
    const range = biasMap[bias as string];
    if (range) {
      query = query.gte('avg_bias', range.min).lte('avg_bias', range.max);
    }
  }
  
  if (search) {
    query = query.ilike('main_subject', `%${search}%`);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(200).json({
    stories: data || [],
    pagination: {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      total: data?.length || 0,
    },
  });
}