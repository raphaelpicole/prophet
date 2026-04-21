const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
};
/**
 * GET /api/indicators — dashboard stats
 * Retorna agregações reais da tabela stories (últimos 7 dias) e stores summaries na analysis table.
 * Estrutura analysis: summary por cycle+region para o período.
 */

async function logError(level, source, message, context) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ level, source, message, context }),
    });
  } catch (_) {}
}

// Upsert a cycle+region summary into the analysis table (one row per cycle+region+day)
async function upsertAnalysisSummary(cycle, region, stats) {
  const today = new Date().toISOString().split('T')[0];
  const record = {
    cycle,
    region,
    date: today,
    total_stories: stats.total_stories,
    total_articles: stats.total_articles,
    avg_article_count: stats.avg_article_count,
    top_subjects: stats.top_subjects || [],
    sentiment_breakdown: stats.sentiment_breakdown || { up: 0, stable: 0, down: 0 },
    updated_at: new Date().toISOString(),
  };
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/analysis_summary`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(record),
    });
  } catch (_) {}
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    try {
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Execute queries in parallel for real data
        const [
          allStoriesRes,
          recentStoriesRes,
          articles7dRes,
          cyclesRes,
          regionsRes,
          hotStoriesRes,
          existingSummaryRes,
        ] = await Promise.all([
          // All active stories count
          fetch(`${SUPABASE_URL}/rest/v1/stories?archived=eq.false&select=id`, { headers }),
          // Stories updated in last 7 days (for aggregated analysis)
          fetch(`${SUPABASE_URL}/rest/v1/stories?archived=eq.false&updated_at=gte.${sevenDaysAgo}&select=id,main_subject,cycle,region,article_count,sentiment_trend,summary`, { headers }),
          // Articles in last 7 days
          fetch(`${SUPABASE_URL}/rest/v1/raw_articles?published_at=gte.${sevenDaysAgo}&select=id`, { headers }),
          // All active stories grouped by cycle
          fetch(`${SUPABASE_URL}/rest/v1/stories?archived=eq.false&cycle=not.is.null&select=cycle,region`, { headers }),
          // Stories grouped by region
          fetch(`${SUPABASE_URL}/rest/v1/stories?archived=eq.false&region=not.is.null&select=region,article_count`, { headers }),
          // Hot stories (highest article_count)
          fetch(`${SUPABASE_URL}/rest/v1/stories?archived=eq.false&order=article_count.desc&limit=5&select=id,title,article_count,cycle,main_subject`, { headers }),
          // Check if we already have a summary for today (to avoid re-computing)
          fetch(`${SUPABASE_URL}/rest/v1/analysis_summary?date=eq.${today}&select=id`, { headers }),
        ]);

        const [
          allStoriesData,
          recentStoriesData,
          articles7dData,
          cyclesData,
          regionsData,
          hotData,
          existingSummary,
        ] = await Promise.all([
          allStoriesRes.json(),
          recentStoriesRes.json(),
          articles7dRes.json(),
          cyclesRes.json(),
          regionsRes.json(),
          hotStoriesRes.json(),
          existingSummaryRes.json(),
        ]);

        // Build real cycle counts from all active stories
        const cycleCounts = {};
        const regionCounts = {};
        if (Array.isArray(cyclesData)) {
          for (const row of cyclesData) {
            const c = row.cycle;
            if (c) cycleCounts[c] = (cycleCounts[c] || 0) + 1;
          }
        }
        if (Array.isArray(regionsData)) {
          for (const row of regionsData) {
            const r = row.region;
            if (r) regionCounts[r] = (regionCounts[r] || 0) + 1;
          }
        }

        // Build aggregated analysis by cycle+region from recent stories
        const analysisByCycleRegion = {};
        if (Array.isArray(recentStoriesData)) {
          for (const s of recentStoriesData) {
            const key = `${s.cycle || 'unknown'}_${s.region || 'unknown'}`;
            if (!analysisByCycleRegion[key]) {
              analysisByCycleRegion[key] = {
                cycle: s.cycle || 'unknown',
                region: s.region || 'unknown',
                total_stories: 0,
                total_articles: 0,
                sentiment_breakdown: { up: 0, stable: 0, down: 0 },
                top_subjects: [],
              };
            }
            analysisByCycleRegion[key].total_stories++;
            analysisByCycleRegion[key].total_articles += s.article_count || 1;
            const st = s.sentiment_trend || 'stable';
            if (analysisByCycleRegion[key].sentiment_breakdown[st] !== undefined) {
              analysisByCycleRegion[key].sentiment_breakdown[st]++;
            }
            if (s.main_subject && analysisByCycleRegion[key].top_subjects.length < 5) {
              analysisByCycleRegion[key].top_subjects.push(s.main_subject.slice(0, 60));
            }
          }
        }

        // Compute avg_article_count for each group
        for (const key of Object.keys(analysisByCycleRegion)) {
          const g = analysisByCycleRegion[key];
          g.avg_article_count = g.total_stories > 0
            ? Math.round((g.total_articles / g.total_stories) * 100) / 100
            : 0;
          // Top subjects: deduplicate
          g.top_subjects = [...new Set(g.top_subjects)];
        }

        // Convert to array for the API response
        const analysis = Object.values(analysisByCycleRegion);

        // Store summaries in analysis_summary table (one per cycle+region per day)
        // Only store if we don't have today's summary yet
        if (!Array.isArray(existingSummary) || existingSummary.length === 0) {
          for (const group of analysis) {
            const stats = {
              total_stories: group.total_stories,
              total_articles: group.total_articles,
              avg_article_count: group.avg_article_count,
              top_subjects: group.top_subjects,
              sentiment_breakdown: group.sentiment_breakdown,
            };
            // Fire and forget
            upsertAnalysisSummary(group.cycle, group.region, stats).catch(() => {});
          }
        }

        return res.status(200).json({
          total_stories: Array.isArray(allStoriesData) ? allStoriesData.length : 0,
          articles_7d: Array.isArray(articles7dData) ? articles7dData.length : 0,
          cycles: cycleCounts,
          regions: regionCounts,
          hot_stories: Array.isArray(hotData) ? hotData : [],
          analysis,
          updated_at: new Date().toISOString(),
        });
    }
    catch (err) {
      await logError('error', 'indicators', err.message, null);
      return res.status(500).json({ error: err.message });
    }
}
