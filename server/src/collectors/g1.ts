import { fetchAndParseRSS, parseRSS, type RawArticle } from './rss.js';
import { scrapeSite } from './scraper.js';

/**
 * G1 — RSS Feed da Globo + HTML Scraper fallback
 * Fonte principal brasileira de notícias
 */

export const G1_SOURCE_ID = 'g1';
export const G1_NAME = 'G1';
export const G1_RSS_URL = 'https://g1.globo.com/rss/g1/';
export const G1_URL = 'https://g1.globo.com';

export function parseG1Feed(xml: string): RawArticle[] {
  return parseRSS(xml, G1_SOURCE_ID);
}

export async function fetchG1(): Promise<RawArticle[]> {
  return fetchAndParseRSS(G1_RSS_URL, G1_SOURCE_ID);
}

/**
 * Scraper alternativo para G1 — coleta da homepage
 * Útil se o RSS falhar ou para complementar
 */
export async function fetchG1HTML(): Promise<RawArticle[]> {
  try {
    return await scrapeSite(G1_URL, G1_SOURCE_ID, {
      article: 'article, .feed-post-body, .bastian-feed-item',
      title: 'a.feed-post-link, h2 a, .feed-post-body-title a',
      link: 'a[href^="https://g1.globo.com/"]',
      date: 'time, .feed-post-datetime',
    });
  } catch {
    return [];
  }
}
