/**
 * Teste do Analyzer Real
 * 
 * Executar: LLM_API_KEY=sua-chave npx tsx src/test-analyzer.ts
 * Ou sem key (usa mock): npx tsx src/test-analyzer.ts
 */

import { analyzeWithLLM, analyzeBatchWithLLM } from './analyzer/llm-analyzer.js';
import { fetchG1 } from './collectors/g1.js';

async function testAnalyzer() {
  console.log('\n🧪 TESTE DO ANALYZER\n');
  
  const hasApiKey = !!process.env.LLM_API_KEY;
  
  if (hasApiKey) {
    console.log('✅ Usando LLM real (GLM/OpenAI)');
    console.log(`   Modelo: ${process.env.LLM_MODEL || 'glm-4-flash'}`);
  } else {
    console.log('⚠️  Usando MOCK (sem LLM_API_KEY)');
    console.log('   Para testar com LLM real, execute:');
    console.log('   LLM_API_KEY=sua-chave npx tsx src/test-analyzer.ts\n');
  }
  
  // Coletar algumas notícias
  console.log('📡 Coletando notícias do G1...');
  const articles = await fetchG1();
  console.log(`   ✅ ${articles.length} notícias coletadas\n`);
  
  // Selecionar amostra diversificada
  const sample = articles.slice(0, 5);
  
  console.log('='.repeat(70));
  console.log('🧠 ANALISANDO NOTÍCIAS');
  console.log('='.repeat(70) + '\n');
  
  for (const article of sample) {
    console.log(`📰 ${article.title.substring(0, 60)}...`);
    
    const start = Date.now();
    const analysis = await analyzeWithLLM({
      id: 'test',
      title: article.title,
      source_id: 'g1',
    });
    const duration = Date.now() - start;
    
    console.log(`   ⏱️  ${duration}ms | ${analysis.used_llm ? '🤖 LLM' : '🎭 Mock'}`);
    console.log(`   📋 Resumo: ${analysis.summary.substring(0, 80)}...`);
    console.log(`   🏷️  Ciclo: ${analysis.cycle}`);
    console.log(`   🎯 Assunto: ${analysis.main_subject}`);
    console.log(`   ⚖️  Viés: ${analysis.political_bias} (${analysis.bias_score})`);
    console.log(`   😊 Sentimento: ${analysis.sentiment} (${analysis.sentiment_score})`);
    console.log(`   📂 Categorias: ${analysis.categories.join(', ')}`);
    console.log(`   🌍 Regiões: ${analysis.regions.join(', ') || 'N/A'}`);
    console.log(`   👤 Entidades: ${analysis.entities.map(e => e.name).join(', ') || 'N/A'}`);
    console.log(`   ✅ Confiança: ${(analysis.confidence * 100).toFixed(0)}%`);
    
    if (analysis.error) {
      console.log(`   ⚠️  Erro: ${analysis.error}`);
    }
    
    console.log();
  }
  
  // Teste de batch
  console.log('='.repeat(70));
  console.log('📊 TESTE EM BATCH');
  console.log('='.repeat(70) + '\n');
  
  const batchSample = articles.slice(5, 8).map((a, i) => ({
    id: String(i),
    title: a.title,
    source_id: 'g1',
  }));
  
  const start = Date.now();
  const batchResult = await analyzeBatchWithLLM(batchSample, undefined, 2);
  const duration = Date.now() - start;
  
  console.log(`✅ ${batchResult.results.length} análises em ${duration}ms`);
  console.log(`   LLM: ${batchResult.results.filter(r => r.used_llm).length}`);
  console.log(`   Mock: ${batchResult.results.filter(r => !r.used_llm).length}`);
  console.log(`   Erros: ${batchResult.errors.length}`);
  
  if (batchResult.errors.length > 0) {
    batchResult.errors.forEach(e => console.log(`   - ${e.article_id}: ${e.error}`));
  }
  
  console.log('\n✅ Teste concluído!\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testAnalyzer().catch(console.error);
}

export { testAnalyzer };
