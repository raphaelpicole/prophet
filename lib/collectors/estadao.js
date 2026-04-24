import { fetchAndParseRSS, parseRSS } from './rss.js';
/**
 * Estadão — RSS Feed
 * https://www.estadao.com.br
 */
export const ESTADAO_SOURCE_ID = 'estadao';
export const ESTADAO_NAME = 'Estadão';
export const ESTADAO_RSS_URL = 'https://www.estadao.com.br/ultimas/rss';
export function parseEstadaoFeed(xml) {
    return parseRSS(xml, ESTADAO_SOURCE_ID);
}
export async function fetchEstadao() {
    return fetchAndParseRSS(ESTADAO_RSS_URL, ESTADAO_SOURCE_ID);
}
