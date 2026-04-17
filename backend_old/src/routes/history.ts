import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../config/database.js';
import { HistoryQuerySchema, AlertsQuerySchema } from '../types/index.js';

// ============================================================
// ROUTES: History & Alerts
// ============================================================

export async function historyRoutes(fastify: FastifyInstance) {

  // ---- GET /api/history ----
  fastify.get('/history', {
    preHandler: [(req, rep) => {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return rep.status(401).send({ error: 'Unauthorized' });
      (req as any).userId = userId;
    }],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;

    const parsed = HistoryQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.errors[0].message });
    }

    const { page, limit, source, category, subject, from, to, sort, favorites_only } = parsed.data;
    const offset = (page - 1) * limit;

    try {
      let query = supabaseAdmin
        .from('article_analyses')
        .select(`
          id, overall_bias_score, created_at, metadata,
          article:articles(
            id, title, url, published_at,
            source:sources(id, name),
            author:authors(id, name)
          )
        `, { count: 'exact' })
        .eq('user_id', userId);

      // Filtros
      if (from) query = query.gte('created_at', from);
      if (to) query = query.lte('created_at', to);
      if (favorites_only) {
        query = query.filter('metadata.favorite', 'eq', true);
      }

      // Ordenação
      if (sort === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sort === 'score') {
        query = query.order('overall_bias_score', { ascending: false });
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const items = (data || []).map((a: any) => ({
        id: a.id,
        title: a.article?.title,
        url: a.article?.url,
        source: a.article?.source?.name,
        author: a.article?.author?.name,
        score: a.overall_bias_score,
        published_at: a.article?.published_at,
        favorite: a.metadata?.favorite || false,
        created_at: a.created_at,
      }));

      return reply.send({
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / limit),
          },
        },
      });
    } catch (err: any) {
      console.error('[History] Erro:', err);
      return reply.status(500).send({ success: false, error: 'Erro interno' });
    }
  });

  // ---- GET /api/alerts ----
  fastify.get('/alerts', {
    preHandler: [(req, rep) => {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return rep.status(401).send({ error: 'Unauthorized' });
      (req as any).userId = userId;
    }],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;

    const parsed = AlertsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.errors[0].message });
    }

    const { page, limit, unread_only } = parsed.data;
    const offset = (page - 1) * limit;

    try {
      let query = supabaseAdmin
        .from('alerts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unread_only) {
        query = query.eq('read', false);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Count de não-lidas
      const { count: unreadCount } = await supabaseAdmin
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      return reply.send({
        success: true,
        data: {
          items: data || [],
          unread_count: unreadCount || 0,
          pagination: {
            page,
            limit,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / limit),
          },
        },
      });
    } catch (err: any) {
      console.error('[Alerts] Erro:', err);
      return reply.status(500).send({ success: false, error: 'Erro interno' });
    }
  });

  // ---- PATCH /api/alerts/:id/read ----
  fastify.patch('/alerts/:id/read', {
    preHandler: [(req, rep) => {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return rep.status(401).send({ error: 'Unauthorized' });
      (req as any).userId = userId;
    }],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = (request.params as any);
    const userId = (request as any).userId;

    const { error } = await supabaseAdmin
      .from('alerts')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return reply.status(500).send({ success: false, error: 'Erro interno' });

    return reply.send({ success: true });
  });

  // ---- POST /api/alerts/mark-all-read ----
  fastify.post('/alerts/mark-all-read', {
    preHandler: [(req, rep) => {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return rep.status(401).send({ error: 'Unauthorized' });
      (req as any).userId = userId;
    }],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;

    await supabaseAdmin
      .from('alerts')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    return reply.send({ success: true });
  });
}