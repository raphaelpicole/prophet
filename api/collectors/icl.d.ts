import { type RawArticle } from './rss.js';
/**
 * ICL Notícias — Scraper (não tem RSS público fácil)
 * https://iclnoticias.com.br
 *
 * Padrão de URL: https://iclnoticias.com.br/[YYYY]/[MM]/[DD]/slug/
 * Estrutura: article com h1 título, time data, .entry-content conteúdo
 */
export declare const ICL_SOURCE_ID = "icl";
export declare const ICL_NAME = "ICL Not\u00EDcias";
export declare const ICL_URL = "https://iclnoticias.com.br";
/**
 * Extrai artigos da página principal do ICL.
 * Na prática, usaria Cheerio para parsear HTML.
 * Versão mockada para testes — simula resposta de scraping.
 */
export declare function parseICLHomepage(html: string): RawArticle[];
/**
 * Extrai conteúdo de uma notícia individual do ICL.
 */
export declare function parseICLArticle(html: string): {
    title: string;
    content: string;
    published_at?: string;
} | null;
