import type { RawArticle } from './rss.js';
/**
 * Verifica se um artigo é sobre notícias REAIS
 * Retorna true se deve MANTER o artigo
 */
export declare function isRealNews(article: RawArticle): boolean;
/**
 * Filtra uma lista de artigos, removendo lifestyle/entretenimento
 */
export declare function filterRealNews(articles: RawArticle[]): RawArticle[];
