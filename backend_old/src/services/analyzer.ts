import OpenAI from 'openai';
import { supabaseAdmin } from '../config/database.js';
import type {
  BiasByCategory,
  Indicator,
  BiasCategory,
  DbArticle,
  DbSource,
  AnalyzeJob,
} from '../types/index.js';

// ============================================================
// Analyzer Service — análise de viés via LLM
// ============================================================

export class AnalyzerService {
  private openai: OpenAI;
  private model = process.env.LLM_MODEL || 'gpt-4o-mini';

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Analisa uma artigo (texto) nas 8 categorias de viés.
   * Retorna scores, indicadores e explicação.
   */
  async analyzeArticle(job: AnalyzeJob): Promise<{
    overall_bias_score: number;
    bias_by_category: BiasByCategory;
    indicators: Indicator[];
    llm_explanation: string;
  }> {
    // Busca o artigo
    const { data: article, error: articleErr } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('id', job.article_id)
      .single();

    if (articleErr || !article) {
      throw new Error(`Artigo não encontrado: ${job.article_id}`);
    }

    const text = `[TITLE]\n${article.title}\n\n[CONTENT]\n${article.content}`;

    // Busca bias_histórico da fonte (se existir)
    let sourceBias = null;
    if (article.source_id) {
      const { data: source } = await supabaseAdmin
        .from('sources')
        .select('bias_historic')
        .eq('id', article.source_id)
        .single();
      sourceBias = source?.bias_historic;
    }

    // Constrói o prompt
    const prompt = this.buildPrompt(text, sourceBias);

    // Chama o LLM
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `Você é um assistente de análise de viés midiático experto.
Você analisa matérias jornalísticas em 8 dimensões de viés.
Cada dimensão recebe um score de 0.0 a 1.0:
- 0.0 = extremo esquerda / totalmente favoraveil a intervenção / muito progressista
- 0.5 = neutro / centro
- 1.0 = extremo direita / totalmente favoraveil a mercado livre / muito conservador

Retorne STRICTAMENTE um objeto JSON com este formato (SEM markdown, SEM texto adicional):
{
  "overall_bias_score": 0.52,
  "bias_by_category": {
    "ideologico": {"score": 0.62, "trend": "up"},
    "economico": {"score": 0.45, "trend": "stable"},
    "geopolitico": {"score": 0.71, "trend": "up"},
    "social": {"score": 0.39, "trend": "down"},
    "framing": {"score": 0.58, "trend": "stable"},
    "emocional": {"score": 0.81, "trend": "up"},
    "temporal": {"score": 0.66, "trend": "up"},
    "authority": {"score": 0.51, "trend": "stable"}
  },
  "indicators": [
    {"type": "warning", "text": "Usa termos militares sem aspas", "category": "geopolitico"},
    {"type": "warning", "text": "Omite baixas civis do lado ruso", "category": "geopolitico"},
    {"type": "positive", "text": "Cita fontes oficiais (Pentágono, NATO)", "category": "authority"},
    {"type": "info", "text": "Enquadramento equilibrado na maior parte do texto", "category": "framing"}
  ],
  "llm_explanation": "Explicação em 2-3 frases sobre o viés predominante e o porquê dos scores."
}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.0,
      max_tokens: 2048,
    });

    const raw = response.choices[0]?.message?.content || '{}';

    // Parse do JSON com fallback robusto
    let analysis;
    try {
      // Limpa markdown code blocks se houver
      const clean = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      analysis = JSON.parse(clean);
    } catch {
      // Fallback: scores neutros em caso de erro no parse
      console.error('[Analyzer] Falha no parse do LLM, usando fallback neutro');
      analysis = this.fallbackAnalysis();
    }

    return {
      overall_bias_score: analysis.overall_bias_score ?? 0.5,
      bias_by_category: analysis.bias_by_category ?? this.fallbackBiasByCategory(),
      indicators: analysis.indicators ?? [],
      llm_explanation: analysis.llm_explanation ?? 'Análise não disponível.',
    };
  }

  /**
   * Salva a análise no banco (article_analyses + article_categories)
   */
  async saveAnalysis(
    articleId: string,
    userId: string,
    result: ReturnType<typeof this.analyzeArticle> extends Promise<infer T> ? T : never
  ): Promise<string> {
    // Insere article_analyses
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('article_analyses')
      .insert({
        article_id: articleId,
        user_id: userId,
        overall_bias_score: result.overall_bias_score,
        bias_by_category: result.bias_by_category,
        indicators: result.indicators,
        llm_explanation: result.llm_explanation,
      })
      .select('id')
      .single();

    if (analysisError) throw analysisError;

    // Insere article_categories (uma linha por categoria)
    const categories = await supabaseAdmin
      .from('categories')
      .select('id, key')
      .order('display_order');

    if (categories.data) {
      const categoryRows = Object.entries(result.bias_by_category).map(([key, data]) => {
        const cat = categories.data!.find(c => c.key === key);
        if (!cat) return null;
        return {
          analysis_id: analysis.id,
          category_id: cat.id,
          score: data.score,
          indicators: result.indicators.filter(i => i.category === key),
          explanation: null,
        };
      }).filter(Boolean);

      await supabaseAdmin.from('article_categories').insert(categoryRows as any[]);
    }

    // Atualiza status do artigo
    await supabaseAdmin
      .from('articles')
      .update({ status: 'analyzed' })
      .eq('id', articleId);

    return analysis.id;
  }

  // ---- Private helpers ----

  private buildPrompt(text: string, sourceBias: Record<string, unknown> | null): string {
    let biasContext = '';
    if (sourceBias) {
      const biases = Object.entries(sourceBias)
        .filter(([_, v]) => v !== null)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      biasContext = `\n\n[VIÉS HISTÓRICO DA FONTE]\nMédias históricas desta fonte: ${biases}\nConsidere este contexto ao avaliar o viés.`;
    }

    return `Analise a seguinte matéria jornalística:${biasContext}

[TEXTO DA MATÉRIA]
${text.substring(0, 12000)}

Responda apenas com o objeto JSON.`;
  }

  private fallbackAnalysis() {
    return {
      overall_bias_score: 0.5,
      bias_by_category: this.fallbackBiasByCategory(),
      indicators: [{ type: 'info', text: 'Análise padrão (parse falhou)', category: 'framing' }],
      llm_explanation: 'Não foi possível gerar a explicação completa.',
    };
  }

  private fallbackBiasByCategory(): BiasByCategory {
    const cats: BiasCategory[] = ['ideologico', 'economico', 'geopolitico', 'social', 'framing', 'emocional', 'temporal', 'authority'];
    const result: BiasByCategory = {};
    for (const cat of cats) {
      result[cat] = { score: 0.5, trend: 'stable' };
    }
    return result;
  }
}

export const analyzerService = new AnalyzerService();