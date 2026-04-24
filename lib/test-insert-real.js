/**
 * Teste de Inserção Real de Notícias no Supabase
 *
 * Coleta notícias reais e insere no banco
 */
import { createClient } from '@supabase/supabase-js';
import { fetchG1 } from './collectors/g1.js';
import { fetchCNN } from './collectors/cnn.js';
import { fetchBBC } from './collectors/bbc.js';
import { contentHash } from './dedup/deduplicator.js';
const supabaseUrl = process.env.SUPABASE_URL || 'https://jtyxsxyesliekbuhgkje.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});
async function testInsertReal() {
    console.log('\n📝 TESTE DE INSERÇÃO REAL DE NOTÍCIAS\n');
    // Buscar source_id das fontes
    const { data: sources, error: sourcesError } = await supabase
        .from('sources')
        .select('id, slug, name');
    if (sourcesError || !sources) {
        console.error('❌ Erro ao buscar fontes:', sourcesError?.message);
        return;
    }
    console.log(`📰 ${sources.length} fontes disponíveis:`);
    sources.forEach(s => console.log(`   - ${s.slug}: ${s.name} (${s.id.substring(0, 8)}...)`));
    console.log();
    const sourceMap = {};
    sources.forEach(s => sourceMap[s.slug] = s.id);
    // Coletar notícias
    console.log('📡 Coletando notícias...\n');
    const allArticles = [];
    try {
        console.log('   G1...');
        const g1Articles = await fetchG1();
        g1Articles.slice(0, 5).forEach(a => {
            if (sourceMap.g1) {
                allArticles.push({ ...a, source_id: sourceMap.g1, source_slug: 'g1' });
            }
        });
        console.log(`      ✅ ${g1Articles.length} coletadas, 5 selecionadas`);
    }
    catch (e) {
        console.log(`      ❌ ${e.message}`);
    }
    try {
        console.log('   CNN...');
        const cnnArticles = await fetchCNN();
        cnnArticles.slice(0, 3).forEach(a => {
            if (sourceMap.cnn) {
                allArticles.push({ ...a, source_id: sourceMap.cnn, source_slug: 'cnn' });
            }
        });
        console.log(`      ✅ ${cnnArticles.length} coletadas, 3 selecionadas`);
    }
    catch (e) {
        console.log(`      ❌ ${e.message}`);
    }
    try {
        console.log('   BBC...');
        const bbcArticles = await fetchBBC();
        bbcArticles.slice(0, 3).forEach(a => {
            if (sourceMap.bbc) {
                allArticles.push({ ...a, source_id: sourceMap.bbc, source_slug: 'bbc' });
            }
        });
        console.log(`      ✅ ${bbcArticles.length} coletadas, 3 selecionadas`);
    }
    catch (e) {
        console.log(`      ❌ ${e.message}`);
    }
    console.log(`\n📊 Total para inserir: ${allArticles.length} notícias\n`);
    // Inserir no banco
    console.log('='.repeat(70));
    console.log('💾 INSERINDO NO BANCO');
    console.log('='.repeat(70) + '\n');
    let inserted = 0;
    let duplicates = 0;
    let errors = 0;
    for (const article of allArticles) {
        const hash = contentHash(article.title);
        const { data, error } = await supabase
            .from('raw_articles')
            .insert({
            source_id: article.source_id,
            title: article.title,
            url: article.url,
            content_hash: hash,
            status: 'pending',
        })
            .select()
            .single();
        if (error) {
            if (error.message.includes('duplicate')) {
                duplicates++;
                console.log(`⚠️  [${article.source_slug}] Duplicada: ${article.title.substring(0, 50)}...`);
            }
            else {
                errors++;
                console.log(`❌ [${article.source_slug}] Erro: ${error.message}`);
            }
        }
        else if (data) {
            inserted++;
            console.log(`✅ [${article.source_slug}] Inserida: ${article.title.substring(0, 50)}...`);
        }
        // Pequeno delay
        await new Promise(r => setTimeout(r, 100));
    }
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DA INSERÇÃO');
    console.log('='.repeat(70));
    console.log(`✅ Inseridas: ${inserted}`);
    console.log(`⚠️  Duplicadas: ${duplicates}`);
    console.log(`❌ Erros: ${errors}`);
    console.log('='.repeat(70) + '\n');
    // Verificar total no banco
    const { count } = await supabase
        .from('raw_articles')
        .select('*', { count: 'exact', head: true });
    console.log(`📈 Total no banco: ${count} notícias\n`);
    // Mostrar amostra
    const { data: sample } = await supabase
        .from('raw_articles')
        .select('title, url, status, collected_at')
        .order('collected_at', { ascending: false })
        .limit(3);
    console.log('📝 Últimas notícias inseridas:');
    sample?.forEach((a, i) => {
        console.log(`   ${i + 1}. ${a.title.substring(0, 60)}...`);
        console.log(`      Status: ${a.status} | ${new Date(a.collected_at).toLocaleString('pt-BR')}`);
    });
    console.log('\n✅ Teste concluído!\n');
}
testInsertReal().catch(console.error);
