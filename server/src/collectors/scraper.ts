import * as cheerio from 'cheerio';
import type { RawArticle } from '../types.js';

/**
 * Web Scraper Collector — para fontes sem RSS.
 * Ponto forte: flexível com seletores CSS customizados por fonte.
 * Ponto fraco: quebra se o site muda o HTML. Usar como fallback do RSS.
 */
export async function scrapeSite(
  baseUrl: string,
  sourceId: string,
  selectors: { article: string; title: string; link: string; date?: string }
): Promise<RawArticle[]> {
  const res = await fetch(baseUrl, {
    headers: { 'User-Agent': 'ProphetBot/0.1 (+https://prophet.app)' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const articles: RawArticle[] = [];

  $(selectors.article).each((_, el) => {
    const title = $(el).find(selectors.title).text().trim();
    let link = $(el).find(selectors.link).attr('href') ?? '';
    const dateText = selectors.date ? $(el).find(selectors.date).text().trim() : undefined;

    // Resolve links relativos
    if (link && !link.startsWith('http')) {
      link = new URL(link, baseUrl).href;
    }

    if (title && link) {
      articles.push({
        title,
        url: link,
        published_at: dateText || undefined,
        source_id: sourceId,
      });
    }
  });

  return articles;
}