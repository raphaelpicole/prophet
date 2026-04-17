import { fetchAndParseRSS, parseRSS, type RawArticle } from './rss.js';

/**
 * G1 — RSS Feed da Globo
 * Fonte principal brasileira de notícias
 */

export const G1_SOURCE_ID = 'g1';
export const G1_NAME = 'G1';
export const G1_RSS_URL = 'https://g1.globo.com/rss/g1/';

export function parseG1Feed(xml: string): RawArticle[] {
  return parseRSS(xml, G1_SOURCE_ID);
}

export async function fetchG1(): Promise<RawArticle[]> {
  return fetchAndParseRSS(G1_RSS_URL, G1_SOURCE_ID);
}