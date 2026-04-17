import type { AnalysisResult, ArticleToAnalyze } from './types.js';

/**
 * Analyzer mock — simula resposta do LLM para testes locais.
 * Não faz chamada HTTP, retorna dados determinísticos baseados no título.
 * 
 * Útil para:
 * - Testar o pipeline sem gastar tokens
 * - Desenvolver offline
 * - Criar fixtures de teste
 */

export function mockAnalyze(article: ArticleToAnalyze): AnalysisResult {
  const title = article.title.toLowerCase();
  
  // Regras simples baseadas em palavras-chave no título
  const hasKeywords = (words: string[]) => words.some(w => title.includes(w));
  
  // Detectar ciclo
  let cycle: AnalysisResult['cycle'] = 'politico';
  if (hasKeywords(['guerra', 'ataque', 'ofensiva', 'míssil', 'ucrânia', 'rússia', 'israel', 'hamas'])) {
    cycle = 'conflito';
  } else if (hasKeywords(['covid', 'pandemia', 'vacina', 'dengue', 'vírus'])) {
    cycle = 'pandemia';
  } else if (hasKeywords(['dólar', 'economia', 'inflação', 'juros', 'bc', 'mercado'])) {
    cycle = 'economico';
  } else if (hasKeywords(['ia', 'inteligência artificial', 'tecnologia', 'chatgpt', 'google'])) {
    cycle = 'tecnologico';
  } else if (hasKeywords(['clima', 'aquecimento', 'amazônia', 'amazonia', 'meio ambiente', 'petróleo', 'desmatamento'])) {
    cycle = 'ambiental';
  }

  // Detectar sentimento
  let sentiment: AnalysisResult['sentiment'] = 'neutro';
  let sentimentScore = 0;
  if (hasKeywords(['crise', 'queda', 'ataque', 'morte', 'trágico', 'preocupação', 'recorde negativo'])) {
    sentiment = 'negativo';
    sentimentScore = -0.6;
  } else if (hasKeywords(['avanço', 'sucesso', 'cresce', 'recorde', 'vitória', 'aprova'])) {
    sentiment = 'positivo';
    sentimentScore = 0.5;
  }

  // Viés (mock — na prática o LLM decide)
  const biasMap: Record<string, AnalysisResult['political_bias']> = {
    'folha': 'centro-esquerda',
    'g1': 'centro-esquerda',
    'estadao': 'centro-direita',
    'oglobo': 'centro-direita',
  };
  const political_bias = biasMap[article.source_id] || 'centro';
  const bias_score = political_bias === 'esquerda' ? -0.7 : 
                     political_bias === 'centro-esquerda' ? -0.3 :
                     political_bias === 'centro' ? 0 :
                     political_bias === 'centro-direita' ? 0.3 : 0.7;

  // Extrair entidades simples (nomes próprios em maiúsculo)
  const entities: AnalysisResult['entities'] = [];
  const properNouns = title.match(/[A-ZÀ-Ú][a-zà-ú]+/g) || [];
  const uniqueNouns = [...new Set(properNouns)];
  
  for (const noun of uniqueNouns.slice(0, 3)) {
    entities.push({
      name: noun,
      type: 'person',
      role: 'citado',
    });
  }

  // Regiões (mock simples)
  const regions: string[] = [];
  if (hasKeywords(['brasil', 'são paulo', 'rio'])) regions.push('América do Sul');
  if (hasKeywords(['eua', 'estados unidos', 'nova york'])) regions.push('América do Norte');
  if (hasKeywords(['europa', 'ucrânia', 'alemanha'])) regions.push('Europa');
  if (hasKeywords(['china', 'japão', 'ásia'])) regions.push('Ásia');
  if (regions.length === 0) regions.push('Global');

  return {
    summary: `Resumo gerado para: ${article.title}`,
    main_subject: article.title.split(' ').slice(0, 4).join(' '),
    cycle,
    political_bias,
    bias_score,
    sentiment,
    sentiment_score: sentimentScore,
    categories: [cycle],
    entities,
    regions,
    confidence: 0.75,
  };
}

/**
 * Batch process — analisa múltiplos artigos.
 */
export async function mockAnalyzeBatch(articles: ArticleToAnalyze[]): Promise<{ results: (AnalysisResult & { article_id: string })[]; errors: { article_id: string; error: string }[] }> {
  const results: (AnalysisResult & { article_id: string })[] = [];
  const errors: { article_id: string; error: string }[] = [];

  for (const article of articles) {
    try {
      const result = mockAnalyze(article);
      results.push({ ...result, article_id: article.id });
    } catch (err) {
      errors.push({ article_id: article.id, error: String(err) });
    }
  }

  return { results, errors };
}
