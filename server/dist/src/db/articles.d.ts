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
export declare function insertArticle(article: ArticleInput): Promise<{
    data: ArticleRecord | null;
    error?: string;
}>;
/**
 * Busca artigos pendentes de análise
 */
export declare function getPendingArticles(limit?: number): Promise<ArticleRecord[]>;
/**
 * Atualiza status do artigo
 */
export declare function updateArticleStatus(articleId: string, status: ArticleRecord['status'], updates?: Partial<ArticleRecord>): Promise<void>;
/**
 * Verifica se URL já existe
 */
export declare function articleExists(url: string): Promise<boolean>;
