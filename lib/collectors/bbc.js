import { fetchAndParseRSS, parseRSS } from './rss.js';
/**
 * BBC Brasil — RSS Feed
 * https://www.bbc.com/portuguese
 */
export const BBC_SOURCE_ID = 'bbc';
export const BBC_NAME = 'BBC Brasil';
export const BBC_RSS_URL = 'https://feeds.bbci.co.uk/portuguese/rss.xml';
export function parseBBCFeed(xml) {
    return parseRSS(xml, BBC_SOURCE_ID);
}
export async function fetchBBC() {
    return fetchAndParseRSS(BBC_RSS_URL, BBC_SOURCE_ID);
}
