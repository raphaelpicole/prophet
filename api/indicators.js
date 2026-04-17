const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
};
/**
 * GET /api/indicators — dashboard stats
 * Retorna agregações: total stories, artigos hoje, contagem por ciclo, hot stories
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    try {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        // Executa as 4 queries em paralelo
        const [storiesRes, articlesTodayRes, hotStoriesRes, cyclesRes] = await Promise.all([
            // Total de histórias ativas
            fetch(`${SUPABASE_URL}/rest/v1/stories?archived=eq.false&select=id`, { headers }),
            // Total de artigos hoje
            fetch(`${SUPABASE_URL}/rest/v1/raw_articles?collected_at=gte.${today}T00:00:00&select=id`, { headers }),
            // Hot stories (últimas 24h) — busca todas e ordena
            fetch(`${SUPABASE_URL}/rest/v1/v_story_indicators?archived=eq.false&updated_at=gte.${yesterday}&select=id,title,article_count,avg_sentiment&order=article_count.desc&limit=5`, { headers }),
            // Contagem por ciclo
            fetch(`${SUPABASE_URL}/rest/v1/stories?archived=eq.false&cycle=not.is.null&select=cycle`, { headers }),
        ]);
        const [storiesData, articlesData, hotData, cyclesData] = await Promise.all([
            storiesRes.json(),
            articlesTodayRes.json(),
            hotStoriesRes.json(),
            cyclesRes.json(),
        ]);
        // Processa contagem por ciclo
        const cycleCounts = {};
        if (Array.isArray(cyclesData)) {
            for (const row of cyclesData) {
                const c = row.cycle;
                if (c)
                    cycleCounts[c] = (cycleCounts[c] || 0) + 1;
            }
        }
        return res.status(200).json({
            total_stories: Array.isArray(storiesData) ? storiesData.length : 0,
            articles_today: Array.isArray(articlesData) ? articlesData.length : 0,
            cycles: cycleCounts,
            hot_stories: Array.isArray(hotData) ? hotData : [],
            updated_at: new Date().toISOString(),
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
