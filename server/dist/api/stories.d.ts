import type { VercelRequest, VercelResponse } from '@vercel/node';
/**
 * API /api/stories — lista histórias com filtros
 *
 * GET /api/stories
 * Query params:
 *   - cycle: conflito | economico | politico | ...
 *   - region: nome da região
 *   - bias: esquerda | centro | direita
 *   - sentiment: positivo | negativo | neutro
 *   - limit: número (default 50)
 *   - offset: número (default 0)
 */
declare const _default: (req: VercelRequest, res: VercelResponse) => Promise<any>;
export default _default;
