/**
 * Groq Cloud Analyzer
 * 
 * Modelos disponíveis:
 * - llama-3.3-70b-versatile (melhor qualidade)
 * - llama-3.1-8b-instant (mais rápido)
 * - mixtral-8x7b-32768 (bom custo-benefício)
 * 
 * API: https://console.groq.com
 * Docs: https://console.groq.com/docs
 */

import type { AnalysisResult, ArticleToAnalyze } from './types.js';

interface GroqConfig {
  apiKey: string;
  model: string;
  baseURL: string;
}

const DEFAULT_CONFIG: GroqConfig = {
  apiKey: process.env.GROQ_API_KEY || '',
  model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  baseURL: 'https://api.groq.com/openai/v1',
};

const SYSTEM_PROMPT = `Você é um analisador de notícias do Prophet. Analise o título e conteúdo e retorne APENAS um objeto JSON válido.

REGRAS:
1. Responda SEMPRE em português do Brasil
2. Retorne APENAS o JSON, sem markdown, sem explicações extras
3. Seja objetivo e imparcial na análise

Campos obrigatórios:
- summary: resumo em 1-2 frases (máximo 200 caracteres)
- main_subject: assunto principal em 3-5 palavras
- cycle: um de [conflito, pandemia, economico, politico, social, tecnologico, ambiental, cultural]
- political_bias: um de [esquerda, centro-esquerda, centro, centro-direita, direita, indefinido]
- bias_score: número entre -1.0 (esquerda) a +1.0 (direita), 0 = neutro
- sentiment: um de [positivo, neutro, negativo]
- sentiment_score: número entre -1.0 (negativo) a +1.0 (positivo)
- categories: array de 1-3 strings (tags do assunto)
- entities: array de objetos {name, type: person/org/place, role: protagonista/citado/afetado/opositor}
- regions: array de nomes de regiões geográficas
- confidence: número entre 0.0 e 1.0 indicando confiança da análise

Exemplo de resposta válida:
{
  "summary": "Dólar sobe acima de R$ 5,60 devido a tensões geopolíticas no Oriente Médio",
  "main_subject": "Alta do dólar",
  "cycle": "economico",
  "political_bias": "centro",
  "bias_score": 0.0,
  "sentiment": "negativo",
  "sentiment_score": -0.3,
  "categories": ["economia", "câmbio", "mercado financeiro"],
  "entities": [{"name": "Banco Central", "type": "org", "role": "citado"}],
  "regions": ["Brasil", "América do Sul", "Oriente Médio"],
  "confidence": 0.85
}`;

export async function analyzeWithGroq(
  article: ArticleToAnalyze,
  config?: Partial<GroqConfig>
): Promise<AnalysisResult & { used_groq: boolean; error?: string; tokens_used?: number }> {
  const merged = { ...DEFAULT_CONFIG, ...config };
  
  // Verifica se tem API key
  if (!merged.apiKey) {
    return { 
      ...await import('./mock-analyzer.js').then(m => m.mockAnalyze(article)),
      used_groq: false, 
      error: 'GROQ_API_KEY não configurada' 
    };
  }
  
  const prompt = `Analise esta notícia:

TÍTULO: ${article.title}

CONTEÚDO: ${article.content?.slice(0, 3000) || 'Não disponível'}

FONTE: ${article.source_id}

Retorne o JSON com a análise:`;
  
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
        response_format: { type: 'json_object' },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const tokens_used = data.usage?.total_tokens || 0;
    
    if (!content) {
      throw new Error('Resposta vazia da API Groq');
    }
    
    const parsed = parseGroqResponse(content);
    
    return {
      ...parsed,
      used_groq: true,
      tokens_used,
    };
    
  } catch (error: any) {
    console.warn(`Groq falhou: ${error.message}`);
    const { mockAnalyze } = await import('./mock-analyzer.js');
    return { 
      ...mockAnalyze(article), 
      used_groq: false, 
      error: error.message 
    };
  }
}

function parseGroqResponse(raw: string): AnalysisResult {
  try {
    // Remove possíveis code blocks markdown
    let jsonStr = raw.trim();
    
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7, -3).trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3, -3).trim();
    }
    
    // Procura por objeto JSON
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const parsed = JSON.parse(jsonStr);
    
    return {
      summary: parsed.summary || 'Resumo não disponível',
      main_subject: parsed.main_subject || 'Indefinido',
      cycle: validateCycle(parsed.cycle),
      political_bias: validateBias(parsed.political_bias),
      bias_score: clamp(parsed.bias_score, -1, 1),
      sentiment: validateSentiment(parsed.sentiment),
      sentiment_score: clamp(parsed.sentiment_score, -1, 1),
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      regions: Array.isArray(parsed.regions) ? parsed.regions : [],
      confidence: clamp(parsed.confidence, 0, 1),
    };
  } catch (error: any) {
    console.error('Falha ao parsear resposta Groq:', raw.substring(0, 200));
    throw new Error(`Parse error: ${error.message}`);
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

/**
 * Testa o analyzer Groq
 */
export async function testGroq() {
  console.log('\n🧪 TESTE DO GROQ ANALYZER\n');
  
  if (!process.env.GROQ_API_KEY) {
    console.log('❌ GROQ_API_KEY não configurada');
    console.log('Crie uma conta em https://console.groq.com e obtenha uma API key');
    console.log('Depois execute: GROQ_API_KEY=sua-key npx tsx src/analyzer/groq-analyzer.ts\n');
    return;
  }
  
  const { fetchG1 } = await import('../collectors/g1.js');
  
  console.log('📡 Coletando notícias do G1...');
  const articles = await fetchG1();
  console.log(`   ✅ ${articles.length} notícias\n`);
  
  console.log('='.repeat(70));
  console.log('🧠 ANALISANDO COM GROQ');
  console.log('='.repeat(70) + '\n');
  
  for (const article of articles.slice(0, 3)) {
    console.log(`📰 ${article.title.substring(0, 60)}...`);
    
    const start = Date.now();
    const result = await analyzeWithGroq({
      id: 'test',
      title: article.title,
      source_id: 'g1',
    });
    const duration = Date.now() - start;
    
    console.log(`   ⏱️  ${duration}ms | ${result.used_groq ? '⚡ GROQ' : '🎭 Mock'}`);
    console.log(`   📋 ${result.summary.substring(0, 70)}...`);
    console.log(`   🏷️  Ciclo: ${result.cycle} | Viés: ${result.political_bias}`);
    console.log(`   😊 Sentimento: ${result.sentiment} | Confiança: ${(result.confidence * 100).toFixed(0)}%`);
    
    if (result.tokens_used) {
      console.log(`   🪙 Tokens usados: ${result.tokens_used}`);
    }
    
    if (result.error) {
      console.log(`   ⚠️  Erro: ${result.error}`);
    }
    console.log();
    
    // Pequeno delay entre requisições
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('✅ Teste concluído!\n');
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testGroq().catch(console.error);
}
