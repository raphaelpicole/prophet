/**
 * Unified Analyzer — usa o melhor disponível
 * 
 * Ordem de prioridade:
 * 1. Ollama local (se disponível)
 * 2. GLM Cloud (se tem API key)
 * 3. Mock (fallback)
 * 
 * Para usar:
 * - Ollama: certifique-se que está rodando em localhost:11434
 * - GLM: export GLM_API_KEY=sua-chave
 */

import { analyzeWithOllama } from './analyzer/ollama-analyzer.js';
import { analyzeWithGLM } from './analyzer/glm-analyzer.js';
import type { ArticleToAnalyze } from './types.js';
import type { AnalysisResult } from './types.js';

export async function analyze(
  article: ArticleToAnalyze
): Promise<AnalysisResult & { provider: 'ollama' | 'glm' | 'mock' }> {
  // Tenta Ollama primeiro (local, gratuito)
  const ollamaResult = await analyzeWithOllama(article);
  if (ollamaResult.used_ollama) {
    return { ...ollamaResult, provider: 'ollama' };
  }
  
  // Tenta GLM (cloud, precisa de key)
  const glmResult = await analyzeWithGLM(article);
  if (glmResult.used_glm) {
    return { ...glmResult, provider: 'glm' };
  }
  
  // Fallback é mock
  return { ...ollamaResult, provider: 'mock' };
}

// Teste
async function testUnified() {
  console.log('\n🧪 TESTE DO ANALYZER UNIFICADO\n');
  console.log('Verificando provedores disponíveis...\n');
  
  const { isOllamaAvailable } = await import('./analyzer/ollama-analyzer.js');
  const { fetchG1 } = await import('./collectors/g1.js');
  
  const hasOllama = await isOllamaAvailable();
  const hasGLM = !!process.env.GLM_API_KEY;
  
  console.log(`☁️  Ollama (local): ${hasOllama ? '✅ Disponível' : '❌ Indisponível'}`);
  console.log(`🤖 GLM (cloud): ${hasGLM ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`🎭 Mock: ✅ Sempre disponível\n`);
  
  console.log('📡 Coletando notícias do G1...');
  const articles = await fetchG1();
  console.log(`   ✅ ${articles.length} notícias\n`);
  
  console.log('='.repeat(70));
  console.log('🧠 ANALISANDO COM MELHOR PROVEDOR DISPONÍVEL');
  console.log('='.repeat(70) + '\n');
  
  for (const article of articles.slice(0, 3)) {
    const start = Date.now();
    const result = await analyze({
      id: 'test',
      title: article.title,
      source_id: 'g1',
    });
    const duration = Date.now() - start;
    
    const emoji = result.provider === 'ollama' ? '🦙' : result.provider === 'glm' ? '🤖' : '🎭';
    
    console.log(`📰 ${article.title.substring(0, 60)}...`);
    console.log(`   ⏱️  ${duration}ms | ${emoji} ${result.provider.toUpperCase()}`);
    console.log(`   📋 ${result.summary.substring(0, 70)}...`);
    console.log(`   🏷️  ${result.cycle} | ${result.sentiment} | confiança: ${(result.confidence * 100).toFixed(0)}%\n`);
  }
  
  console.log('✅ Teste concluído!\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testUnified().catch(console.error);
}

export { testUnified };
