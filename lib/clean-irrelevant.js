/**
 * Limpar notícias irrelevantes do banco
 * Remove celebridades, entretenimento leve, fofocas
 */
import { createClient } from '@supabase/supabase-js';
import { filterByRelevance } from './utils/content-filter.js';
const supabase = createClient('https://jtyxsxyesliekbuhgkje.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ');
async function cleanIrrelevantNews() {
    console.log('🧹 LIMPANDO NOTÍCIAS IRRELEVANTES\n');
    console.log('='.repeat(70));
    console.log('Critério: Manter apenas notícias que impactam a história da humanidade');
    console.log('Remover: Celebridades, entretenimento, fofocas, reality shows');
    console.log('='.repeat(70) + '\n');
    // Buscar todas as notícias
    const { data: articles, error } = await supabase
        .from('raw_articles')
        .select('id, title, url, status')
        .order('collected_at', { ascending: false });
    if (error) {
        console.log('❌ Erro ao buscar notícias:', error.message);
        return;
    }
    console.log(`📰 Total de notícias no banco: ${articles?.length || 0}\n`);
    let kept = 0;
    let removed = 0;
    const removedList = [];
    // Analisar cada notícia
    for (const article of articles || []) {
        const result = filterByRelevance(article.title);
        if (result.isRelevant) {
            kept++;
        }
        else {
            removed++;
            removedList.push({ title: article.title, reason: result.reason });
            // Remover do banco
            await supabase.from('raw_articles').delete().eq('id', article.id);
            // Também remover análise relacionada
            await supabase.from('analysis').delete().eq('article_id', article.id);
        }
    }
    // Mostrar resumo
    console.log('📊 RESULTADO:');
    console.log('-'.repeat(70));
    console.log(`✅ Mantidas: ${kept} notícias relevantes`);
    console.log(`🗑️  Removidas: ${removed} notícias irrelevantes`);
    console.log(`📈 Taxa de retenção: ${((kept / (kept + removed)) * 100).toFixed(1)}%`);
    console.log('-'.repeat(70) + '\n');
    // Mostrar algumas removidas
    if (removedList.length > 0) {
        console.log('📝 Exemplos de notícias removidas:');
        console.log('-'.repeat(70));
        removedList.slice(0, 10).forEach((item, i) => {
            console.log(`${i + 1}. "${item.title.substring(0, 60)}..."`);
            console.log(`   Motivo: ${item.reason}`);
        });
        if (removedList.length > 10) {
            console.log(`\n... e mais ${removedList.length - 10} notícias`);
        }
    }
    // Limpar stories órfãos
    console.log('\n🧹 Limpando stories sem notícias...');
    const { data: orphanedStories } = await supabase
        .from('stories')
        .select('id, title')
        .filter('article_count', 'eq', 0);
    if (orphanedStories && orphanedStories.length > 0) {
        for (const story of orphanedStories) {
            await supabase.from('stories').delete().eq('id', story.id);
        }
        console.log(`   Removidos ${orphanedStories.length} stories órfãos`);
    }
    console.log('\n' + '='.repeat(70));
    console.log('✅ Limpeza concluída!');
    console.log('='.repeat(70));
}
cleanIrrelevantNews().catch(console.error);
