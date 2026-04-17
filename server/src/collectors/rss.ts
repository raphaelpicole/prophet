export interface RawArticle {
  title: string;
  url: string;
  content?: string;
  published_at?: string;
  source_id: string;
}

/**
 * Parseia feed RSS e retorna lista de artigos.
 * Versão pura — não faz fetch, recebe o XML como parâmetro.
 * Isso facilita testes unitários (sem network).
 */
export function parseRSS(xml: string, sourceId: string): RawArticle[] {
  const items = xml.matchAll(/<item[\s\S]*?<\/item>/g);
  const articles: RawArticle[] = [];

  for (const item of items) {
    const raw = item[0];
    const title = raw.match(/<title>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/title>/)?.[1]
      ?? raw.match(/<title>\s*<!!\[CDATA\[(.*?)\]\]>\s*<\/title>/)?.[1]
      ?? raw.match(/<title>(.*?)<\/title>/)?.[1]?.trim() ?? '';
    const link = raw.match(/<link>(.*?)<\/link>/)?.[1]?.trim() ?? '';
    const pubDate = raw.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];

    if (title && link) {
      let published_at: string | undefined;
      if (pubDate) {
        const date = new Date(pubDate);
        if (!isNaN(date.getTime())) {
          published_at = date.toISOString();
        }
      }
      
      articles.push({
        title: decodeHTMLEntities(title),
        url: link.trim(),
        published_at,
        source_id: sourceId,
      });
    }
  }

  return articles;
}

/**
 * Faz fetch do feed RSS e parseia.
 * Versão com network — usar em produção/dev.
 */
export async function fetchAndParseRSS(feedUrl: string, sourceId: string): Promise<RawArticle[]> {
  const res = await fetch(feedUrl);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const xml = await res.text();
  return parseRSS(xml, sourceId);
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
