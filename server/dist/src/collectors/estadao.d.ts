import { type RawArticle } from './rss.js';
/**
 * Estadão — RSS Feed
 * https://www.estadao.com.br
 */
export declare const ESTADAO_SOURCE_ID = "estadao";
export declare const ESTADAO_NAME = "Estad\u00E3o";
export declare const ESTADAO_RSS_URL = "https://www.estadao.com.br/ultimas/rss";
export declare function parseEstadaoFeed(xml: string): RawArticle[];
export declare function fetchEstadao(): Promise<RawArticle[]>;
