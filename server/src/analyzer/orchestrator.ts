/**
 * AnalyzerOrchestrator — tenta múltiplos provedores em ordem de prioridade
 * 
 * Ordem: Ollama Cloud (kimi) → Groq → Mock
 * O primeiro que responder vai, os outros são ignorados.
 */

import type { AnalysisResult, ArticleToAnalyze } from './types.js';

export interface AnalyzerResult extends AnalysisResult {
  provider: 'ollama-cloud' | 'groq' | 'mock';
  model_used?: string;
  error?: string;
}

/**
 * Tenta todos os analyzers em cascata até um funcionar
 */
export async function analyzeWithBestAvailable(
  article: ArticleToAnalyze,
  options?: {
    ollamaKey?: string;
    groqKey?: string;
    preferProvider?: 'ollama-cloud' | 'groq';
  }
): Promise<AnalyzerResult> {
  const ollamaKey = options?.ollamaKey || process.env.OLLAMA_API_KEY;
  const groqKey = options?.groqKey || process.env.GROQ_API_KEY;
  const preferProvider = options?.preferProvider || 'ollama-cloud'; // kimi tem mais contexto

  const errors: string[] = [];

  // Função auxiliar para tentar um analyzer
  async function tryAnalyzer(
    name: string,
    fn: () => Promise<any>
  ): Promise<AnalyzerResult | null> {
    try {
      const result = await fn();
      if (result.used_ollama_cloud || result.used_groq || result.used_mock) {
        return {
          ...result,
          provider: result.used_ollama_cloud ? 'ollama-cloud' : result.used_groq ? 'groq' : 'mock',
          error: result.error || undefined,
        };
      }
    } catch (e: any) {
      errors.push(`${name}: ${e.message}`);
    }
    return null;
  }

  // Define ordem baseado na preferência
  const order: Array<'ollama-cloud' | 'groq'> = preferProvider === 'ollama-cloud'
    ? ['ollama-cloud', 'groq']
    : ['groq', 'ollama-cloud'];

  for (const provider of order) {
    if (provider === 'ollama-cloud' && ollamaKey) {
      const { analyzeWithOllamaCloud } = await import('./ollama-cloud-analyzer.js');
      const result = await tryAnalyzer('ollama-cloud', () =>
        analyzeWithOllamaCloud(article, { apiKey: ollamaKey })
      );
      if (result) return result;
    }

    if (provider === 'groq' && groqKey) {
      const { analyzeWithGroq } = await import('./groq-analyzer.js');
      const result = await tryAnalyzer('groq', () =>
        analyzeWithGroq(article, { apiKey: groqKey })
      );
      if (result) return result;
    }
  }

  // Todos falharam → mock
  const { mockAnalyze } = await import('./mock-analyzer.js');
  const mockResult = await mockAnalyze(article);
  return {
    ...mockResult,
    provider: 'mock',
    error: `Todos os analyzers falharam: ${errors.join(' | ')}`,
  };
}

/**
 * Análise em batch com melhor provedor disponível
 */
export async function analyzeBatchBestAvailable(
  articles: ArticleToAnalyze[],
  concurrency: number = 3
): Promise<{
  results: (AnalyzerResult & { article_id: string })[];
  errors: { article_id: string; error: string }[];
}> {
  const results: (AnalyzerResult & { article_id: string })[] = [];
  const errors: { article_id: string; error: string }[] = [];

  // Processa em batches para não sobrecarregar
  for (let i = 0; i < articles.length; i += concurrency) {
    const batch = articles.slice(i, i + concurrency);

    const batchResults = await Promise.allSettled(
      batch.map(article => analyzeWithBestAvailable(article))
    );

    for (let j = 0; j < batchResults.length; j++) {
      const outcome = batchResults[j];
      const article = batch[j];

      if (outcome.status === 'fulfilled') {
        results.push({ ...outcome.value, article_id: article.id });

        if (outcome.value.provider === 'mock' && outcome.value.error) {
          errors.push({ article_id: article.id, error: outcome.value.error });
        }
      } else {
        errors.push({ article_id: article.id, error: outcome.reason?.message || 'Unknown error' });
      }
    }

    // Delay entre batches
    if (i + concurrency < articles.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  return { results, errors };
}