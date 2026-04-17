import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../config/database.js';
import { CompareQuerySchema } from '../types/index.js';

// ============================================================
// ROUTES: Compare
// ============================================================

export async function compareRoutes(fastify: FastifyInstance) {

  // ---- GET /api/compare ----
  // Comparativo de viés entre fontes sobre o mesmo assunto
  fastify.get('/compare', {
    preHandler: [(req, rep) => {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return rep.status(401).send({ error: 'Unauthorized' });
      (req as any).userId = userId;
    }],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;

    const parsed = CompareQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.errors[0].message });
    }

    const { subject, sources, period, category } = parsed.data;

    // Default: 30 dias
    const periodTo = period || new Date().toISOString().split('T')[0];
    const periodFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    try {
      // Construir query base
      let query = supabaseAdmin
        .from('article_analyses')
        .select(`
          id,
          overall_bias_score,
          bias_by_category,
          article:articles(
            id, title,
            source:sources(id, name, domain)
          )
        `)
        .eq('user_id', userId)
        .gte('created_at', periodFrom)
        .lte('created_at', periodTo);

      const { data: analyses, error } = await query;

      if (error) throw error;

      // Agrega por fonte x categoria
      const sourceMap = new Map<string, {
        name: string;
        bias_scores: number[];
        by_category: Record<string, number[]>;
      }>();

      for (const a of analyses || []) {
        const src = (a.article as any)?.source;
        if (!src) continue;

        if (!sourceMap.has(src.id)) {
          sourceMap.set(src.id, {
            name: src.name,
            bias_scores: [],
            by_category: {
              ideologico: [], economico: [], geopolitico: [],
              social: [], framing: [], emocional: [],
              temporal: [], authority: [],
            },
          });
        }

        const entry = sourceMap.get(src.id)!;
        entry.bias_scores.push(a.overall_bias_score);

        for (const [cat, data] of Object.entries(a.bias_by_category as Record<string, { score: number }>)) {
          if (entry.by_category[cat]) {
            entry.by_category[cat].push((data as any).score);
          }
        }
      }

      // Calcula médias
      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0.5;

      const results = Array.from(sourceMap.entries()).map(([id, data]) => ({
        source_id: id,
        source_name: data.name,
        avg_bias: Math.round(avg(data.bias_scores) * 100) / 100,
        count: data.bias_scores.length,
        by_category: Object.fromEntries(
          Object.entries(data.by_category).map(([cat, scores]) => [
            cat,
            Math.round(avg(scores as number[]) * 100) / 100,
          ])
        ),
      }));

      // Ordena por contagem
      results.sort((a, b) => b.count - a.count);

      // Se category foi passada, filtra só esse score
      if (category) {
        return reply.send({
          success: true,
          data: results.map(r => ({
            source_id: r.source_id,
            source_name: r.source_name,
            count: r.count,
            category_score: r.by_category[category],
          })),
        });
      }

      return reply.send({
        success: true,
        data: {
          sources: results,
          period_from: periodFrom,
          period_to: periodTo,
        },
      });
    } catch (err: any) {
      console.error('[Compare] Erro:', err);
      return reply.status(500).send({ success: false, error: 'Erro interno' });
    }
  });
}