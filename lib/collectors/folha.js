import { fetchAndParseRSS, parseRSS } from './rss.js';
/**
 * Folha de S.Paulo — RSS Feed
 * https://www.folha.uol.com.br
 */
export const FOLHA_SOURCE_ID = 'folha';
export const FOLHA_NAME = 'Folha de S.Paulo';
export const FOLHA_RSS_URL = 'https://feeds.folha.uol.com.br/emais/rss091.xml';
export function parseFolhaFeed(xml) {
    return parseRSS(xml, FOLHA_SOURCE_ID);
}
export async function fetchFolha() {
    return fetchAndParseRSS(FOLHA_RSS_URL, FOLHA_SOURCE_ID);
}
