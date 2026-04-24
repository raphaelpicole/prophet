import { type RawArticle } from './rss.js';
/**
 * G1 — RSS Feed da Globo + HTML Scraper fallback
 * Fonte principal brasileira de notícias
 */
export declare const G1_SOURCE_ID = "g1";
export declare const G1_NAME = "G1";
export declare const G1_RSS_URL = "https://g1.globo.com/rss/g1/";
export declare const G1_URL = "https://g1.globo.com";
export declare function parseG1Feed(xml: string): RawArticle[];
export declare function fetchG1(): Promise<RawArticle[]>;
/**
 * Scraper alternativo para G1 — coleta da homepage
 * Útil se o RSS falhar ou para complementar
 */
export declare function fetchG1HTML(): Promise<RawArticle[]>;
