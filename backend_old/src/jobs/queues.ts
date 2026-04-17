import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { supabaseAdmin } from '../config/database.js';
import { scraperService } from '../services/scraper.js';
import { analyzerService } from '../services/analyzer.js';
import { cycleDetectorService } from '../services/cycle-detector.js';
import type { ScrapJob, AnalyzeJob, DetectCyclesJob } from '../types/index.js';
import { createHash } from 'crypto';

// ============================================================
// Filas BullMQ
// ============================================================

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const scrapQueue = new Queue<ScrapJob>('scrap', { connection: redis });
export const analyzeQueue = new Queue<AnalyzeJob>('analyze', { connection: redis });
export const cyclesQueue = new Queue<DetectCyclesJob>('cycles', { connection: redis });

// ============================================================
// WORKERS
// ============================================================

// --- Scraper Worker ---
export const scrapWorker = new Worker<ScrapJob>(
  'scrap',
  async (job: Job<ScrapJob>) => {
    const { url, user_id, source_id } = job.data;

    console.log(`[Scrap] Iniciando scrape: ${url}`);

    try {
      // Fetch + parse
      const scraped = await scraperService.scrape(url);

      // Check duplicate by hash
      const { data: existing } = await supabaseAdmin
        .from('articles')
        .select('id')
        .eq('content_hash', scraped.content_hash)
        .single();

      if (existing) {
        console.log(`[Scrap] Artigo já existe: ${existing.id}`);
        return { article_id: existing.id, duplicate: true };
      }

      // Detecta source_id pelo domínio
      let detectedSourceId = source_id;
      if (!detectedSourceId) {
        const { data: source } = await supabaseAdmin
          .from('sources')
          .select('id')
          .eq('domain', scraped.source_domain)
          .single();
        detectedSourceId = source?.id || null;
      }

      // Insere artigo
      const { data: article, error } = await supabaseAdmin
        .from('articles')
        .insert({
          title: scraped.title,
          content: scraped.content,
          content_hash: scraped.content_hash,
          url: scraped.url,
          source_id: detectedSourceId,
          published_at: scraped.published_at,
          lang: scraped.lang,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) throw error;

      console.log(`[Scrap] Artigo criado: ${article.id}`);

      // Enqueue para análise
      await analyzeQueue.add('analyze', {
        article_id: article.id,
        user_id,
      });

      return { article_id: article.id, duplicate: false };
    } catch (err) {
      console.error(`[Scrap] Erro no scrape de ${url}:`, err);
      throw err;
    }
  },
  { connection: redis, concurrency: 3 }
);

// --- Analyzer Worker ---
export const analyzeWorker = new Worker<AnalyzeJob>(
  'analyze',
  async (job: Job<AnalyzeJob>) => {
    const { article_id, user_id, force_reanalyze } = job.data;

    console.log(`[Analyze] Iniciando análise: ${article_id}`);

    try {
      // Atualiza status do artigo
      await supabaseAdmin
        .from('articles')
        .update({ status: 'processing' })
        .eq('id', article_id);

      // Verifica se já tem análise (skip se não for force)
      if (!force_reanalyze) {
        const { data: existing } = await supabaseAdmin
          .from('article_analyses')
          .select('id')
          .eq('article_id', article_id)
          .eq('user_id', user_id)
          .single();

        if (existing) {
          console.log(`[Analyze] Análise já existe para este usuário`);
          return { analysis_id: existing.id };
        }
      }

      // Executa análise via LLM
      const result = await analyzerService.analyzeArticle(job.data);

      // Salva resultado
      const analysisId = await analyzerService.saveAnalysis(article_id, user_id, result);

      console.log(`[Analyze] Análise salva: ${analysisId}`);

      // Enqueue detecção de ciclos
      await cyclesQueue.add('detect_cycles', {
        article_id,
        analysis_id: analysisId,
      });

      return { analysis_id: analysisId };
    } catch (err) {
      console.error(`[Analyze] Erro na análise ${article_id}:`, err);
      await supabaseAdmin
        .from('articles')
        .update({ status: 'pending' })
        .eq('id', article_id);
      throw err;
    }
  },
  { connection: redis, concurrency: 2 }
);

// --- Cycle Detector Worker ---
export const cyclesWorker = new Worker<DetectCyclesJob>(
  'cycles',
  async (job: Job<DetectCyclesJob>) => {
    const { article_id, analysis_id } = job.data;

    console.log(`[Cycles] Detectando ciclos: ${article_id}`);

    try {
      await cycleDetectorService.detectCycles(job.data);
      console.log(`[Cycles] Ciclos detectados para: ${article_id}`);
    } catch (err) {
      console.error(`[Cycles] Erro na detecção ${article_id}:`, err);
      throw err;
    }
  },
  { connection: redis, concurrency: 1 }
);

// ============================================================
// Logs de eventos
// ============================================================

[scrapWorker, analyzeWorker, cyclesWorker].forEach(worker => {
  worker.on('completed', job => {
    console.log(`[${worker.name}] Job ${job.id} completo`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[${worker.name}] Job ${job?.id} falhou:`, err.message);
  });

  worker.on('error', err => {
    console.error(`[${worker.name}] Worker error:`, err);
  });
});