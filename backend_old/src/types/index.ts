import { z } from 'zod';

// ============================================================
// Schemas de Validação (Zod)
// ============================================================

// --- Auth ---
export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

// --- Dashboard ---
export const DashboardQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').optional(),
});

// --- Análise ---
export const AnalyzeInputSchema = z.object({
  url: z.string().url('URL inválida').optional(),
  text: z.string().min(50, 'Texto muito curto para análise').optional(),
}).refine(data => data.url || data.text, {
  message: 'Informe uma URL ou texto',
});

export const AnalyzeTextSchema = z.object({
  text: z.string().min(50, 'Texto muito curto para análise'),
});

// --- Compare ---
export const CompareQuerySchema = z.object({
  subject: z.string().optional(),
  sources: z.string().optional(), // comma-separated UUIDs
  period: z.string().optional(),
  category: z.enum(['ideologico', 'economico', 'geopolitico', 'social', 'framing', 'emocional', 'temporal', 'authority']).optional(),
});

// --- History ---
export const HistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  source: z.string().uuid().optional(),
  category: z.string().optional(),
  subject: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort: z.enum(['recent', 'score', 'source']).default('recent'),
  favorites_only: z.coerce.boolean().default(false),
});

// --- Alerts ---
export const AlertsQuerySchema = z.object({
  unread_only: z.coerce.boolean().default(false),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================================
// Types derivados dos schemas
// ============================================================

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;
export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;
export type CompareQuery = z.infer<typeof CompareQuerySchema>;
export type HistoryQuery = z.infer<typeof HistoryQuerySchema>;
export type AlertsQuery = z.infer<typeof AlertsQuerySchema>;

// ============================================================
// Types internos do banco
// ============================================================

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  plan: 'free' | 'pro' | 'intelligence' | 'enterprise';
  analyses_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbSource {
  id: string;
  name: string;
  domain: string;
  bias_historic: BiasHistoric;
  reliability_score: number;
  flags: SourceFlags;
}

export interface DbArticle {
  id: string;
  title: string;
  content: string;
  content_hash: string;
  source_id: string | null;
  author_id: string | null;
  url: string | null;
  published_at: string | null;
  lang: string;
  status: 'pending' | 'processing' | 'analyzed' | 'archived';
  created_at: string;
}

export interface DbArticleAnalysis {
  id: string;
  article_id: string;
  user_id: string;
  overall_bias_score: number;
  bias_by_category: BiasByCategory;
  indicators: Indicator[];
  llm_explanation: string | null;
  created_at: string;
}

export interface DbCycle {
  id: string;
  name: string;
  period_years: number | null;
  phase: string | null;
  description: string | null;
  current_position: number;
  confidence: number;
}

export interface DbHistoricalEvent {
  id: string;
  title: string;
  description: string | null;
  date_start: string | null;
  date_end: string | null;
  subject_ids: string[] | null;
  region_ids: string[] | null;
  character_ids: string[] | null;
  embedding: number[] | null;
  similarity?: number; // returned from RPC
}

// ============================================================
// Types de domínio
// ============================================================

export type BiasCategory = 'ideologico' | 'economico' | 'geopolitico' | 'social' | 'framing' | 'emocional' | 'temporal' | 'authority';

export type BiasHistoric = Partial<Record<BiasCategory, number | null>>;

export interface BiasByCategory {
  [key: string]: { score: number; trend: 'up' | 'down' | 'stable' };
}

export interface Indicator {
  type: 'warning' | 'positive' | 'info';
  text: string;
  category?: BiasCategory;
}

export interface SourceFlags {
  blacklist?: boolean;
  paywall?: boolean;
  satire?: boolean;
  known_fake?: boolean;
  political_affiliation?: string;
}

// ============================================================
// Tipos de resposta da API
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardData {
  period: { from: string; to: string };
  stats: {
    total_analyses: number;
    unique_sources: number;
    unique_subjects: number;
    regions_involved: number;
  };
  bias_by_category: Array<{
    category: string;
    score_avg: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  top_sources: Array<{
    source: string;
    count: number;
    avg_bias: number;
  }>;
  active_cycles: Array<{
    id: string;
    name: string;
    phase: string;
    confidence: number;
    description: string | null;
  }>;
  top_subjects: Array<{
    id: string;
    name: string;
    count: number;
    related_cycles: string[];
  }>;
  cycle_alerts: Array<{
    id: string;
    cycle: string;
    probability: number;
    event: string;
    horizon: string;
  }>;
  recent_articles: Array<{
    id: string;
    title: string;
    source: string;
    score: number;
    published_at: string | null;
  }>;
}

export interface AnalysisResult {
  id: string;
  article_id: string;
  title: string;
  url: string | null;
  source: string | null;
  published_at: string | null;
  overall_bias_score: number;
  bias_by_category: BiasByCategory;
  indicators: Indicator[];
  llm_explanation: string;
  cycles: Array<{
    id: string;
    name: string;
    similarity: number;
    phase: string;
  }>;
  historical_events: Array<{
    id: string;
    title: string;
    description: string | null;
    date_start: string | null;
    similarity: number;
  }>;
  subjects: Array<{ id: string; name: string; slug: string }>;
  regions: Array<{ id: string; name: string; code: string | null }>;
  characters: Array<{ id: string; name: string; role: string | null }>;
  created_at: string;
}

// ============================================================
// Tipos de Job (BullMQ)
// ============================================================

export interface ScrapJob {
  url: string;
  user_id: string;
  source_id?: string;
}

export interface AnalyzeJob {
  article_id: string;
  user_id: string;
  force_reanalyze?: boolean;
}

export interface DetectCyclesJob {
  article_id: string;
  analysis_id: string;
}

export interface GenerateAlertJob {
  cycle_id: string;
  user_id?: string; // se null, gera para todos os usuários
}