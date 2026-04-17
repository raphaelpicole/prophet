/**
 * Teste de Categorização Real
 * 
 * Analisa notícias reais coletadas e mostra categorização
 */

import { fetchG1 } from './collectors/g1.js';
import { fetchCNN } from './collectors/cnn.js';
import { mockAnalyze } from './analyzer/mock-analyzer.js';

async function testCategorizacao() {
  console.log('\n🧪 TESTE DE CATEGORIZAÇÃO\n');
  
  const allArticles: { title: string; url: string; source_id: string }[] = [];
  
  try {
    console.log('📡 Coletando G1...');
    const g1Articles = await fetchG1();
    allArticles.push(...g1Articles.slice(0, 10).map(a => ({ ...a, source_id: 'g1' })));
    console.log(`   ✅ ${g1Articles.length} notícias`);
  } catch (e: any) {
    console.log(`   ❌ ${e.message}`);
  }
  
  try {
    console.log('📡 Coletando CNN...');
    const cnnArticles = await fetchCNN();
    allArticles.push(...cnnArticles.slice(0, 10).map(a => ({ ...a, source_id: 'cnn' })));
    console.log(`   ✅ ${cnnArticles.length} notícias`);
  } catch (e: any) {
    console.log(`   ❌ ${e.message}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 ANÁLISE DE CATEGORIAS');
  console.log('='.repeat(70) + '\n');
  
  const categorias: Record<string, string[]> = {};
  const ciclos: Record<string, number> = {};
  const sentimentos: Record<string, number> = { positivo: 0, neutro: 0, negativo: 0 };
  
  for (const article of allArticles) {
    const analysis = mockAnalyze({
      id: 'test',
      title: article.title,
      source_id: article.source_id,
    });
    
    // Agrupar por categoria
    const cat = analysis.cycle;
    if (!categorias[cat]) categorias[cat] = [];
    categorias[cat].push(article.title);
    
    // Contar ciclos
    ciclos[cat] = (ciclos[cat] || 0) + 1;
    
    // Contar sentimentos
    sentimentos[analysis.sentiment]++;
  }
  
  // Mostrar distribuição
  console.log('Distribuição por Ciclo:');
  console.log('-'.repeat(40));
  for (const [ciclo, count] of Object.entries(ciclos).sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.round(count / 2));
    console.log(`${ciclo.padEnd(15)} ${count.toString().padStart(2)} ${bar}`);
  }
  
  console.log('\nDistribuição por Sentimento:');
  console.log('-'.repeat(40));
  for (const [sent, count] of Object.entries(sentimentos)) {
    const emoji = sent === 'positivo' ? '😊' : sent === 'negativo' ? '😟' : '😐';
    console.log(`${emoji} ${sent.padEnd(12)} ${count}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📝 AMOSTRAS POR CATEGORIA');
  console.log('='.repeat(70) + '\n');
  
  for (const [ciclo, titulos] of Object.entries(categorias)) {
    if (titulos.length > 0) {
      console.log(`\n${ciclo.toUpperCase()} (${titulos.length} notícias):`);
      console.log('─'.repeat(50));
      titulos.slice(0, 3).forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.substring(0, 60)}...`);
      });
      if (titulos.length > 3) {
        console.log(`  ... e mais ${titulos.length - 3}`);
      }
    }
  }
  
  console.log('\n✅ Teste concluído!\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testCategorizacao().catch(console.error);
}

export { testCategorizacao };
