import { type RawArticle } from './rss.js';
/**
 * UOL — RSS Feed
 * https://www.uol.com.br
 */
export declare const UOL_SOURCE_ID = "uol";
export declare const UOL_NAME = "UOL";
export declare const UOL_RSS_URL = "https://rss.uol.com.br/feed/noticias.xml";
export declare function parseUOLFeed(xml: string): RawArticle[];
export declare function fetchUOL(): Promise<RawArticle[]>;
