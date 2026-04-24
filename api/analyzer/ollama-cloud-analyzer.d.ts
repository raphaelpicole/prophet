/**
 * Ollama Cloud Analyzer — kimi-k2.5 via API
 *
 * Integra com Ollama Cloud (https://ollama.com) usando API key.
 * Não requer Ollama instalado localmente.
 *
 * Modelos cloud: https://ollama.com/search?c=cloud
 * API docs: https://docs.ollama.com/cloud
 *
 * Para usar:
 * 1. Crie conta em https://ollama.com
 * 2. Gere API key em https://ollama.com/settings/keys
 * 3. Configure OLLAMA_API_KEY no .env
 * 4. Use o modelo kimi-k2.5:cloud (ou outro cloud model)
 */
import type { AnalysisResult, ArticleToAnalyze } from './types.js';
interface OllamaCloudConfig {
    apiKey: string;
    model: string;
    baseURL: string;
    maxConcurrent: number;
    delayBetweenMs: number;
    maxTokens: number;
    timeoutMs: number;
}
/**
 * Analisa uma notícia com Ollama Cloud (kimi-k2.5)
 */
export declare function analyzeWithOllamaCloud(article: ArticleToAnalyze, config?: Partial<OllamaCloudConfig>): Promise<AnalysisResult & {
    used_ollama_cloud: boolean;
    error?: string;
    model_used?: string;
}>;
/**
 * Versão async com retry automático
 */
export declare function analyzeWithOllamaCloudWithRetry(article: ArticleToAnalyze, config?: Partial<OllamaCloudConfig>, maxRetries?: number): Promise<AnalysisResult & {
    used_ollama_cloud: boolean;
    error?: string;
    model_used?: string;
}>;
/**
 * Testa Ollama Cloud
 */
export declare function testOllamaCloud(): Promise<void>;
export {};
