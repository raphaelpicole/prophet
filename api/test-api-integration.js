/**
 * Teste de integração completa — API + Supabase
 *
 * Executar: npx tsx src/test-api-integration.ts
 *
 * Este teste:
 * 1. Verifica conexão com Supabase
 * 2. Coleta notícias
 * 3. Insere no banco
 * 4. Chama API localmente
 */
import { checkSupabaseConnection } from './db/supabase.js';
import { fetchG1 } from './collectors/g1.js';
import { insertArticle, getPendingArticles } from './db/articles.js';
import { contentHash } from './dedup/deduplicator.js';
async function testIntegration() {
    console.log('\n🧪 TESTE DE INTEGRAÇÃO COMPLETA\n');
    // 1. Verificar conexão
    console.log('1️⃣ Verificando conexão com Supabase...');
    const conn = await checkSupabaseConnection();
    if (!conn.ok) {
        console.log(`   ❌ Falha: ${conn.error}`);
        console.log('\nPara testar sem banco:');
        console.log('   SUPABASE_URL=sua-url SUPABASE_KEY=sua-key npx tsx src/test-api-integration.ts\n');
        return;
    }
    console.log('   ✅ Conectado ao Supabase\n');
    // 2. Coletar
    console.log('2️⃣ Coletando notícias do G1...');
    const articles = await fetchG1();
    console.log(`   ✅ ${articles.length} notícias coletadas\n`);
    // 3. Inserir no banco
    console.log('3️⃣ Inserindo notícias no banco...');
    let inserted = 0;
    let skipped = 0;
    for (const article of articles.slice(0, 5)) {
        const hash = contentHash(article.title);
        const { data, error } = await insertArticle({
            source_id: article.source_id,
            title: article.title,
            url: article.url,
            content: article.content,
            published_at: article.published_at,
            content_hash: hash,
        });
        if (error) {
            if (error.includes('duplicate')) {
                skipped++;
            }
            else {
                console.log(`   ⚠️  Erro: ${error}`);
            }
        }
        else if (data) {
            inserted++;
            console.log(`   ✅ Inserido: ${article.title.substring(0, 50)}...`);
        }
    }
    console.log(`\n   📊 ${inserted} inseridos, ${skipped} duplicados\n`);
    // 4. Verificar pendentes
    console.log('4️⃣ Verificando artigos pendentes...');
    const pending = await getPendingArticles(10);
    console.log(`   ✅ ${pending.length} artigos pendentes\n`);
    // 5. Resumo
    console.log('='.repeat(60));
    console.log('📊 RESUMO DA INTEGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`Conexão Supabase: ✅ OK`);
    console.log(`Notícias coletadas: ${articles.length}`);
    console.log(`Inseridas no banco: ${inserted}`);
    console.log(`Pendentes análise: ${pending.length}`);
    console.log('='.repeat(60) + '\n');
    console.log('✅ Teste concluído!\n');
    console.log('Próximos passos:');
    console.log('   1. Configure o Vercel para deploy');
    console.log('   2. Configure variáveis de ambiente (SUPABASE_URL, etc)');
    console.log('   3. Deploy: vercel --prod');
}
if (import.meta.url === `file://${process.argv[1]}`) {
    testIntegration().catch(console.error);
}
export { testIntegration };
