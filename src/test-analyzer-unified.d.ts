/**
 * Unified Analyzer — usa o melhor disponível
 *
 * Ordem de prioridade:
 * 1. Ollama local (se disponível)
 * 2. GLM Cloud (se tem API key)
 * 3. Mock (fallback)
 *
 * Para usar:
 * - Ollama: certifique-se que está rodando em localhost:11434
 * - GLM: export GLM_API_KEY=sua-chave
 */
import type { ArticleToAnalyze } from './types.js';
import type { AnalysisResult } from './types.js';
export declare function analyze(article: ArticleToAnalyze): Promise<AnalysisResult & {
    provider: 'ollama' | 'glm' | 'mock';
}>;
declare function testUnified(): Promise<void>;
export { testUnified };
