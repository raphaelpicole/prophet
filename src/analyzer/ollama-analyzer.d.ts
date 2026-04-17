import type { AnalysisResult, ArticleToAnalyze } from './types.js';
/**
 * Ollama Analyzer — usa modelo local via API do Ollama
 *
 * Requisitos:
 * - Ollama instalado: https://ollama.com
 * - Modelo baixado: ollama pull llama3.2 (ou outro)
 * - API rodando em http://localhost:11434
 *
 * Vantagens:
 * - Sem custo de API
 * - Funciona offline
 * - Dados não saem do computador
 * - Sem rate limits
 */
interface OllamaConfig {
    baseURL: string;
    model: string;
    timeoutMs?: number;
}
/**
 * Verifica se Ollama está disponível
 */
export declare function isOllamaAvailable(config?: Partial<OllamaConfig>): Promise<boolean>;
/**
 * Lista modelos disponíveis
 */
export declare function listOllamaModels(config?: Partial<OllamaConfig>): Promise<string[]>;
/**
 * Análise com Ollama
 */
export declare function analyzeWithOllama(article: ArticleToAnalyze, config?: Partial<OllamaConfig>): Promise<AnalysisResult & {
    used_ollama: boolean;
    error?: string;
}>;
/**
 * Análise em batch com Ollama
 */
export declare function analyzeBatchWithOllama(articles: ArticleToAnalyze[], config?: Partial<OllamaConfig>, concurrency?: number): Promise<{
    results: (AnalysisResult & {
        article_id: string;
        used_ollama: boolean;
    })[];
    errors: {
        article_id: string;
        error: string;
    }[];
}>;
export {};
