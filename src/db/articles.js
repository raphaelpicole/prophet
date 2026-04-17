import { supabase } from './supabase.js';
/**
 * Insere artigo se não existir (URL única)
 */
export async function insertArticle(article) {
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
export async function getPendingArticles(limit = 20) {
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
export async function updateArticleStatus(articleId, status, updates) {
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
export async function articleExists(url) {
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
