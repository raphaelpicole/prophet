import type { VercelRequest, VercelResponse } from '@vercel/node';
/**
 * CRON ENTRY — Vercel chama a cada 15 min.
 *
 * Pipeline completo:
 *   1. Coleta notícias de todas as fontes (paralelo)
 *   2. Deduplica contra o banco
 *   3. Insere novas no Supabase
 *   4. Roda análise LLM nos pendentes
 *   5. Agrupa em histórias
 *
 * Ponto forte: é uma pipeline atômica — se qualquer etapa falha,
 * as anteriores já persistiram. Não perde dados.
 */
declare const _default: (req: VercelRequest, res: VercelResponse) => Promise<any>;
export default _default;
