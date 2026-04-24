import type { AnalysisResult, ArticleToAnalyze } from './types.js';
/**
 * Analyzer mock — simula resposta do LLM para testes locais.
 * Não faz chamada HTTP, retorna dados determinísticos baseados no título.
 *
 * Útil para:
 * - Testar o pipeline sem gastar tokens
 * - Desenvolver offline
 * - Criar fixtures de teste
 */
export declare function mockAnalyze(article: ArticleToAnalyze): AnalysisResult;
/**
 * Batch process — analisa múltiplos artigos.
 */
export declare function mockAnalyzeBatch(articles: ArticleToAnalyze[]): Promise<{
    results: (AnalysisResult & {
        article_id: string;
    })[];
    errors: {
        article_id: string;
        error: string;
    }[];
}>;
