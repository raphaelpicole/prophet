/**
 * GLM Cloud Analyzer
 *
 * Usa API da Zhipu (glm-4-flash é gratuito com limites)
 *
 * Variáveis de ambiente:
 * - GLM_API_KEY=sua-chave
 *
 * Obter key: https://open.bigmodel.cn
 */
import type { AnalysisResult, ArticleToAnalyze } from './types.js';
interface GLMConfig {
    apiKey: string;
    model: string;
    baseURL: string;
}
export declare function analyzeWithGLM(article: ArticleToAnalyze, config?: Partial<GLMConfig>): Promise<AnalysisResult & {
    used_glm: boolean;
    error?: string;
}>;
export declare function analyzeBatchWithGLM(articles: ArticleToAnalyze[], config?: Partial<GLMConfig>, concurrency?: number): Promise<{
    results: (AnalysisResult & {
        article_id: string;
        used_glm: boolean;
    })[];
    errors: any[];
}>;
export {};
