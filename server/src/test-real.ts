/**
 * Teste REAL — coleta notícias de fontes reais
 * 
 * Executar: npx tsx src/test-real.ts
 * 
 * Este script faz fetch real dos feeds RSS e mostra:
 * - Quantas notícias foram coletadas por fonte
 * - Exemplos de títulos
 * - Deduplicação entre fontes
 * - Análise de categoria (mock)
 */

import { fetchG1, G1_SOURCE_ID } from './collectors/g1.js';
import { fetchFolha, FOLHA_SOURCE_ID } from './collectors/folha.js';
import { fetchUOL, UOL_SOURCE_ID } from './collectors/uol.js';
import { fetchEstadao, ESTADAO_SOURCE_ID } from './collectors/estadao.js';
import { fetchOGlobo, OGLOBO_SOURCE_ID } from './collectors/oglobo.js';
import { fetchBBC, BBC_SOURCE_ID } from './collectors/bbc.js';
import { fetchReuters, REUTERS_SOURCE_ID } from './collectors/reuters.js';
import { fetchCNN, CNN_SOURCE_ID } from './collectors/cnn.js';
import { deduplicateBatch, contentHash } from './dedup/deduplicator.js';
import { mockAnalyze } from './analyzer/mock-analyzer.js';

const SOURCES = [
  { name: 'G1', fetcher: fetchG1, id: G1_SOURCE_ID },
  { name: 'Folha', fetcher: fetchFolha, id: FOLHA_SOURCE_ID },
  { name: 'UOL', fetcher: fetchUOL, id: UOL_SOURCE_ID },
  { name: 'Estadão', fetcher: fetchEstadao, id: ESTADAO_SOURCE_ID },
  { name: 'O Globo', fetcher: fetchOGlobo, id: OGLOBO_SOURCE_ID },
  { name: 'BBC', fetcher: fetchBBC, id: BBC_SOURCE_ID },
  { name: 'Reuters', fetcher: fetchReuters, id: REUTERS_SOURCE_ID },
  { name: 'CNN Brasil', fetcher: fetchCNN, id: CNN_SOURCE_ID },
];

async function testRealCollection() {
  console.log('\n🧪 TESTE REAL DE COLETA\n');
  console.log('Coletando notícias de fontes reais...\n');

  const allArticles: { title: string; url: string; source_id: string; source_name: string }[] = [];
  const results: { source: string; count: number; error?: string; sample?: string[] }[] = [];

  // Coletar de cada fonte
  for (const source of SOURCES) {
    try {
      console.log(`📡 Coletando ${source.name}...`);
      
      const articles = await source.fetcher();
      
      const mapped = articles.map(a => ({
        ...a,
        source_name: source.name,
      }));
      
      allArticles.push(...mapped);
      
      results.push({
        source: source.name,
        count: articles.length,
        sample: articles.slice(0, 3).map(a => a.title),
      });
      
      console.log(`   ✅ ${articles.length} notícias coletadas`);
      
    } catch (err: any) {
      console.log(`   ❌ Erro: ${err.message}`);
      results.push({
        source: source.name,
        count: 0,
        error: err.message,
      });
    }
    
    // Pequeno delay entre requisições (educado)
    await new Promise(r => setTimeout(r, 500));
  }

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA COLETA');
  console.log('='.repeat(60) + '\n');

  let totalCollected = 0;
  let successCount = 0;

  for (const r of results) {
    totalCollected += r.count;
    if (!r.error) successCount++;
    
    console.log(`${r.source.padEnd(15)} ${r.count.toString().padStart(3)} notícias ${r.error ? '(erro)' : '✅'}`);
    
    if (r.sample && r.sample.length > 0) {
      console.log(`  └─ Amostra: "${r.sample[0].substring(0, 60)}..."`);
    }
    if (r.error) {
      console.log(`  └─ Erro: ${r.error.substring(0, 60)}`);
    }
    console.log();
  }

  console.log('='.repeat(60));
  console.log(`Total: ${totalCollected} notícias de ${successCount}/${SOURCES.length} fontes`);
  console.log('='.repeat(60) + '\n');

  // Deduplicação
  if (allArticles.length > 0) {
    console.log('🔍 TESTANDO DEDUPLICAÇÃO\n');
    
    const dedupResult = deduplicateBatch(
      allArticles.map(a => ({ title: a.title, url: a.url })),
      [] // base vazia
    );
    
    console.log(`Notícias únicas: ${dedupResult.newArticles.length}`);
    
    // Análise de amostra
    console.log('\n🧠 ANALISANDO AMOSTRA (mock)\n');
    
    const sample = allArticles.slice(0, 5);
    for (const article of sample) {
      const analysis = mockAnalyze({
        id: 'test',
        title: article.title,
        source_id: article.source_id,
      });
      
      console.log(`📰 ${article.title.substring(0, 50)}...`);
      console.log(`   Fonte: ${article.source_name}`);
      console.log(`   Ciclo: ${analysis.cycle}`);
      console.log(`   Sentimento: ${analysis.sentiment} (${analysis.sentiment_score})`);
      console.log(`   Categorias: ${analysis.categories.join(', ')}`);
      console.log();
    }
  }

  console.log('✅ Teste concluído!\n');
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testRealCollection().catch(console.error);
}

export { testRealCollection };
