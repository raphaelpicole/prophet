import type { RawArticle } from './rss.js';
/**
 * Fontes estrangeiras sem RSS válido — coleta via HTML scraping
 */
export declare const AP_SOURCE_ID = "ap";
export declare const AP_NAME = "AP News";
export declare const AP_URL = "https://apnews.com";
export declare function fetchAPHTML(): Promise<RawArticle[]>;
export declare const ALJAZEERA_SOURCE_ID = "aljazeera";
export declare const ALJAZEERA_NAME = "Al Jazeera";
export declare const ALJAZEERA_URL = "https://www.aljazeera.com/news";
export declare function fetchAlJazeeraHTML(): Promise<RawArticle[]>;
export declare const DW_SOURCE_ID = "dw";
export declare const DW_NAME = "DW English";
export declare const DW_URL = "https://www.dw.com/en/top-stories/s-9097";
export declare function fetchDWHTML(): Promise<RawArticle[]>;
export declare const FRANCE24_SOURCE_ID = "france24";
export declare const FRANCE24_NAME = "France 24";
export declare const FRANCE24_URL = "https://www.france24.com/en/";
export declare function fetchFrance24HTML(): Promise<RawArticle[]>;
export declare const RTE_SOURCE_ID = "rte";
export declare const RTE_NAME = "RT\u00C9 News";
export declare const RTE_URL = "https://www.rte.ie/news";
export declare function fetchRTEHTML(): Promise<RawArticle[]>;
export declare const NBC_SOURCE_ID = "nbc";
export declare const NBC_NAME = "NBC News";
export declare const NBC_URL = "https://www.nbcnews.com";
export declare function fetchNBCHTML(): Promise<RawArticle[]>;
