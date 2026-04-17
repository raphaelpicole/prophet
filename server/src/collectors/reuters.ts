import { fetchAndParseRSS, parseRSS, type RawArticle } from './rss.js';

/**
 * Reuters — RSS Feed
 * https://www.reuters.com
 */

export const REUTERS_SOURCE_ID = 'reuters';
export const REUTERS_NAME = 'Reuters';
export const REUTERS_RSS_URL = 'https://www.reutersagency.com/feed/?taxonomy=markets&post_type=reuters-best';

export function parseReutersFeed(xml: string): RawArticle[] {
  return parseRSS(xml, REUTERS_SOURCE_ID);
}

export async function fetchReuters(): Promise<RawArticle[]> {
  return fetchAndParseRSS(REUTERS_RSS_URL, REUTERS_SOURCE_ID);
}