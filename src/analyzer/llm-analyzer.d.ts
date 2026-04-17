import type { AnalysisResult, ArticleToAnalyze } from './types.js';
/**
 * LLM Analyzer — implementação real com API OpenAI/GLM
 *
 * Features:
 * - Um prompt extrai TUDO (economia de tokens)
 * - Retry automático com backoff
 * - Rate limiting básico
 * - Fallback para mock em caso de falha
 */
interface LLMConfig {
    apiKey: string;
    baseURL?: string;
    model: string;
    maxRetries?: number;
    timeoutMs?: number;
}
/**
 * Análise principal — com fallback para mock se LLM falhar
 */
export declare function analyzeWithLLM(article: ArticleToAnalyze, config?: Partial<LLMConfig>): Promise<AnalysisResult & {
    used_llm: boolean;
    error?: string;
}>;
/**
 * Análise em batch com controle de concorrência
 */
export declare function analyzeBatchWithLLM(articles: ArticleToAnalyze[], config?: Partial<LLMConfig>, concurrency?: number): Promise<{
    results: (AnalysisResult & {
        article_id: string;
        used_llm: boolean;
    })[];
    errors: {
        article_id: string;
        error: string;
    }[];
}>;
export {};
