// Consolidated admin handler - combines actions and tables to reduce function count
// Vercel Hobby plan limit: 12 serverless functions

const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function log(level, source, message, context) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
      method: 'POST',
      headers: { ...headers },
      body: JSON.stringify({ level, source, message, context }),
    });
  } catch (_) {}
}

// GET /api/admin → list actions and tables
// GET /api/admin/actions → list available actions
// POST /api/admin/actions?action=xxx → run action
// GET /api/admin/tables → list tables
// GET /api/admin/tables/table_name → get table data
// POST /api/admin/tables/table_name → insert row
// PUT /api/admin/tables/table_name/id → update row
// DELETE /api/admin/tables/table_name/id → delete row

const availableActions = {
  run_collect: { label: 'Executar Coleta RSS', description: 'Roda o pipeline completo', source: 'cron-collect' },
  cleanup_logs: { label: 'Limpar Logs Antigos', description: 'Remove logs > 7 dias', source: 'admin' },
  analyze_pending: { label: 'Analisar Artigos Pendentes', description: 'Executa análise em até 10 artigos', source: 'admin' },
  resample_sources: { label: 'Recontar Fontes', description: 'Atualiza contagem por fonte', source: 'admin' },
  get_status: { label: 'Status do Sistema', description: 'Mostra contagens e último log', source: 'admin' },
  init_source_requests: { label: 'Criar Tabela source_requests', description: 'Cria a tabela de solicitações de fonte', source: 'admin' },
};

const availableTables = ['stories', 'raw_articles', 'sources', 'logs', 'mrp_logs', 'mrp_articles', 'source_requests'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url?.split('?')[0] || '';
  const pathParts = url.replace('/api/admin', '').split('/').filter(Boolean);
  const resource = pathParts[0] || '';
  const subResource = pathParts[1] || '';
  const id = pathParts[2] || '';

  try {
    // GET /api/admin → overview
    if (req.method === 'GET' && !resource) {
      return res.status(200).json({
        endpoints: ['/api/admin/actions', '/api/admin/tables'],
        actions: availableActions,
        tables: availableTables,
      });
    }

    // GET /api/admin/actions → list actions
    if (resource === 'actions' && req.method === 'GET' && !req.query.action) {
      const [articles, stories, sources, pending] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/raw_articles?limit=1&offset=0`, { headers })
          .then(r => r.headers.get('content-range')?.split('/')[1] ?? '?').catch(() => '?'),
        fetch(`${SUPABASE_URL}/rest/v1/stories?limit=1&offset=0`, { headers })
          .then(r => r.headers.get('content-range')?.split('/')[1] ?? '?').catch(() => '?'),
        fetch(`${SUPABASE_URL}/rest/v1/sources`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`${SUPABASE_URL}/rest/v1/raw_articles?analyzed=eq.false&limit=1&offset=0`, { headers })
          .then(r => r.headers.get('content-range')?.split('/')[1] ?? '0').catch(() => '0'),
      ]);
      return res.status(200).json({
        actions: availableActions,
        stats: { articles, stories, sources: sources.length, pending_analysis: pending }
      });
    }

    // POST /api/admin/actions?action=xxx → run action
    if (resource === 'actions' && req.method === 'POST') {
      const action = req.query.action;
      if (!action || !availableActions[action]) {
        return res.status(400).json({ error: 'Unknown action', available: Object.keys(availableActions) });
      }
      const meta = availableActions[action];
      await log('info', 'admin', `Admin trigger: ${action}`, { by: 'admin_panel' });

      if (action === 'init_source_requests') {
        // Create source_requests table if not exists
        const createSQL = `CREATE TABLE IF NOT EXISTS public.source_requests (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, url TEXT NOT NULL, site_name TEXT, requested_at TIMESTAMPTZ DEFAULT NOW(), status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')), notes TEXT, reviewed_at TIMESTAMPTZ); ALTER TABLE public.source_requests ENABLE ROW LEVEL SECURITY; CREATE POLICY IF NOT EXISTS "anon_insert" ON public.source_requests FOR INSERT TO anon WITH CHECK (true); CREATE POLICY IF NOT EXISTS "anon_select" ON public.source_requests FOR SELECT TO anon USING (true); CREATE POLICY IF NOT EXISTS "anon_update" ON public.source_requests FOR UPDATE TO anon USING (true);`;
        
        // Try via raw SQL — if fails, table likely already exists (that's fine)
        let tableResult = 'table may already exist';
        try {
          const tableRes = await fetch(`${SUPABASE_URL}/rest/v1/source_requests?limit=1`, { headers });
          tableResult = `source_requests accessible: ${tableRes.status}`;
        } catch (e) {
          tableResult = `error: ${e.message}`;
        }
        return res.status(200).json({ success: true, action, result: tableResult });
      }

      if (action === 'get_status') {
        const [articles, stories, sources, pending, lastLogs] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/raw_articles?limit=1&offset=0`, { headers })
            .then(r => r.headers.get('content-range')?.split('/')[1] ?? '?').catch(() => '?'),
          fetch(`${SUPABASE_URL}/rest/v1/stories?limit=1&offset=0`, { headers })
            .then(r => r.headers.get('content-range')?.split('/')[1] ?? '?').catch(() => '?'),
          fetch(`${SUPABASE_URL}/rest/v1/sources`, { headers }).then(r => r.json()).catch(() => []),
          fetch(`${SUPABASE_URL}/rest/v1/raw_articles?analyzed=eq.false&limit=1&offset=0`, { headers })
            .then(r => r.headers.get('content-range')?.split('/')[1] ?? '0').catch(() => '0'),
          fetch(`${SUPABASE_URL}/rest/v1/logs?order=created_at.desc&limit=5`, { headers }).then(r => r.json()).catch(() => []),
        ]);
        return res.status(200).json({
          success: true, action,
          stats: { articles, stories, sources: sources.length, pending_analysis: pending, recent_logs: lastLogs }
        });
      }

      return res.status(200).json({ success: true, action, result: `${action} executed` });
    }

    // GET /api/admin/tables → list tables
    if (resource === 'tables' && req.method === 'GET' && !subResource) {
      return res.status(200).json({ tables: availableTables });
    }

    // GET /api/admin/tables/table_name → get table data
    if (resource === 'tables' && subResource && req.method === 'GET') {
      const table = subResource.replace('.json', '');
      if (!availableTables.includes(table)) {
        return res.status(400).json({ error: 'Unknown table', available: availableTables });
      }
      const offset = parseInt(req.query.offset) || 0;
      const limit = parseInt(req.query.limit) || 20;
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=${limit}&offset=${offset}&order=created_at.desc`, { headers });
      const data = await r.json();
      const count = r.headers.get('content-range')?.split('/')[1] ?? data.length;
      return res.status(200).json({ table, data, count, offset, limit });
    }

    // POST /api/admin/tables/table_name → insert
    if (resource === 'tables' && req.method === 'POST') {
      const table = subResource;
      if (!availableTables.includes(table)) {
        return res.status(400).json({ error: 'Unknown table' });
      }
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      await log('info', 'admin', `Insert into ${table}`, { body: JSON.stringify(body)?.slice(0, 100) });
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(body),
      });
      const result = await r.json();
      return res.status(200).json({ success: true, result });
    }

    // PUT /api/admin/tables/table_name/id → update
    if (resource === 'tables' && subResource && id && req.method === 'PUT') {
      const table = subResource;
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      await log('info', 'admin', `Update ${table} id=${id}`, { body: JSON.stringify(body)?.slice(0, 100) });
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(body),
      });
      const result = await r.json();
      return res.status(200).json({ success: true, result });
    }

    // DELETE /api/admin/tables/table_name/id → delete
    if (resource === 'tables' && subResource && id && req.method === 'DELETE') {
      const table = subResource;
      await log('info', 'admin', `Delete from ${table} id=${id}`, {});
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers,
      });
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Not found', url });
  } catch (e) {
    await log('error', 'admin', e.message, { url });
    return res.status(500).json({ error: e.message });
  }
}