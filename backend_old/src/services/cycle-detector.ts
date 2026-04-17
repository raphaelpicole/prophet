import { supabaseAdmin } from '../config/database.js';
import type { DbHistoricalEvent, DetectCyclesJob } from '../types/index.js';

// ============================================================
// Cycle Detector Service
// Detecta ciclos ativos e correlaciona com eventos históricos
// ============================================================

export class CycleDetectorService {
  /**
   * Detecta quais ciclos estão ativos para um artigo
   * e busca eventos históricos similares.
   */
  async detectCycles(job: DetectCyclesJob): Promise<void> {
    const { article_id, analysis_id } = job;

    // Busca artigo e análise
    const [articleRes, analysisRes, cyclesRes] = await Promise.all([
      supabaseAdmin.from('articles').select('*').eq('id', article_id).single(),
      supabaseAdmin.from('article_analyses').select('*').eq('id', analysis_id).single(),
      supabaseAdmin.from('cycles').select('*'),
    ]);

    const article = articleRes.data;
    const analysis = analysisRes.data;
    const cycles = cyclesRes.data || [];

    if (!article || !analysis) {
      throw new Error('Article or analysis not found');
    }

    // Texto combinado para embedding
    const text = `${article.title} ${article.content}`.substring(0, 8000);

    // Busca eventos históricos similares via pgvector
    const { data: similarEvents } = await supabaseAdmin
      .rpc('match_historical_events', {
        query_embedding: await this.generateEmbedding(text),
        match_threshold: 0.55,
        match_count: 5,
      });

    if (!similarEvents || similarEvents.length === 0) return;

    // Para cada evento similar, determina quais ciclos ele ativa
    const cycleMatches: Map<string, { similarity: number; historical_event_id: string }> = new Map();

    for (const event of similarEvents as DbHistoricalEvent[]) {
      // Busca os ciclos associados a este evento histórico
      // (os cycle_tags dos subjects do evento histórico nos dão esta线索)
      const { data: subjects } = await supabaseAdmin
        .from('subjects')
        .select('cycle_tags')
        .in('id', event.subject_ids || []);

      const cycleTags = new Set<string>();
      for (const s of subjects || []) {
        for (const tag of s.cycle_tags || []) {
          cycleTags.add(tag);
        }
      }

      // Para cada ciclo da base, verifica se tem relação
      for (const cycle of cycles) {
        const cycleKey = cycle.name.toLowerCase().replace(/\s+/g, '-');
        if (cycleTags.has(cycleKey) || cycleTags.has(cycle.name)) {
          const existing = cycleMatches.get(cycle.id);
          if (!existing || (event.similarity ?? 0) > existing.similarity) {
            cycleMatches.set(cycle.id, {
              similarity: event.similarity ?? 0,
              historical_event_id: event.id,
            });
          }
        }
      }
    }

    // Insere article_cycles
    const cycleRows = Array.from(cycleMatches.entries()).map(([cycle_id, data]) => ({
      article_id,
      cycle_id,
      similarity: data.similarity,
      historical_event_id: data.historical_event_id,
    }));

    if (cycleRows.length > 0) {
      await supabaseAdmin.from('article_cycles').insert(cycleRows);
    }

    // Insere article_subjects
    const subjectIds = new Set<string>();
    for (const event of similarEvents as DbHistoricalEvent[]) {
      for (const sid of event.subject_ids || []) {
        subjectIds.add(sid);
      }
    }

    if (subjectIds.size > 0) {
      const subjectRows = Array.from(subjectIds).map(subject_id => ({
        article_id,
        subject_id,
        confidence: 0.7,
      }));
      await supabaseAdmin.from('article_subjects').insert(subjectRows);
    }

    // Insere article_regions
    const regionIds = new Set<string>();
    for (const event of similarEvents as DbHistoricalEvent[]) {
      for (const rid of event.region_ids || []) {
        regionIds.add(rid);
      }
    }

    if (regionIds.size > 0) {
      const regionRows = Array.from(regionIds).map(region_id => ({
        article_id,
        region_id,
      }));
      await supabaseAdmin.from('article_regions').insert(regionRows);
    }
  }

  /**
   * Gera embedding via OpenAI (text-embedding-3-small)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }

  /**
   * Busca ciclos ativos no momento (baseado nos articles mais recentes)
   */
  async getActiveCycles(userId: string, periodFrom: string, periodTo: string) {
    // Busca analyses do user no período
    const { data: analyses } = await supabaseAdmin
      .from('article_analyses')
      .select('id, article_id')
      .eq('user_id', userId)
      .gte('created_at', periodFrom)
      .lte('created_at', periodTo);

    if (!analyses || analyses.length === 0) return [];

    const articleIds = analyses.map(a => a.article_id);

    // Busca article_cycles desses articles
    const { data: cycles, error } = await supabaseAdmin
      .from('article_cycles')
      .select('*, cycles(*)')
      .in('article_id', articleIds)
      .order('similarity', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Agrega por ciclo
    const cycleMap = new Map<string, { count: number; avg_similarity: number; cycle: any }>();

    for (const row of cycles || []) {
      const cycle = (row as any).cycles as any;
      if (!cycle) continue;
      if (!cycleMap.has(cycle.id)) {
        cycleMap.set(cycle.id, { count: 0, avg_similarity: 0, cycle });
      }
      const entry = cycleMap.get(cycle.id)!;
      entry.count++;
      entry.avg_similarity = ((entry.avg_similarity * (entry.count - 1)) + row.similarity) / entry.count;
    }

    return Array.from(cycleMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(e => ({
        id: e.cycle.id,
        name: e.cycle.name,
        phase: e.cycle.phase,
        description: e.cycle.description,
        count: e.count,
        avg_similarity: Math.round(e.avg_similarity * 100) / 100,
      }));
  }

  /**
   * Gera alertas de ciclo para um usuário
   */
  async generateAlerts(userId: string): Promise<void> {
    const { data: cycles } = await supabaseAdmin
      .from('cycles')
      .select('*')
      .gte('confidence', 0.6);

    const alerts = [];

    for (const cycle of cycles || []) {
      if (cycle.phase === 'high' || cycle.phase === 'active') {
        alerts.push({
          user_id: userId,
          cycle_id: cycle.id,
          type: 'cycle_phase',
          title: `Ciclo "${cycle.name}" em alta`,
          message: `Baseado na análise do período atual, o ciclo "${cycle.name}" está em fase ${cycle.phase} com ${Math.round(cycle.confidence * 100)}% de confiança.`,
          probability: cycle.confidence,
          horizon: cycle.period_years ? `~${Math.round(cycle.period_years)} anos` : 'variável',
          read: false,
        });
      }
    }

    if (alerts.length > 0) {
      await supabaseAdmin.from('alerts').insert(alerts);
    }
  }
}

export const cycleDetectorService = new CycleDetectorService();