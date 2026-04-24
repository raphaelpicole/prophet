import { runPipeline } from '../lib/pipeline/worker.js';
import { withSentry } from '../lib/middleware/sentry.js';
/**
 * API /api/collect — executa o pipeline completo
 *
 * POST /api/collect
 * Executa: Coleta → Deduplica → Análise → Agrupamento
 *
 * Também chamado pelo Vercel Cron a cada 30 minutos
 */
export default withSentry(async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    try {
        const result = await runPipeline();
        return res.status(200).json({
            success: true,
            run_id: result.runId,
            started_at: result.startedAt,
            finished_at: result.finishedAt,
            summary: result.summary,
            details: result.details,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
