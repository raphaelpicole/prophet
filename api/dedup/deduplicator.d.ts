export interface ArticleInput {
    title: string;
    url: string;
    content?: string;
    source_id?: string;
    published_at?: string;
}
export interface DeduplicationResult {
    isDuplicate: boolean;
    reason: 'url' | 'hash' | 'title_similarity' | 'new';
    existingId?: string;
}
/**
 * Deduplicação em 3 camadas (versão sem DB — para testes locais).
 *
 * Camada 1: URL exata — mesma URL = mesma notícia
 * Camada 2: SHA-256 do conteúdo — mesmo texto, URLs diferentes
 * Camada 3: Similaridade de título — comparação simples (levenshtein-like)
 */
export declare function checkDuplicate(article: ArticleInput, existingArticles: {
    url: string;
    content_hash: string;
    title: string;
    id: string;
}[]): DeduplicationResult;
/**
 * Processa batch de artigos contra base existente.
 * Retorna separado: novas vs duplicadas.
 */
export declare function deduplicateBatch(articles: ArticleInput[], existingArticles: {
    url: string;
    content_hash: string;
    title: string;
    id: string;
}[]): {
    newArticles: (ArticleInput & {
        content_hash: string;
    })[];
    duplicates: {
        article: ArticleInput;
        reason: string;
        existingId: string;
    }[];
};
export declare function contentHash(text: string): string;
/**
 * Deduplica artigos contra os existentes no banco de dados.
 * Busca todos os artigos recentes (últimas 24h) para comparar.
 */
export declare function deduplicate(articles: ArticleInput[]): Promise<{
    newArticles: (ArticleInput & {
        content_hash: string;
    })[];
    duplicates: {
        article: ArticleInput;
        reason: string;
        existingId: string;
    }[];
}>;
