const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
/**
 * API /api/stories — lista histórias com filtros
 *
 * GET /api/stories
 * Query params:
 *   - cycle: conflito | economico | politico | ...
 *   - region: nome da região
 *   - bias: esquerda | centro | direita
 *   - sentiment: positivo | negativo | neutro
 *   - limit: número (default 50)
 *   - offset: número (default 0)
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    const { cycle, region, bias, sentiment, limit = '50', offset = '0', search, } = req.query;
    const params = new URLSearchParams();
    params.set('select', '*');
    params.set('archived', 'eq.false');
    params.set('order', 'updated_at.desc');
    params.set('limit', limit);
    params.set('offset', offset);
    if (cycle)
        params.set('cycle', `eq.${cycle}`);
    if (region)
        params.set('region', `eq.${region}`);
    if (search)
        params.set('main_subject', `ilike.*${search}*`);
    try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/stories?${params.toString()}`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'count=exact',
            }
        });
        const data = await r.json();
        if (!r.ok) {
            return res.status(r.status).json({ error: data.message || 'supabase error' });
        }
        return res.status(200).json({
            stories: data,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        });
    }
    catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
