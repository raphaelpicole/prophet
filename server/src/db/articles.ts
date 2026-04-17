import { supabase } from './supabase.js';
import type { RawArticle } from '../collectors/rss.js';

/**
 * Repositório de Artigos — operações no banco
 */

export interface ArticleInput {
  source_id: string;
  title: string;
  url: string;
  content?: string;
  published_at?: string;
  content_hash: string;
}

export interface ArticleRecord extends ArticleInput {
  id: string;
  collected_at: string;
  status: 'pending' | 'analyzing' | 'analyzed' | 'failed';
}

/**
 * Insere artigo se não existir (URL única)
 */
export async function insertArticle(article: ArticleInput): Promise<{ data: ArticleRecord | null; error?: string }> {
  const { data, error } = await supabase
    .from('raw_articles')
    .upsert({
      source_id: article.source_id,
      title: article.title,
      url: article.url,
      content: article.content,
      published_at: article.published_at,
      content_hash: article.content_hash,
      status: 'pending',
    }, {
      onConflict: 'url',
      ignoreDuplicates: true,
    })
    .select()
    .single();
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  return { data };
}

/**
 * Busca artigos pendentes de análise
 */
export async function getPendingArticles(limit: number = 20): Promise<ArticleRecord[]> {
  const { data, error } = await supabase
    .from('raw_articles')
    .select('*')
    .eq('status', 'pending')
    .order('collected_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Erro ao buscar pendentes:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Atualiza status do artigo
 */
export async function updateArticleStatus(
  articleId: string,
  status: ArticleRecord['status'],
  updates?: Partial<ArticleRecord>
): Promise<void> {
  const { error } = await supabase
    .from('raw_articles')
    .update({ status, ...updates })
    .eq('id', articleId);
  
  if (error) {
    console.error('Erro ao atualizar status:', error);
  }
}

/**
 * Verifica se URL já existe
 */
export async function articleExists(url: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('raw_articles')
    .select('id')
    .eq('url', url)
    .maybeSingle();
  
  if (error) {
    console.error('Erro ao verificar URL:', error);
    return false;
  }
  
  return !!data;
}