/**
 * GLM Cloud Analyzer
 * 
 * Usa API da Zhipu (glm-4-flash é gratuito com limites)
 * 
 * Variáveis de ambiente:
 * - GLM_API_KEY=sua-chave
 * 
 * Obter key: https://open.bigmodel.cn
 */

import type { AnalysisResult, ArticleToAnalyze } from './types.js';

interface GLMConfig {
  apiKey: string;
  model: string;
  baseURL: string;
}

const DEFAULT_CONFIG: GLMConfig = {
  apiKey: process.env.GLM_API_KEY || '',
  model: 'glm-4-flash', // modelo gratuito
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
};

const SYSTEM_PROMPT = `Você é um analisador de notícias do Prophet. Analise o título e retorne APENAS um objeto JSON válido.

REGRAS:
1. Responda SEMPRE em português
2. Retorne APENAS o JSON, sem markdown, sem explicações
3. Os campos devem ser preenchidos com base no conteúdo da notícia

Campos obrigatórios:
- summary: resumo em 1-2 frases (máx 200 caracteres)
- main_subject: assunto principal em 3-5 palavras
- cycle: um de [conflito, pandemia, economico, politico, social, tecnologico, ambiental, cultural]
- political_bias: um de [esquerda, centro-esquerda, centro, centro-direita, direita, indefinido]
- bias_score: número entre -1.0 (esquerda) e +1.0 (direita)
- sentiment: um de [positivo, neutro, negativo]
- sentiment_score: número entre -1.0 (negativo) e +1.0 (positivo)
- categories: array de 1-3 strings (tags do assunto)
- entities: array de objetos {name, type: person/org/place, role: protagonista/citado/afetado/opositor}
- regions: array de strings com nomes de regiões
- confidence: número entre 0.0 e 1.0 indicando confiança da análise

Exemplo:
{
  "summary": "Dólar sobe acima de R$ 5,60 devido a tensões geopolíticas",
  "main_subject": "Alta do dólar",
  "cycle": "economico",
  "political_bias": "centro",
  "bias_score": 0.0,
  "sentiment": "negativo",
  "sentiment_score": -0.3,
  "categories": ["economia", "câmbio"],
  "entities": [{"name": "Banco Central", "type": "org", "role": "citado"}],
  "regions": ["Brasil"],
  "confidence": 0.85
}`;

export async function analyzeWithGLM(
  article: ArticleToAnalyze,
  config?: Partial<GLMConfig>
): Promise<AnalysisResult & { used_glm: boolean; error?: string }> {
  const merged = { ...DEFAULT_CONFIG, ...config };
  
  if (!merged.apiKey) {
    const { mockAnalyze } = await import('./mock-analyzer.js');
    return { ...mockAnalyze(article), used_glm: false, error: 'GLM_API_KEY não configurada' };
  }
  
  const prompt = `Título: ${article.title}\n\nConteúdo: ${article.content?.slice(0, 3000) || 'Não disponível'}\n\nFonte: ${article.source_id}\n\nAnalise e retorne o JSON:`;
  
  try {
    const response = await fetch(`${merged.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${merged.apiKey}`,
      },
      body: JSON.stringify({
        model: merged.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Resposta vazia da API');
    }
    
    const parsed = parseGLMResponse(content);
    
    return {
      ...parsed,
      used_glm: true,
    };
    
  } catch (error: any) {
    console.warn(`GLM falhou: ${error.message}, usando mock`);
    const { mockAnalyze } = await import('./mock-analyzer.js');
    return { ...mockAnalyze(article), used_glm: false, error: error.message };
  }
}

function parseGLMResponse(raw: string): AnalysisResult {
  try {
    // Remove markdown se houver
    let jsonStr = raw.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7, -3).trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3, -3).trim();
    }
    
    const parsed = JSON.parse(jsonStr);
    
    return {
      summary: parsed.summary || '',
      main_subject: parsed.main_subject || 'Indefinido',
      cycle: validateCycle(parsed.cycle),
      political_bias: validateBias(parsed.political_bias),
      bias_score: clamp(parsed.bias_score, -1, 1),
      sentiment: validateSentiment(parsed.sentiment),
      sentiment_score: clamp(parsed.sentiment_score, -1, 1),
      categories: parsed.categories || [],
      entities: parsed.entities || [],
      regions: parsed.regions || [],
      confidence: clamp(parsed.confidence, 0, 1),
    };
  } catch (error: any) {
    throw new Error(`Falha ao parsear: ${error.message}`);
  }
}

// Validadores
function validateCycle(cycle: string): AnalysisResult['cycle'] {
  const valid = ['conflito', 'pandemia', 'economico', 'politico', 'social', 'tecnologico', 'ambiental', 'cultural'];
  return valid.includes(cycle) ? cycle as AnalysisResult['cycle'] : 'politico';
}

function validateBias(bias: string): AnalysisResult['political_bias'] {
  const valid = ['esquerda', 'centro-esquerda', 'centro', 'centro-direita', 'direita', 'indefinido'];
  return valid.includes(bias) ? bias as AnalysisResult['political_bias'] : 'indefinido';
}

function validateSentiment(sent: string): AnalysisResult['sentiment'] {
  const valid = ['positivo', 'neutro', 'negativo'];
  return valid.includes(sent) ? sent as AnalysisResult['sentiment'] : 'neutro';
}

function clamp(val: number, min: number, max: number): number {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  return Math.max(min, Math.min(max, val));
}

export async function analyzeBatchWithGLM(
  articles: ArticleToAnalyze[],
  config?: Partial<GLMConfig>,
  concurrency: number = 2
): Promise<{ results: (AnalysisResult & { article_id: string; used_glm: boolean })[]; errors: any[] }> {
  const results: (AnalysisResult & { article_id: string; used_glm: boolean })[] = [];
  const errors: any[] = [];
  
  for (const article of articles) {
    try {
      const result = await analyzeWithGLM(article, config);
      results.push({ ...result, article_id: article.id });
      
      // Delay entre requisições (rate limit)
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      errors.push({ article_id: article.id, error });
    }
  }
  
  return { results, errors };
}
