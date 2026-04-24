import type { VercelRequest, VercelResponse } from '@vercel/node';
/**
 * API /api/collect — executa o pipeline completo
 *
 * POST /api/collect
 * Executa: Coleta → Deduplica → Análise → Agrupamento
 *
 * Também chamado pelo Vercel Cron a cada 30 minutos
 */
declare const _default: (req: VercelRequest, res: VercelResponse) => Promise<any>;
export default _default;
