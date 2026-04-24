import { fetchAndParseRSS, parseRSS } from './rss.js';
/**
 * UOL — RSS Feed
 * https://www.uol.com.br
 */
export const UOL_SOURCE_ID = 'uol';
export const UOL_NAME = 'UOL';
export const UOL_RSS_URL = 'https://rss.uol.com.br/feed/noticias.xml';
export function parseUOLFeed(xml) {
    return parseRSS(xml, UOL_SOURCE_ID);
}
export async function fetchUOL() {
    return fetchAndParseRSS(UOL_RSS_URL, UOL_SOURCE_ID);
}
