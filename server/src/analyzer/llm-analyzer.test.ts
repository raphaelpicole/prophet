import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeWithLLM, analyzeBatchWithLLM } from './llm-analyzer.js';
import type { ArticleToAnalyze } from './types.js';

describe('LLM Analyzer', () => {
  const mockConfig = {
    apiKey: 'test-key',
    baseURL: 'https://test.api',
    model: 'test-model',
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve usar mock quando não tem API key', async () => {
    const article: ArticleToAnalyze = {
      id: '1',
      title: 'Teste',
      source_id: 'g1',
    };

    const result = await analyzeWithLLM(article, { apiKey: '' });

    expect(result.used_llm).toBe(false);
    expect(result.cycle).toBeDefined();
  });

  it('deve chamar API quando tem key válida', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            summary: 'Resumo teste',
            main_subject: 'Teste',
            cycle: 'politico',
            political_bias: 'centro',
            bias_score: 0,
            sentiment: 'neutro',
            sentiment_score: 0,
            categories: ['teste'],
            entities: [],
            regions: ['Brasil'],
            confidence: 0.9,
          }),
        },
      }],
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const article: ArticleToAnalyze = {
      id: '1',
      title: 'Teste',
      source_id: 'g1',
    };

    const result = await analyzeWithLLM(article, mockConfig);

    expect(result.used_llm).toBe(true);
    expect(fetch).toHaveBeenCalled();
    expect(result.summary).toBe('Resumo teste');
  });

  it('deve fazer fallback para mock em caso de erro', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    const article: ArticleToAnalyze = {
      id: '1',
      title: 'Guerra na Ucrânia',
      source_id: 'g1',
    };

    const result = await analyzeWithLLM(article, mockConfig);

    expect(result.used_llm).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.cycle).toBe('conflito'); // mock detecta guerra
  });

  it('deve validar e normalizar resposta do LLM', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            summary: 'Resumo',
            main_subject: 'Assunto',
            cycle: 'ciclo_invalido', // deve ser normalizado
            political_bias: 'bias_invalido', // deve ser normalizado
            bias_score: 999, // deve ser clamped
            sentiment: 'sentimento_invalido', // deve ser normalizado
            sentiment_score: -999, // deve ser clamped
            confidence: 2.0, // deve ser clamped
          }),
        },
      }],
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const article: ArticleToAnalyze = {
      id: '1',
      title: 'Teste',
      source_id: 'g1',
    };

    const result = await analyzeWithLLM(article, mockConfig);

    expect(result.used_llm).toBe(true);
    expect(result.cycle).toBe('politico'); // fallback
    expect(result.political_bias).toBe('indefinido'); // fallback
    expect(result.bias_score).toBe(1); // clamped
    expect(result.sentiment_score).toBe(-1); // clamped
    expect(result.confidence).toBe(1); // clamped
  });

  it('deve lidar com markdown na resposta', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: '```json\n{"summary": "teste", "cycle": "economico", "political_bias": "centro", "sentiment": "positivo", "categories": ["teste"], "entities": [], "regions": [], "confidence": 0.8}\n```',
        },
      }],
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const article: ArticleToAnalyze = {
      id: '1',
      title: 'Teste',
      source_id: 'g1',
    };

    const result = await analyzeWithLLM(article, mockConfig);

    expect(result.used_llm).toBe(true);
    expect(result.cycle).toBe('economico');
  });

  it('deve processar batch com concorrência controlada', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            summary: 'Resumo',
            cycle: 'politico',
            political_bias: 'centro',
            sentiment: 'neutro',
            categories: [],
            entities: [],
            regions: [],
            confidence: 0.8,
          }),
        },
      }],
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const articles: ArticleToAnalyze[] = [
      { id: '1', title: 'A', source_id: 'g1' },
      { id: '2', title: 'B', source_id: 'folha' },
      { id: '3', title: 'C', source_id: 'uol' },
    ];

    const result = await analyzeBatchWithLLM(articles, mockConfig, 2);

    expect(result.results).toHaveLength(3);
    expect(result.errors).toHaveLength(0);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('deve tentar novamente em caso de erro temporário', async () => {
    let attempts = 0;
    (fetch as any).mockImplementation(() => {
      attempts++;
      if (attempts < 2) {
        return Promise.reject(new Error('Timeout'));
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                summary: 'Resumo',
                cycle: 'politico',
                political_bias: 'centro',
                sentiment: 'neutro',
                categories: [],
                entities: [],
                regions: [],
                confidence: 0.8,
              }),
            },
          }],
        }),
      });
    });

    const article: ArticleToAnalyze = {
      id: '1',
      title: 'Teste',
      source_id: 'g1',
    };

    const result = await analyzeWithLLM(article, { ...mockConfig, maxRetries: 3 });

    expect(result.used_llm).toBe(true);
    expect(attempts).toBe(2);
  });
});
