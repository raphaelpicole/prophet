import { type RawArticle } from './rss.js';
/**
 * Metrópoles — Scraper
 * https://www.metropoles.com
 *
 * Site de notícias de Brasília com cobertura política e cultural.
 * Não tem RSS oficial fácil — scraping necessário.
 *
 * Estrutura esperada:
 * - Cards: article.post-card ou .card-news
 * - Título: h3.title ou h2
 * - Link: a dentro do card
 * - Data: time ou .date
 */
export declare const METROPOLES_SOURCE_ID = "metropoles";
export declare const METROPOLES_NAME = "Metr\u00F3poles";
export declare const METROPOLES_URL = "https://www.metropoles.com";
/**
 * Extrai artigos da homepage do Metrópoles.
 *
 * Na implementação real, usar Cheerio com seletores CSS.
 * Esta versão é preparada para mock/testes.
 */
export declare function parseMetropolesHomepage(html: string): RawArticle[];
/**
 * Extrai conteúdo de uma notícia individual.
 */
export declare function parseMetropolesArticle(html: string): {
    title: string;
    content: string;
    author?: string;
    published_at?: string;
} | null;
