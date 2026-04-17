export interface RawArticle {
    title: string;
    url: string;
    content?: string;
    published_at?: string;
    source_id: string;
}
/**
 * Parseia feed RSS e retorna lista de artigos.
 * Versão pura — não faz fetch, recebe o XML como parâmetro.
 * Isso facilita testes unitários (sem network).
 */
export declare function parseRSS(xml: string, sourceId: string): RawArticle[];
/**
 * Faz fetch do feed RSS e parseia.
 * Versão com network — usar em produção/dev.
 */
export declare function fetchAndParseRSS(feedUrl: string, sourceId: string): Promise<RawArticle[]>;
