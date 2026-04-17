import axios from 'axios';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';

export interface ScrapedArticle {
  title: string;
  content: string;
  content_hash: string;
  url: string;
  source_domain: string;
  author: string | null;
  published_at: string | null;
  lang: string;
  extracted_at: string;
}

// ============================================================
// Scraper — busca e parseia artigos de notícias
// ============================================================

export class ScraperService {
  private userAgent = 'CicloNotorio/1.0 (+https://ciclonotorio.com.br)';

  /**
   * Fetch + parse de artigo via URL
   */
  async scrape(url: string): Promise<ScrapedArticle> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      timeout: 15000,
    });

    const html = response.data as string;
    const $ = cheerio.load(html);

    // Detecta domínio da fonte
    const urlObj = new URL(url);
    const sourceDomain = urlObj.hostname.replace(/^www\./, '');

    // Remove scripts, styles, nav, footer, comments
    $('script, style, nav, footer, aside, iframe, noscript, comments').remove();

    // Title
    const title = this.extractTitle($);

    // Content — tenta múltiplos seletores
    const content = this.extractContent($);

    // Author
    const author = this.extractAuthor($);

    // Published date
    const publishedAt = this.extractPublishedAt($, url);

    // Language
    const lang = this.detectLang(title + ' ' + content);

    // Content hash (dedup)
    const contentHash = createHash('sha256')
      .update(content)
      .digest('hex');

    return {
      title,
      content,
      content_hash: contentHash,
      url,
      source_domain: sourceDomain,
      author,
      published_at: publishedAt,
      lang,
      extracted_at: new Date().toISOString(),
    };
  }

  // ---- Private extractors ----

  private extractTitle($: cheerio.CheerioAPI): string {
    // Open Graph title (prioridade)
    const ogTitle = $('meta[property="og:title"]').attr('content');
    if (ogTitle) return this.cleanText(ogTitle);

    // Twitter title
    const twitterTitle = $('meta[name="twitter:title"]').attr('content');
    if (twitterTitle) return this.cleanText(twitterTitle);

    // H1
    const h1 = $('h1').first().text();
    if (h1) return this.cleanText(h1);

    // Title tag
    const titleTag = $('title').text();
    if (titleTag) return this.cleanText(titleTag);

    return '';
  }

  private extractContent($: cheerio.CheerioAPI): string {
    // Schema.org Article schema (prioridade máxima)
    const articleSchema = $('script[type="application/ld+json"]').filter((_, el) => {
      const text = $(el).html() || '';
      return text.includes('"@type"') && text.includes('Article');
    }).html();

    if (articleSchema) {
      try {
        const schema = JSON.parse(articleSchema);
        if (schema.articleBody || schema.text) {
          return this.cleanText(schema.articleBody || schema.text);
        }
      } catch {}
    }

    // Artigo principal (Open Article)
    const articleEl = $('article').first();
    if (articleEl.length) {
      const text = articleEl.text();
      if (text.length > 200) return this.cleanText(text);
    }

    // Div principal de conteúdo
    const contentSelectors = [
      '[role="main"]',
      '.article-body',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content-body',
      '#article-body',
      '.story-body',
      '.news-content',
      'main',
    ];

    for (const selector of contentSelectors) {
      const el = $(selector).first();
      if (el.length) {
        const text = el.text();
        if (text.length > 200) return this.cleanText(text);
      }
    }

    // Fallback: maior text block
    let maxLen = 0;
    let maxText = '';

    $('div, section').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > maxLen) {
        maxLen = text.length;
        maxText = text;
      }
    });

    return this.cleanText(maxText);
  }

  private extractAuthor($: cheerio.CheerioAPI): string | null {
    // Schema.org author
    const authorSchema = $('script[type="application/ld+json"]').filter((_, el) => {
      const text = $(el).html() || '';
      return text.includes('"author"');
    }).html();

    if (authorSchema) {
      try {
        const schema = JSON.parse(authorSchema);
        if (schema.author?.name) return schema.author.name;
        if (Array.isArray(schema.author) && schema.author[0]?.name) return schema.author[0].name;
      } catch {}
    }

    // Meta tags
    const authorMeta = $('meta[name="author"]').attr('content');
    if (authorMeta) return authorMeta;

    // Byline patterns
    const bylinePatterns = [
      { sel: '.author-name', label: null },
      { sel: '.byline-name', label: null },
      { sel: '.byline', label: null },
      { sel: '[rel="author"]', label: null },
      { sel: '.article-author', label: null },
      { sel: '.post-author', label: null },
      { sel: 'span[itemprop="author"]', label: null },
    ];

    for (const { sel } of bylinePatterns) {
      const text = $(sel).first().text().trim();
      if (text && text.length < 100) return text;
    }

    return null;
  }

  private extractPublishedAt($: cheerio.CheerioAPI, url: string): string | null {
    // Schema.org datePublished
    const dateSchema = $('script[type="application/ld+json"]').filter((_, el) => {
      const text = $(el).html() || '';
      return text.includes('datePublished');
    }).html();

    if (dateSchema) {
      try {
        const schema = JSON.parse(dateSchema);
        if (schema.datePublished) return schema.datePublished;
      } catch {}
    }

    // Meta tags
    const metaDate = $('meta[property="article:published_time"]').attr('content')
      || $('meta[name="pubdate"]').attr('content')
      || $('meta[name="publishdate"]').attr('content');

    if (metaDate) return metaDate;

    // Time tag
    const timeTag = $('time[datetime]').first().attr('datetime');
    if (timeTag) return timeTag;

    // URL date patterns (ex: /2024/03/15/)
    const urlDateMatch = url.match(/(\d{4})\/(\d{2})\/(\d{2})/);
    if (urlDateMatch) {
      return `${urlDateMatch[1]}-${urlDateMatch[2]}-${urlDateMatch[3]}`;
    }

    return null;
  }

  private detectLang(text: string): string {
    // Portuguese heuristics
    const ptIndicators = ['ã', 'õ', 'ção', 'ê', 'é', 'è', 'ó', 'à', 'haja', 'será', 'estão'];
    const ptMatches = ptIndicators.filter(w => text.toLowerCase().includes(w)).length;
    if (ptMatches >= 2) return 'pt';

    const enIndicators = ['the', ' and ', ' is ', ' are ', ' was ', ' were ', ' have ', ' has '];
    const enMatches = enIndicators.filter(w => text.toLowerCase().includes(w)).length;
    if (enMatches >= 3) return 'en';

    return 'pt'; // default
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }
}

export const scraperService = new ScraperService();