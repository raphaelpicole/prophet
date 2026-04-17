import type { RawArticle } from '../types.js';
/**
 * Web Scraper Collector — para fontes sem RSS.
 * Ponto forte: flexível com seletores CSS customizados por fonte.
 * Ponto fraco: quebra se o site muda o HTML. Usar como fallback do RSS.
 */
export declare function scrapeSite(baseUrl: string, sourceId: string, selectors: {
    article: string;
    title: string;
    link: string;
    date?: string;
}): Promise<RawArticle[]>;
