/**
 * AnalyzerOrchestrator — tenta múltiplos provedores em ordem de prioridade
 *
 * Ordem: Ollama Cloud (kimi) → Groq → Mock
 * O primeiro que responder vai, os outros são ignorados.
 */
import type { AnalysisResult, ArticleToAnalyze } from './types.js';
export interface AnalyzerResult extends AnalysisResult {
    provider: 'ollama-cloud' | 'groq' | 'mock';
    model_used?: string;
    error?: string;
}
/**
 * Tenta todos os analyzers em cascata até um funcionar
 */
export declare function analyzeWithBestAvailable(article: ArticleToAnalyze, options?: {
    ollamaKey?: string;
    groqKey?: string;
    preferProvider?: 'ollama-cloud' | 'groq';
}): Promise<AnalyzerResult>;
/**
 * Análise em batch com melhor provedor disponível
 */
export declare function analyzeBatchBestAvailable(articles: ArticleToAnalyze[], concurrency?: number): Promise<{
    results: (AnalyzerResult & {
        article_id: string;
    })[];
    errors: {
        article_id: string;
        error: string;
    }[];
}>;
