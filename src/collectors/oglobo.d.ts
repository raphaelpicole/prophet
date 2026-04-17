import { type RawArticle } from './rss.js';
/**
 * O Globo — RSS Feed
 * https://oglobo.globo.com
 */
export declare const OGLOBO_SOURCE_ID = "oglobo";
export declare const OGLOBO_NAME = "O Globo";
export declare const OGLOBO_RSS_URL = "https://oglobo.globo.com/rss.xml";
export declare function parseOGloboFeed(xml: string): RawArticle[];
export declare function fetchOGlobo(): Promise<RawArticle[]>;
