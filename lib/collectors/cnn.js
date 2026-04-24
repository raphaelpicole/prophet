import { fetchAndParseRSS, parseRSS } from './rss.js';
/**
 * CNN Brasil — RSS Feed
 * https://www.cnnbrasil.com.br
 */
export const CNN_SOURCE_ID = 'cnn';
export const CNN_NAME = 'CNN Brasil';
export const CNN_RSS_URL = 'https://www.cnnbrasil.com.br/rss';
export function parseCNNFeed(xml) {
    return parseRSS(xml, CNN_SOURCE_ID);
}
export async function fetchCNN() {
    return fetchAndParseRSS(CNN_RSS_URL, CNN_SOURCE_ID);
}
