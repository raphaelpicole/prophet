import { type RawArticle } from './rss.js';
/**
 * CNN Brasil — RSS Feed
 * https://www.cnnbrasil.com.br
 */
export declare const CNN_SOURCE_ID = "cnn";
export declare const CNN_NAME = "CNN Brasil";
export declare const CNN_RSS_URL = "https://www.cnnbrasil.com.br/rss";
export declare function parseCNNFeed(xml: string): RawArticle[];
export declare function fetchCNN(): Promise<RawArticle[]>;
