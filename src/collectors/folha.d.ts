import { type RawArticle } from './rss.js';
/**
 * Folha de S.Paulo — RSS Feed
 * https://www.folha.uol.com.br
 */
export declare const FOLHA_SOURCE_ID = "folha";
export declare const FOLHA_NAME = "Folha de S.Paulo";
export declare const FOLHA_RSS_URL = "https://feeds.folha.uol.com.br/emais/rss091.xml";
export declare function parseFolhaFeed(xml: string): RawArticle[];
export declare function fetchFolha(): Promise<RawArticle[]>;
