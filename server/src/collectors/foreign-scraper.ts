import { scrapeSite } from './scraper.js';
import type { RawArticle } from './rss.js';

/**
 * Fontes estrangeiras sem RSS válido — coleta via HTML scraping
 */

// AP News
export const AP_SOURCE_ID = 'ap';
export const AP_NAME = 'AP News';
export const AP_URL = 'https://apnews.com';

export async function fetchAPHTML(): Promise<RawArticle[]> {
  try {
    return await scrapeSite(AP_URL, AP_SOURCE_ID, {
      article: 'article',
      title: 'h2, h3',
      link: 'a[href^="/article"]',
      date: 'time, span[data-date]',
    });
  } catch {
    return [];
  }
}

// Al Jazeera
export const ALJAZEERA_SOURCE_ID = 'aljazeera';
export const ALJAZEERA_NAME = 'Al Jazeera';
export const ALJAZEERA_URL = 'https://www.aljazeera.com/news';

export async function fetchAlJazeeraHTML(): Promise<RawArticle[]> {
  try {
    return await scrapeSite(ALJAZEERA_URL, ALJAZEERA_SOURCE_ID, {
      article: 'article',
      title: 'h3 a, h2 a',
      link: 'a[href^="/news/202"]',
      date: 'time, .date',
    });
  } catch {
    return [];
  }
}

// DW English
export const DW_SOURCE_ID = 'dw';
export const DW_NAME = 'DW English';
export const DW_URL = 'https://www.dw.com/en/top-stories/s-9097';

export async function fetchDWHTML(): Promise<RawArticle[]> {
  try {
    return await scrapeSite(DW_URL, DW_SOURCE_ID, {
      article: '.news, article',
      title: 'h2 a, h3 a',
      link: 'a[href^="/en/"]',
      date: 'time, .date',
    });
  } catch {
    return [];
  }
}

// France 24
export const FRANCE24_SOURCE_ID = 'france24';
export const FRANCE24_NAME = 'France 24';
export const FRANCE24_URL = 'https://www.france24.com/en/';

export async function fetchFrance24HTML(): Promise<RawArticle[]> {
  try {
    return await scrapeSite(FRANCE24_URL, FRANCE24_SOURCE_ID, {
      article: 'article, .m-item',
      title: 'h2 a, h3 a, .title',
      link: 'a[href^="/en/"]',
      date: 'time, .date',
    });
  } catch {
    return [];
  }
}

// RTÉ News
export const RTE_SOURCE_ID = 'rte';
export const RTE_NAME = 'RTÉ News';
export const RTE_URL = 'https://www.rte.ie/news';

export async function fetchRTEHTML(): Promise<RawArticle[]> {
  try {
    return await scrapeSite(RTE_URL, RTE_SOURCE_ID, {
      article: 'article, .article',
      title: 'h2 a, h3 a',
      link: 'a[href^="/news/"]',
      date: 'time, .date',
    });
  } catch {
    return [];
  }
}

// NBC News
export const NBC_SOURCE_ID = 'nbc';
export const NBC_NAME = 'NBC News';
export const NBC_URL = 'https://www.nbcnews.com';

export async function fetchNBCHTML(): Promise<RawArticle[]> {
  try {
    return await scrapeSite(NBC_URL, NBC_SOURCE_ID, {
      article: 'article',
      title: 'h2 a, h3 a, .headline',
      link: 'a[href^="/news/"]',
      date: 'time, .date',
    });
  } catch {
    return [];
  }
}
