import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../config/database.js';
import { scrapQueue, analyzeQueue } from '../jobs/queues.js';
import {
  AnalyzeInputSchema,
  AnalyzeTextSchema,
  DashboardQuerySchema,
  HistoryQuerySchema,
  CompareQuerySchema,
  AlertsQuerySchema,
} from '../types/index.js';

// ============================================================
// Middleware: autenticação JWT
// ============================================================

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);

  try {
    // Verifica JWT com Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return reply.status(401).send({ success: false, error: 'Invalid token' });
    }

    // Anexa user ao request
    (request as any).user = user;
    (request as any).userId = user.id;
  } catch {
    return reply.status(401).send({ success: false, error: 'Token inválido' });
  }
}

// ============================================================
// Middleware: verificar limite do plano
// ============================================================

export async function checkPlanLimit(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });

  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('plan, analyses_count')
    .eq('id', user.id)
    .single();

  if (!dbUser) return reply.status(404).send({ error: 'Usuário não encontrado' });

  const isFree = dbUser.plan === 'free';
  const limit = isFree ? 5 : -1; // -1 = unlimited

  if (limit !== -1 && dbUser.analyses_count >= limit) {
    return reply.status(403).send({
      success: false,
      error: 'Limite de análises atingido',
      upgrade_url: '/planos',
    });
  }

  (request as any).dbUser = dbUser;
}

// ============================================================
// ROUTES: Analysis
// ============================================================

export async function analysisRoutes(fastify: FastifyInstance) {

  // ---- POST /api/analyze ----
  // Analisa uma URL ou texto
  fastify.post('/analyze', {
    preHandler: [authenticate, checkPlanLimit],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const userId = (request as any).userId;

    // Valida input
    const parsed = AnalyzeInputSchema.safeParse(body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: parsed.error.errors[0].message,
      });
    }

    const { url, text } = parsed.data;

    try {
      if (url) {
        // Enqueue scrap + análise
        await scrapQueue.add('scrap', {
          url,
          user_id: userId,
        });

        // Retorna Accepted (async processing)
        return reply.status(202).send({
          success: true,
          message: 'Artigo na fila para análise',
          status: 'queued',
        });
      } else {
        // Texto direto: cria artigo e já enqueueia análise
        const contentHash = require('crypto')
          .createHash('sha256')
          .update(text)
          .digest('hex');

        // Check duplicate
        const { data: existing } = await supabaseAdmin
          .from('articles')
          .select('id')
          .eq('content_hash', contentHash)
          .single();

        if (existing) {
          return reply.status(409).send({
            success: false,
            error: 'Este conteúdo já foi analisado',
            article_id: existing.id,
          });
        }

        const { data: article } = await supabaseAdmin
          .from('articles')
          .insert({
            title: (text || 'Sem título').substring(0, 200),
            content: text,
            content_hash: contentHash,
            lang: 'pt',
            status: 'pending',
          })
          .select('id')
          .single();

        await analyzeQueue.add('analyze', {
          article_id: article!.id,
          user_id: userId,
        });

        return reply.status(202).send({
          success: true,
          message: 'Análise em andamento',
          article_id: article!.id,
          status: 'processing',
        });
      }
    } catch (err: any) {
      console.error('[API] Erro em /analyze:', err);
      return reply.status(500).send({ success: false, error: 'Erro interno' });
    }
  });

  // ---- GET /api/analyses/:id ----
  // Pega resultado de uma análise
  fastify.get('/analyses/:id', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = (request.params as any);
    const userId = (request as any).userId;

    const { data: analysis, error } = await supabaseAdmin
      .from('article_analyses')
      .select(`
        *,
        article:articles(
          id, title, url, published_at,
          source:sources(id, name),
          author:authors(id, name)
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !analysis) {
      return reply.status(404).send({ success: false, error: 'Análise não encontrada' });
    }

    // Busca ciclos e eventos relacionados
    const [cycles, historicalEvents, subjects, regions] = await Promise.all([
      supabaseAdmin.from('article_cycles')
        .select('cycle_id, similarity, cycles(id, name, phase)')
        .eq('article_id', analysis.article_id)
        .order('similarity', { ascending: false })
        .limit(5),
      (async () => {
        const eventsRes = await supabaseAdmin
          .from('article_cycles')
          .select('historical_event_id, similarity, historical_events(id, title, description, date_start)')
          .eq('article_id', analysis.article_id)
          .not('historical_event_id', 'is', null)
          .order('similarity', { ascending: false })
          .limit(5);
        return eventsRes.data || [];
      })(),
      supabaseAdmin.from('article_subjects')
        .select('subject:sbujects(id, name, slug)')
        .eq('article_id', analysis.article_id),
      supabaseAdmin.from('article_regions')
        .select('region:regions(id, name, code)')
        .eq('article_id', analysis.article_id),
    ]);

    // Busca categorias
    const { data: categories } = await supabaseAdmin
      .from('article_categories')
      .select('category_id, score, indicators, explanations, categories(key)')
      .eq('analysis_id', id);

    return reply.send({
      success: true,
      data: {
        id: analysis.id,
        article_id: analysis.article_id,
        title: (analysis.article as any)?.title,
        url: (analysis.article as any)?.url,
        source: (analysis.article as any)?.source?.name,
        published_at: (analysis.article as any)?.published_at,
        overall_bias_score: analysis.overall_bias_score,
        bias_by_category: analysis.bias_by_category,
        categories: categories || [],
        indicators: analysis.indicators,
        llm_explanation: analysis.llm_explanation,
        cycles: (cycles.data || []).map((c: any) => ({
          id: c.cycles?.id,
          name: c.cycles?.name,
          similarity: c.similarity,
          phase: c.cycles?.phase,
        })),
        historical_events: historicalEvents.map((e: any) => ({
          id: e.historical_events?.id,
          title: e.historical_events?.title,
          description: e.historical_events?.description,
          date_start: e.historical_events?.date_start,
          similarity: e.similarity,
        })),
        subjects: (subjects.data || []).map((s: any) => s.subject).filter(Boolean),
        regions: (regions.data || []).map((r: any) => r.region).filter(Boolean),
        created_at: analysis.created_at,
      },
    });
  });

  // ---- POST /api/analyses/:id/favorite ----
  // Toggle favorito
  fastify.post('/analyses/:id/favorite', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = (request.params as any);
    const userId = (request as any).userId;

    // Por agora, favoritos são marcados via uma coluna `favorite`
    // Em v2 seria uma tabela separada `user_favorites`
    const { data: analysis } = await supabaseAdmin
      .from('article_analyses')
      .select('id, metadata')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!analysis) {
      return reply.status(404).send({ success: false, error: 'Análise não encontrada' });
    }

    const currentFav = analysis.metadata?.favorite || false;
    await supabaseAdmin
      .from('article_analyses')
      .update({ metadata: { ...analysis.metadata, favorite: !currentFav } })
      .eq('id', id);

    return reply.send({ success: true, favorite: !currentFav });
  });
}