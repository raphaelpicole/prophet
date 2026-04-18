import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../src/db/supabase.js';

/**
 * GET /api/stories/[id]
 * Retorna detalhe de uma story com seus artigos
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Story ID required' });
  }

  // Busca story
  const { data: story, error: storyError } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single();

  if (storyError || !story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  // Busca artigos da story
  const { data: articles } = await supabase
    .from('story_articles')
    .select(`
      relevance,
      linked_at,
      article:raw_articles(
        id, title, url, source_id, published_at, collected_at,
        sources(name, slug, ideology)
      )
    `)
    .eq('story_id', id)
    .order('relevance', { ascending: false });

  // Busca análise agregada da story
  const { data: analysis } = await supabase
    .from('analysis')
    .select('bias_score, sentiment_score, political_bias, sentiment')
    .in('article_id', (articles || []).map((a: any) => a.article?.id).filter(Boolean));

  // Calcula média de viés e sentimento
  const avgBias = analysis?.length
    ? analysis.reduce((s: number, a: any) => s + (a.bias_score || 0), 0) / analysis.length
    : null;
  const avgSentiment = analysis?.length
    ? analysis.reduce((s: number, a: any) => s + (a.sentiment_score || 0), 0) / analysis.length
    : null;

  return res.status(200).json({
    ...story,
    articles: articles || [],
    analysis: {
      avgBias,
      avgSentiment,
      count: analysis?.length || 0,
    },
  });
}
