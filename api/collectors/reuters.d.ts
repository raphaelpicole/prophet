import { type RawArticle } from './rss.js';
/**
 * Reuters — RSS Feed
 * https://www.reuters.com
 */
export declare const REUTERS_SOURCE_ID = "reuters";
export declare const REUTERS_NAME = "Reuters";
export declare const REUTERS_RSS_URL = "https://www.reutersagency.com/feed/?taxonomy=markets&post_type=reuters-best";
export declare function parseReutersFeed(xml: string): RawArticle[];
export declare function fetchReuters(): Promise<RawArticle[]>;
