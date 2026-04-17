import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../config/database.js';
import { cycleDetectorService } from '../services/cycle-detector.js';
import { DashboardQuerySchema } from '../types/index.js';

// ============================================================
// ROUTES: Dashboard
// ============================================================

export async function dashboardRoutes(fastify: FastifyInstance) {

  // ---- GET /api/dashboard ----
  fastify.get('/dashboard', {
    preHandler: [async (req, rep) => {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return rep.status(401).send({ error: 'Unauthorized' });
      (req as any).userId = userId;
    }],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;

    const queryParsed = DashboardQuerySchema.safeParse(request.query);
    if (!queryParsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos' });
    }

    const { from, to } = queryParsed.data;

    const today = new Date();
    const periodTo = to || today.toISOString().split('T')[0];
    const periodFrom = from || new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    try {
      // 1. Análises do período
      const analysesRes = await supabaseAdmin
        .from('article_analyses')
        .select('id, overall_bias_score, bias_by_category, created_at, article_id')
        .eq('user_id', userId)
        .gte('created_at', periodFrom)
        .lte('created_at', periodTo);

      const analyses = analysesRes.data || [];
      const totalAnalyses = analyses.length;

      if (totalAnalyses === 0) {
        return reply.send({
          success: true,
          data: {
            period: { from: periodFrom, to: periodTo },
            stats: { total_analyses: 0, unique_sources: 0, avg_bias_score: 0.5 },
            bias_by_category: [],
            top_sources: [],
            active_cycles: [],
            top_subjects: [],
            recent_articles: [],
          },
        });
      }

      // 2. Busca artigos
      const articleIds = analyses.map(a => a.article_id);
      const articlesRes = await supabaseAdmin
        .from('articles')
        .select('id, title, url, source_id')
        .in('id', articleIds);

      const articleMap = new Map(articlesRes.data?.map(a => [a.id, a]) || []);

      // 3. Busca fontes
      const sourceIds = [...new Set(articlesRes.data?.map(a => a.source_id).filter(Boolean) || [])];
      const sourcesRes = sourceIds.length > 0
        ? await supabaseAdmin.from('sources').select('id, name').in('id', sourceIds)
        : { data: [] };
      const sourceMap = new Map(sourcesRes.data?.map(s => [s.id, s]) || []);

      // 4. Busca subjects por article
      const subjectsRes = await supabaseAdmin
        .from('article_subjects')
        .select('article_id, subject_id, confidence')
        .in('article_id', articleIds);

      const subjectIds = [...new Set(subjectsRes.data?.map(s => s.subject_id) || [])];
      const subjectDetailsRes = subjectIds.length > 0
        ? await supabaseAdmin.from('subjects').select('id, name, cycle_tags').in('id', subjectIds)
        : { data: [] };
      const subjectMap = new Map(subjectDetailsRes.data?.map(s => [s.id, s]) || []);

      // 5. Bias por categoria
      const categoryTotals: Record<string, { sum: number; count: number }> = {};
      const cats = ['ideologico', 'economico', 'geopolitico', 'social', 'framing', 'emocional', 'temporal', 'authority'];
      for (const cat of cats) categoryTotals[cat] = { sum: 0, count: 0 };

      for (const a of analyses) {
        for (const [cat, data] of Object.entries(a.bias_by_category as Record<string, { score: number }>)) {
          if (categoryTotals[cat]) {
            categoryTotals[cat].sum += (data as any).score;
            categoryTotals[cat].count++;
          }
        }
      }

      const biasByCategory = cats.map(cat => ({
        category: cat,
        score_avg: categoryTotals[cat].count > 0
          ? Math.round((categoryTotals[cat].sum / categoryTotals[cat].count) * 10000) / 10000
          : 0.5,
        trend: 'stable' as const,
      }));

      // 6. Top fontes
      const sourceStats = new Map<string, { count: number; biasSum: number; name: string }>();
      for (const a of analyses) {
        const article = articleMap.get(a.article_id);
        if (!article?.source_id) continue;
        const src = sourceMap.get(article.source_id);
        if (!src) continue;
        if (!sourceStats.has(src.id)) sourceStats.set(src.id, { count: 0, biasSum: 0, name: src.name });
        const e = sourceStats.get(src.id)!;
        e.count++;
        e.biasSum += a.overall_bias_score;
      }
      const topSources = Array.from(sourceStats.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([id, data]) => ({
          source: data.name,
          count: data.count,
          avg_bias: Math.round((data.biasSum / data.count) * 100) / 100,
        }));

      // 7. Top assuntos
      const subjectStats = new Map<string, { count: number; confidence: number; name: string; cycle_tags: string[] }>();
      for (const s of subjectsRes.data || []) {
        const subj = subjectMap.get(s.subject_id);
        if (!subj) continue;
        if (!subjectStats.has(subj.id)) {
          subjectStats.set(subj.id, { count: 0, confidence: 0, name: subj.name, cycle_tags: subj.cycle_tags || [] });
        }
        const e = subjectStats.get(subj.id)!;
        e.count++;
        e.confidence += s.confidence;
      }
      const topSubjects = Array.from(subjectStats.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 8)
        .map(([id, data]) => ({
          id,
          name: data.name,
          count: data.count,
          avg_confidence: Math.round((data.confidence / data.count) * 100) / 100,
          related_cycles: data.cycle_tags,
        }));

      // 8. Ciclos ativos
      let activeCycles: any[] = [];
      try {
        activeCycles = await cycleDetectorService.getActiveCycles(userId, periodFrom, periodTo);
      } catch (e) {
        console.error('[Dashboard] getActiveCycles error:', e);
      }

      // 9. Artigos recentes
      const recentArticles = analyses
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(a => {
          const article = articleMap.get(a.article_id);
          const source = article?.source_id ? sourceMap.get(article.source_id) : null;
          return {
            id: a.id,
            title: article?.title || 'Sem título',
            url: article?.url || null,
            source: source?.name || 'Desconhecida',
            bias_score: a.overall_bias_score,
            created_at: a.created_at,
          };
        });

      const avgBias = analyses.length > 0
        ? Math.round((analyses.reduce((s, a) => s + a.overall_bias_score, 0) / analyses.length) * 100) / 100
        : 0.5;

      return reply.send({
        success: true,
        data: {
          period: { from: periodFrom, to: periodTo },
          stats: {
            total_analyses: totalAnalyses,
            unique_sources: topSources.length,
            avg_bias_score: avgBias,
          },
          bias_by_category: biasByCategory,
          top_sources: topSources,
          active_cycles: activeCycles,
          top_subjects: topSubjects,
          recent_articles: recentArticles,
        },
      });

    } catch (err: any) {
      console.error('[Dashboard] Erro:', err);
      return reply.status(500).send({ success: false, error: 'Erro ao carregar dashboard' });
    }
  });
}
