import { fetchAndParseRSS, parseRSS, type RawArticle } from './rss.js';

/**
 * CNN Brasil — RSS Feed
 * https://www.cnnbrasil.com.br
 */

export const CNN_SOURCE_ID = 'cnn';
export const CNN_NAME = 'CNN Brasil';
export const CNN_RSS_URL = 'https://www.cnnbrasil.com.br/rss';

export function parseCNNFeed(xml: string): RawArticle[] {
  return parseRSS(xml, CNN_SOURCE_ID);
}

export async function fetchCNN(): Promise<RawArticle[]> {
  return fetchAndParseRSS(CNN_RSS_URL, CNN_SOURCE_ID);
}