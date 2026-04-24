/**
 * Teste do Analyzer com Ollama Cloud
 *
 * Configure a URL do seu Ollama Cloud:
 * OLLAMA_URL=https://seu-ollama-cloud.com npx tsx src/test-ollama-cloud.ts
 */
import { analyzeWithOllama, isOllamaAvailable, listOllamaModels } from './analyzer/ollama-analyzer.js';
import { fetchG1 } from './collectors/g1.js';
async function testOllamaCloud() {
    console.log('\n🧪 TESTE DO ANALYZER COM OLLAMA CLOUD\n');
    const cloudUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    console.log(`🔗 URL: ${cloudUrl}`);
    // Verificar disponibilidade
    console.log('🔍 Verificando Ollama...');
    const available = await isOllamaAvailable({ baseURL: cloudUrl });
    if (!available) {
        console.log('❌ Ollama não respondeu');
        console.log('\nDicas:');
        console.log('- Verifique se a URL está correta');
        console.log('- Certifique-se de que a API está acessível');
        console.log('- Alguns clouds precisam de autenticação (token)');
        return;
    }
    console.log('✅ Ollama Cloud disponível!');
    const models = await listOllamaModels({ baseURL: cloudUrl });
    console.log(`   Modelos: ${models.join(', ') || 'nenhum'}`);
    if (models.length === 0) {
        console.log('\n⚠️  Nenhum modelo encontrado');
        return;
    }
    // Coletar notícias
    console.log('\n📡 Coletando notícias do G1...');
    const articles = await fetchG1();
    console.log(`   ✅ ${articles.length} notícias\n`);
    // Analisar amostra
    const sample = articles.slice(0, 3);
    console.log('='.repeat(70));
    console.log('🧠 ANALISANDO COM OLLAMA CLOUD');
    console.log('='.repeat(70) + '\n');
    for (const article of sample) {
        console.log(`📰 ${article.title.substring(0, 60)}...`);
        const start = Date.now();
        const analysis = await analyzeWithOllama({ id: 'test', title: article.title, source_id: 'g1' }, { baseURL: cloudUrl });
        const duration = Date.now() - start;
        console.log(`   ⏱️  ${duration}ms | ${analysis.used_ollama ? '☁️  Cloud' : '🎭 Mock'}`);
        console.log(`   📋 Resumo: ${analysis.summary.substring(0, 70)}...`);
        console.log(`   🏷️  Ciclo: ${analysis.cycle}`);
        console.log(`   ⚖️  Viés: ${analysis.political_bias} (${analysis.bias_score})`);
        console.log(`   😊 Sentimento: ${analysis.sentiment} (${analysis.sentiment_score})`);
        console.log(`   📂 Categorias: ${analysis.categories.join(', ')}`);
        console.log(`   👤 Entidades: ${analysis.entities.map(e => e.name).join(', ') || 'N/A'}`);
        console.log(`   🌍 Regiões: ${analysis.regions.join(', ') || 'N/A'}`);
        console.log(`   ✅ Confiança: ${(analysis.confidence * 100).toFixed(0)}%`);
        if (analysis.error) {
            console.log(`   ⚠️  Erro: ${analysis.error}`);
        }
        console.log();
    }
    console.log('✅ Teste concluído!\n');
}
if (import.meta.url === `file://${process.argv[1]}`) {
    testOllamaCloud().catch(console.error);
}
export { testOllamaCloud };
