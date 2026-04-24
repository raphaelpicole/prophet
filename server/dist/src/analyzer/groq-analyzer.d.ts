/**
 * Groq Cloud Analyzer
 *
 * Modelos disponíveis:
 * - llama-3.3-70b-versatile (melhor qualidade)
 * - llama-3.1-8b-instant (mais rápido)
 * - mixtral-8x7b-32768 (bom custo-benefício)
 *
 * API: https://console.groq.com
 * Docs: https://console.groq.com/docs
 */
import type { AnalysisResult, ArticleToAnalyze } from './types.js';
interface GroqConfig {
    apiKey: string;
    model: string;
    baseURL: string;
}
export declare function analyzeWithGroq(article: ArticleToAnalyze, config?: Partial<GroqConfig>): Promise<AnalysisResult & {
    used_groq: boolean;
    error?: string;
    tokens_used?: number;
}>;
/**
 * Testa o analyzer Groq
 */
export declare function testGroq(): Promise<void>;
export {};
