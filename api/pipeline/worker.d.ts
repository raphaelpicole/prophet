/**
 * Pipeline Worker — orquestra o fluxo completo de processamento
 *
 * Fluxo:
 * 1. Coleta notícias de todas as fontes
 * 2. Deduplica (URL + hash + similaridade)
 * 3. Insere no banco (status: pending)
 * 4. Analisa com LLM (status: analyzed)
 * 5. Agrupa em stories
 *
 * Executar via:
 * - API: POST /api/collect
 * - Cron: Vercel Cron (a cada 30 min)
 * - Manual: npx tsx src/pipeline/worker.ts
 */
interface PipelineResult {
    runId: string;
    startedAt: string;
    finishedAt: string;
    summary: {
        totalCollected: number;
        totalInserted: number;
        totalAnalyzed: number;
        totalGrouped: number;
        errors: number;
    };
    details: {
        source: string;
        collected: number;
        inserted: number;
        errors: string[];
    }[];
}
/**
 * Executa o pipeline completo
 */
export declare function runPipeline(): Promise<PipelineResult>;
/**
 * Agrupa artigos analisados em stories
 */
declare function groupArticlesIntoStories(): Promise<number>;
export { groupArticlesIntoStories };
