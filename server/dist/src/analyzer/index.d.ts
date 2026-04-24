import type { Analysis } from '../types.js';
export declare function analyzeArticle(articleId: string, title: string, content?: string): Promise<Analysis>;
/**
 * Batch analysis — processa múltiplas notícias pendentes.
 * Ponto forte: processa em paralelo com limite de concorrência para não estourar API rate limit.
 */
export declare function analyzePending(limit?: number): Promise<number>;
