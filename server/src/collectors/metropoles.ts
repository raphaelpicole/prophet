import { parseRSS, type RawArticle } from './rss.js';

/**
 * Metrópoles — Scraper
 * https://www.metropoles.com
 * 
 * Site de notícias de Brasília com cobertura política e cultural.
 * Não tem RSS oficial fácil — scraping necessário.
 * 
 * Estrutura esperada:
 * - Cards: article.post-card ou .card-news
 * - Título: h3.title ou h2
 * - Link: a dentro do card
 * - Data: time ou .date
 */

export const METROPOLES_SOURCE_ID = 'metropoles';
export const METROPOLES_NAME = 'Metrópoles';
export const METROPOLES_URL = 'https://www.metropoles.com';

/**
 * Extrai artigos da homepage do Metrópoles.
 * 
 * Na implementação real, usar Cheerio com seletores CSS.
 * Esta versão é preparada para mock/testes.
 */
export function parseMetropolesHomepage(html: string): RawArticle[] {
  const articles: RawArticle[] = [];
  
  // Detectar se é página válida do Metrópoles
  if (!html.includes('metropoles') && !html.includes('Metrópoles')) {
    return articles;
  }
  
  // Simulação de parsing — produção usar Cheerio
  // Seletores esperados (para implementação real):
  // - cards: article.post, .card, [data-post]
  // - title: h2 a, h3 a, .post-title
  // - link: a (href completo ou relativo)
  // - date: time[datetime], .post-date
  
  // Regex simplificado para extração básica em testes
  const cardMatches = html.matchAll(
    /<(article|div)[^>]*class="[^"]*(?:post|card|news)[^"]*"[^>]*>.*?<h[23][^>]*>.*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>.*?<\/h[23]>.*?<\/\1>/gis
  );
  
  for (const match of cardMatches) {
    const url = resolveUrl(match[2]);
    const title = cleanText(match[3]);
    
    if (url && title && title.length > 10) {
      articles.push({
        title,
        url,
        source_id: METROPOLES_SOURCE_ID,
      });
    }
  }
  
  return articles.slice(0, 15);
}

/**
 * Extrai conteúdo de uma notícia individual.
 */
export function parseMetropolesArticle(html: string): { title: string; content: string; author?: string; published_at?: string } | null {
  // Seletores esperados:
  // - title: h1.entry-title, h1.post-title, .article-title h1
  // - content: .entry-content, .post-content, article .content
  // - author: .author-name, .post-author a
  // - date: time[datetime], .published-date
  
  const titleMatch = html.match(/<h1[^>]*class="[^"]*(?:entry-title|post-title|article-title)[^"]*"[^>]*>([^<]+)<\/h1>/i);
  const contentMatch = html.match(/<div[^>]*class="[^"]*(?:entry-content|post-content|article-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const authorMatch = html.match(/<(?:a|span)[^>]*class="[^"]*(?:author|byline)[^"]*"[^>]*>([^<]+)<\/\w+>/i);
  const dateMatch = html.match(/<time[^>]*datetime="([^"]+)"/i);
  
  if (!titleMatch) return null;
  
  return {
    title: cleanText(titleMatch[1]),
    content: contentMatch ? cleanHTML(contentMatch[1]).slice(0, 4000) : '',
    author: authorMatch ? authorMatch[1].trim() : undefined,
    published_at: dateMatch ? new Date(dateMatch[1]).toISOString() : undefined,
  };
}

function resolveUrl(href: string): string {
  if (href.startsWith('http')) return href;
  if (href.startsWith('/')) return METROPOLES_URL + href;
  return METROPOLES_URL + '/' + href;
}

function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanHTML(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
