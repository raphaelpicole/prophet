import { fetchAndParseRSS, parseRSS } from './rss.js';
/**
 * AP News — Associated Press
 * https://apnews.com
 */
export const AP_SOURCE_ID = 'ap';
export const AP_NAME = 'AP News';
export const AP_RSS_URL = 'https://apnews.com/rss';
export function parseAPFeed(xml) {
    return parseRSS(xml, AP_SOURCE_ID);
}
export async function fetchAP() {
    return fetchAndParseRSS(AP_RSS_URL, AP_SOURCE_ID);
}
/**
 * Al Jazeera English
 * https://www.aljazeera.com
 */
export const ALJAZEERA_SOURCE_ID = 'aljazeera';
export const ALJAZEERA_NAME = 'Al Jazeera';
export const ALJAZEERA_RSS_URL = 'https://www.aljazeera.com/xml/rss/all.xml';
export function parseAlJazeeraFeed(xml) {
    return parseRSS(xml, ALJAZEERA_SOURCE_ID);
}
export async function fetchAlJazeera() {
    return fetchAndParseRSS(ALJAZEERA_RSS_URL, ALJAZEERA_SOURCE_ID);
}
/**
 * France 24 English
 * https://www.france24.com
 */
export const FRANCE24_SOURCE_ID = 'france24';
export const FRANCE24_NAME = 'France 24';
export const FRANCE24_RSS_URL = 'https://www.france24.com/en/rss';
export function parseFrance24Feed(xml) {
    return parseRSS(xml, FRANCE24_SOURCE_ID);
}
export async function fetchFrance24() {
    return fetchAndParseRSS(FRANCE24_RSS_URL, FRANCE24_SOURCE_ID);
}
/**
 * DW English — Deutsche Welle
 * https://www.dw.com
 */
export const DW_SOURCE_ID = 'dw';
export const DW_NAME = 'DW English';
export const DW_RSS_URL = 'https://rss.dw.com/rss/rss-en';
export function parseDWFeed(xml) {
    return parseRSS(xml, DW_SOURCE_ID);
}
export async function fetchDW() {
    return fetchAndParseRSS(DW_RSS_URL, DW_SOURCE_ID);
}
/**
 * RTÉ News — Ireland (Portuguese-language context)
 * https://www.rte.ie/news
 */
export const RTE_SOURCE_ID = 'rte';
export const RTE_NAME = 'RTÉ News';
export const RTE_RSS_URL = 'https://www.rte.ie/news/rss/news-headlines.xml';
export function parseRTEFeed(xml) {
    return parseRSS(xml, RTE_SOURCE_ID);
}
export async function fetchRTE() {
    return fetchAndParseRSS(RTE_RSS_URL, RTE_SOURCE_ID);
}
/**
 * NBC News — US
 */
export const NBC_SOURCE_ID = 'nbc';
export const NBC_NAME = 'NBC News';
export const NBC_RSS_URL = 'https://rsshub.app/rssfeeder/nbcnews';
export function parseNBCFeed(xml) {
    return parseRSS(xml, NBC_SOURCE_ID);
}
export async function fetchNBC() {
    return fetchAndParseRSS(NBC_RSS_URL, NBC_SOURCE_ID);
}
