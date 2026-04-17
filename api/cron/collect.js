import { collectAllSources } from '../src/collectors/index.js';
import { deduplicate } from '../src/dedup/deduplicator.js';
import { analyzePending } from '../src/analyzer/index.js';
import { groupArticlesIntoStories } from '../src/analyzer/grouper.js';
import supabase from '../src/db/supabase.js';
/**
 * CRON ENTRY — Vercel chama a cada 15 min.
 *
 * Pipeline completo:
 *   1. Coleta notícias de todas as fontes (paralelo)
 *   2. Deduplica contra o banco
 *   3. Insere novas no Supabase
 *   4. Roda análise LLM nos pendentes
 *   5. Agrupa em histórias
 *
 * Ponto forte: é uma pipeline atômica — se qualquer etapa falha,
 * as anteriores já persistiram. Não perde dados.
 */
export default async function handler(req, res) {
    // Segurança: só aceita POST ou chamada cron do Vercel
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const log = [];
    try {
        // 1. Coleta
        log.push('📥 Coletando notícias...');
        const articles = await collectAllSources();
        log.push(`   Coletadas: ${articles.length}`);
        // 2. Deduplica
        log.push('🔍 Deduplicando...');
        const { newArticles, duplicates } = await deduplicate(articles);
        log.push(`   Novas: ${newArticles.length} | Duplicadas: ${duplicates.length}`);
        // 3. Insere novas
        if (newArticles.length > 0) {
            log.push('💾 Inserindo no banco...');
            const { error } = await supabase.from('raw_articles').insert(newArticles.map(a => ({
                source_id: a.source_id,
                title: a.title,
                url: a.url,
                content: a.content,
                published_at: a.published_at,
                content_hash: a.content_hash,
                status: 'pending',
            })));
            if (error)
                log.push(`   ⚠️ Erro inserção: ${error.message}`);
            else
                log.push(`   ✅ Inseridas com sucesso`);
        }
        // 4. Analisa pendentes
        log.push('🧠 Analisando pendentes...');
        const analyzedCount = await analyzePending(20);
        log.push(`   Analisadas: ${analyzedCount}`);
        // 5. Agrupa em histórias
        log.push('📖 Agrupando em histórias...');
        const groupedCount = await groupArticlesIntoStories();
        log.push(`   Agrupadas: ${groupedCount}`);
        log.push('✅ Pipeline completa!');
        return res.status(200).json({ success: true, log });
    }
    catch (err) {
        log.push(`❌ Erro: ${err.message}`);
        return res.status(500).json({ success: false, log, error: err.message });
    }
}
