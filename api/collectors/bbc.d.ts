import { type RawArticle } from './rss.js';
/**
 * BBC Brasil — RSS Feed
 * https://www.bbc.com/portuguese
 */
export declare const BBC_SOURCE_ID = "bbc";
export declare const BBC_NAME = "BBC Brasil";
export declare const BBC_RSS_URL = "https://feeds.bbci.co.uk/portuguese/rss.xml";
export declare function parseBBCFeed(xml: string): RawArticle[];
export declare function fetchBBC(): Promise<RawArticle[]>;
