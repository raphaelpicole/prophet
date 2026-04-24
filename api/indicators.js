import { supabase } from '../lib/db/supabase.js';
import { withSentry } from '../lib/middleware/sentry.js';
/**
 * API /api/indicators — dashboard stats
 *
 * GET /api/indicators
 * Retorna agregações para o dashboard
 */
export default withSentry(async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
        // Contagens por ciclo
        const { data: cycles } = await supabase
            .from('stories')
            .select('cycle, count')
            .eq('archived', false)
            .not('cycle', 'is', null);
        const cycleCounts = cycles?.reduce((acc, row) => {
            acc[row.cycle] = (acc[row.cycle] || 0) + 1;
            return acc;
        }, {}) || {};
        // Total de histórias ativas
        const { count: totalStories } = await supabase
            .from('stories')
            .select('*', { count: 'exact', head: true })
            .eq('archived', false);
        // Total de artigos hoje
        const today = new Date().toISOString().split('T')[0];
        const { count: articlesToday } = await supabase
            .from('raw_articles')
            .select('*', { count: 'exact', head: true })
            .gte('collected_at', `${today}T00:00:00`);
        // Hot stories (mais artigos nas últimas 24h)
        const { data: hotStories } = await supabase
            .from('v_story_indicators')
            .select('id, title, article_count, avg_sentiment')
            .eq('archived', false)
            .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('article_count', { ascending: false })
            .limit(5);
        return res.status(200).json({
            total_stories: totalStories || 0,
            articles_today: articlesToday || 0,
            cycles: cycleCounts,
            hot_stories: hotStories || [],
            updated_at: new Date().toISOString(),
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
