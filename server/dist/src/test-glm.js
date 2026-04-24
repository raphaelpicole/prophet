/**
 * Teste do Analyzer GLM-4
 *
 * Requer GLM_API_KEY configurado
 */
import { analyzeWithGLM } from './analyzer/glm-analyzer.js';
import { fetchG1 } from './collectors/g1.js';
async function testGLM() {
    console.log('\n🧪 TESTE DO GLM-4 ANALYZER\n');
    const apiKey = process.env.GLM_API_KEY;
    if (!apiKey) {
        console.log('⚠️  GLM_API_KEY não configurada');
        console.log('   Configure: export GLM_API_KEY=sua-chave');
        console.log('   Obter em: https://open.bigmodel.cn\n');
        console.log('   Usando mock para teste...\n');
    }
    else {
        console.log('✅ GLM_API_KEY configurada');
        console.log(`   Modelo: glm-4-flash (gratuito)\n`);
    }
    console.log('📡 Coletando notícias do G1...');
    const articles = await fetchG1();
    console.log(`   ✅ ${articles.length} notícias\n`);
    console.log('='.repeat(70));
    console.log('🧠 ANALISANDO COM GLM-4');
    console.log('='.repeat(70) + '\n');
    for (const article of articles.slice(0, 3)) {
        console.log(`📰 ${article.title.substring(0, 60)}...`);
        const start = Date.now();
        const result = await analyzeWithGLM({
            id: 'test',
            title: article.title,
            source_id: 'g1',
        });
        const duration = Date.now() - start;
        console.log(`   ⏱️  ${duration}ms | ${result.used_glm ? '🤖 GLM' : '🎭 Mock'}`);
        console.log(`   📋 ${result.summary.substring(0, 70)}...`);
        console.log(`   🏷️  Ciclo: ${result.cycle}`);
        console.log(`   ⚖️  Viés: ${result.political_bias} (${result.bias_score})`);
        console.log(`   😊 Sentimento: ${result.sentiment} (${result.sentiment_score})`);
        console.log(`   📂 Categorias: ${result.categories.join(', ')}`);
        console.log(`   🌍 Regiões: ${result.regions.join(', ') || 'N/A'}`);
        console.log(`   ✅ Confiança: ${(result.confidence * 100).toFixed(0)}%`);
        if (result.error) {
            console.log(`   ⚠️  Erro: ${result.error}`);
        }
        console.log();
    }
    console.log('✅ Teste concluído!\n');
}
if (import.meta.url === `file://${process.argv[1]}`) {
    testGLM().catch(console.error);
}
export { testGLM };
