/**
 * Teste do Analyzer com Ollama
 *
 * Requisitos:
 * 1. Instalar Ollama: https://ollama.com
 * 2. Baixar modelo: ollama pull llama3.2
 * 3. Garantir que está rodando: ollama serve
 *
 * Executar: npx tsx src/test-ollama.ts
 */
import { analyzeWithOllama, analyzeBatchWithOllama, isOllamaAvailable, listOllamaModels } from './analyzer/ollama-analyzer.js';
import { fetchG1 } from './collectors/g1.js';
async function testOllama() {
    console.log('\n🧪 TESTE DO ANALYZER COM OLLAMA\n');
    // Verificar disponibilidade
    console.log('🔍 Verificando Ollama...');
    const available = await isOllamaAvailable();
    if (!available) {
        console.log('❌ Ollama não está disponível');
        console.log('\nPara usar Ollama:');
        console.log('1. Instale: https://ollama.com');
        console.log('2. Baixe um modelo: ollama pull llama3.2');
        console.log('3. Inicie: ollama serve');
        console.log('\nUsando fallback (mock)...\n');
    }
    else {
        console.log('✅ Ollama disponível!');
        const models = await listOllamaModels();
        console.log(`   Modelos instalados: ${models.join(', ') || 'nenhum'}`);
        if (models.length === 0) {
            console.log('\n⚠️  Nenhum modelo encontrado. Execute:');
            console.log('   ollama pull llama3.2');
            console.log('\nUsando fallback (mock)...\n');
        }
    }
    // Coletar notícias
    console.log('📡 Coletando notícias do G1...');
    const articles = await fetchG1();
    console.log(`   ✅ ${articles.length} notícias\n`);
    // Selecionar amostra
    const sample = articles.slice(0, 3);
    console.log('='.repeat(70));
    console.log('🧠 ANALISANDO COM OLLAMA');
    console.log('='.repeat(70) + '\n');
    for (const article of sample) {
        console.log(`📰 ${article.title.substring(0, 60)}...`);
        const start = Date.now();
        const analysis = await analyzeWithOllama({
            id: 'test',
            title: article.title,
            source_id: 'g1',
        });
        const duration = Date.now() - start;
        console.log(`   ⏱️  ${duration}ms | ${analysis.used_ollama ? '🦙 Ollama' : '🎭 Mock'}`);
        console.log(`   📋 Resumo: ${analysis.summary.substring(0, 60)}...`);
        console.log(`   🏷️  Ciclo: ${analysis.cycle}`);
        console.log(`   ⚖️  Viés: ${analysis.political_bias}`);
        console.log(`   😊 Sentimento: ${analysis.sentiment}`);
        console.log(`   📂 Categorias: ${analysis.categories.join(', ')}`);
        console.log(`   ✅ Confiança: ${(analysis.confidence * 100).toFixed(0)}%`);
        if (analysis.error) {
            console.log(`   ⚠️  Erro: ${analysis.error}`);
        }
        console.log();
    }
    // Teste batch
    console.log('='.repeat(70));
    console.log('📊 TESTE EM BATCH');
    console.log('='.repeat(70) + '\n');
    const batchSample = articles.slice(3, 6).map((a, i) => ({
        id: String(i),
        title: a.title,
        source_id: 'g1',
    }));
    const start = Date.now();
    const batchResult = await analyzeBatchWithOllama(batchSample, undefined, 1);
    const duration = Date.now() - start;
    console.log(`✅ ${batchResult.results.length} análises em ${duration}ms`);
    console.log(`   Ollama: ${batchResult.results.filter(r => r.used_ollama).length}`);
    console.log(`   Mock: ${batchResult.results.filter(r => !r.used_ollama).length}`);
    if (batchResult.errors.length > 0) {
        console.log(`   Erros: ${batchResult.errors.length}`);
        batchResult.errors.forEach(e => console.log(`   - ${e.error}`));
    }
    console.log('\n✅ Teste concluído!\n');
}
if (import.meta.url === `file://${process.argv[1]}`) {
    testOllama().catch(console.error);
}
export { testOllama };
