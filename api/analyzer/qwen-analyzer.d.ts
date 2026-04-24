/**
 * Qwen Cloud Analyzer
 *
 * Modelo: qwen3.5:397b-cloud
 * API Key: fornecida pelo usuário
 */
import type { AnalysisResult, ArticleToAnalyze } from './types.js';
interface QwenConfig {
    apiKey: string;
    model: string;
    baseURL: string;
}
export declare function analyzeWithQwen(article: ArticleToAnalyze, config?: Partial<QwenConfig>): Promise<AnalysisResult & {
    used_qwen: boolean;
    error?: string;
}>;
declare function testQwen(): Promise<void>;
export { testQwen };
