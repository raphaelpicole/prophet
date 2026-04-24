import { type RawArticle } from './rss.js';
/**
 * AP News — Associated Press
 * https://apnews.com
 */
export declare const AP_SOURCE_ID = "ap";
export declare const AP_NAME = "AP News";
export declare const AP_RSS_URL = "https://apnews.com/rss";
export declare function parseAPFeed(xml: string): RawArticle[];
export declare function fetchAP(): Promise<RawArticle[]>;
/**
 * Al Jazeera English
 * https://www.aljazeera.com
 */
export declare const ALJAZEERA_SOURCE_ID = "aljazeera";
export declare const ALJAZEERA_NAME = "Al Jazeera";
export declare const ALJAZEERA_RSS_URL = "https://www.aljazeera.com/xml/rss/all.xml";
export declare function parseAlJazeeraFeed(xml: string): RawArticle[];
export declare function fetchAlJazeera(): Promise<RawArticle[]>;
/**
 * France 24 English
 * https://www.france24.com
 */
export declare const FRANCE24_SOURCE_ID = "france24";
export declare const FRANCE24_NAME = "France 24";
export declare const FRANCE24_RSS_URL = "https://www.france24.com/en/rss";
export declare function parseFrance24Feed(xml: string): RawArticle[];
export declare function fetchFrance24(): Promise<RawArticle[]>;
/**
 * DW English — Deutsche Welle
 * https://www.dw.com
 */
export declare const DW_SOURCE_ID = "dw";
export declare const DW_NAME = "DW English";
export declare const DW_RSS_URL = "https://rss.dw.com/rss/rss-en";
export declare function parseDWFeed(xml: string): RawArticle[];
export declare function fetchDW(): Promise<RawArticle[]>;
/**
 * RTÉ News — Ireland (Portuguese-language context)
 * https://www.rte.ie/news
 */
export declare const RTE_SOURCE_ID = "rte";
export declare const RTE_NAME = "RT\u00C9 News";
export declare const RTE_RSS_URL = "https://www.rte.ie/news/rss/news-headlines.xml";
export declare function parseRTEFeed(xml: string): RawArticle[];
export declare function fetchRTE(): Promise<RawArticle[]>;
/**
 * NBC News — US
 */
export declare const NBC_SOURCE_ID = "nbc";
export declare const NBC_NAME = "NBC News";
export declare const NBC_RSS_URL = "https://rsshub.app/rssfeeder/nbcnews";
export declare function parseNBCFeed(xml: string): RawArticle[];
export declare function fetchNBC(): Promise<RawArticle[]>;
