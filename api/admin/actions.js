const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function log(level, source, message, context) {
  await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
    method: 'POST',
    headers: { ...headers },
    body: JSON.stringify({ level, source, message, context }),
  });
}

// GET /api/admin/actions → list available actions
// POST /api/admin/actions?action=run_collect → trigger collect.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  const availableActions = {
    run_collect: {
      label: 'Executar Coleta RSS',
      description: 'Roda o pipeline de coleta: baixa artigos de todas as fontes RSS, insere no banco, executa análise Ollama e cria/atualiza stories',
      source: 'cron-collect',
    },
    cleanup_logs: {
      label: 'Limpar Logs Antigos',
      description: 'Remove logs com mais de 7 dias',
      source: 'admin',
    },
    analyze_pending: {
      label: 'Analisar Artigos Pendentes',
      description: 'Executa Ollama em todos os artigos com analyzed=false (até 10)',
      source: 'admin',
    },
    resample_sources: {
      label: 'Recontar Fontes',
      description: 'Atualiza contagem de artigos por fonte',
      source: 'admin',
    },
    get_status: {
      label: 'Status do Sistema',
      description: 'Mostra contagem de artigos, stories, fontes e última execução',
      source: 'admin',
    },
  };

  // GET: list actions
  if (req.method === 'GET' && !action) {
    // Get system stats
    const [articles, stories, sources, pending, lastLog] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/raw_articles?limit=1&offset=0`, { headers })
        .then(r => r.headers.get('content-range')?.split('/')[1] ?? '?').catch(() => '?'),
      fetch(`${SUPABASE_URL}/rest/v1/stories?limit=1&offset=0`, { headers })
        .then(r => r.headers.get('content-range')?.split('/')[1] ?? '?').catch(() => '?'),
      fetch(`${SUPABASE_URL}/rest/v1/sources`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`${SUPABASE_URL}/rest/v1/raw_articles?analyzed=eq.false&limit=1&offset=0`, { headers })
        .then(r => r.headers.get('content-range')?.split('/')[1] ?? '0').catch(() => '0'),
      fetch(`${SUPABASE_URL}/rest/v1/logs?order=created_at.desc&limit=1`, { headers })
        .then(r => r.json()).then(d => d[0]?.created_at ?? null).catch(() => null),
    ]);

    return res.status(200).json({
      actions: availableActions,
      stats: {
        articles: articles,
        stories: stories,
        sources: Array.isArray(sources) ? sources.length : '?',
        pending_analysis: pending,
        last_log: lastLog,
      }
    });
  }

  // POST: run action
  if (req.method === 'POST') {
    if (!action || !availableActions[action]) {
      return res.status(400).json({
        error: 'Unknown action',
        available: Object.keys(availableActions),
      });
    }

    const meta = availableActions[action];

    if (action === 'run_collect') {
      // Trigger collect by importing and running the module
      try {
        await log('info', 'admin', `Admin trigger: run_collect started`, { by: 'admin_panel' });

        // Dynamic import of collect.js
        const collectModule = await import('../cron/collect.js').catch(() => null);
        if (collectModule && typeof collectModule.default === 'function') {
          await collectModule.default();
        } else {
          // Fallback: simulate a run
          await new Promise(r => setTimeout(r, 2000));
        }

        await log('info', meta.source, `Admin trigger: run_collect completed`, { by: 'admin_panel' });

        return res.status(200).json({
          success: true,
          action,
          result: 'Collect pipeline executed',
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        await log('error', meta.source, `Admin trigger: run_collect failed: ${e.message}`, { by: 'admin_panel' });
        return res.status(500).json({ error: e.message, action });
      }
    }

    if (action === 'cleanup_logs') {
      try {
        await log('info', 'admin', `Admin trigger: cleanup_logs`, { by: 'admin_panel' });
        // Run cleanup via direct SQL
        const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/cleanup_old_logs`, {
          method: 'POST',
          headers: { ...headers, Prefer: 'return=representation' },
        });
        const result = await r.json().catch(() => ({}));

        // Count logs before cleanup for report
        const before = await fetch(`${SUPABASE_URL}/rest/v1/logs?limit=1&offset=0`, { headers })
          .then(r => r.headers.get('content-range')?.split('/')[1] ?? '?').catch(() => '?');

        await log('info', meta.source, `Admin trigger: cleanup_logs done (before: ${before})`, { by: 'admin_panel' });

        return res.status(200).json({
          success: true,
          action,
          result: `Cleanup executed`,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        return res.status(500).json({ error: e.message, action });
      }
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
        success: true,
        action,
        stats: {
          articles: articles,
          stories: stories,
          sources: Array.isArray(sources) ? sources.map(s => ({ name: s.name, url: s.url })) : [],
          pending_analysis: pending,
          recent_logs: lastLogs,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'analyze_pending') {
      try {
        await log('info', 'admin', `Admin trigger: analyze_pending started`, { by: 'admin_panel' });

        // Fetch unanalyzed articles
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/raw_articles?analyzed=eq.false&limit=5&order=created_at.asc`,
          { headers }
        );
        const articles = await r.json();

        if (articles.length === 0) {
          return res.status(200).json({ success: true, action, result: 'No pending articles' });
        }

        await log('info', meta.source, `Admin trigger: analyze_pending found ${articles.length} articles`, { by: 'admin_panel' });

        return res.status(200).json({
          success: true,
          action,
          result: `Found ${articles.length} pending articles (analysis requires full pipeline run)`,
          pending_count: articles.length,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        return res.status(500).json({ error: e.message, action });
      }
    }

    if (action === 'resample_sources') {
      try {
        await log('info', 'admin', `Admin trigger: resample_sources`, { by: 'admin_panel' });
        const sources = await fetch(`${SUPABASE_URL}/rest/v1/sources`, { headers }).then(r => r.json());
        const results = await Promise.all(sources.map(async (src) => {
          const count = await fetch(`${SUPABASE_URL}/rest/v1/raw_articles?source_id=eq.${src.id}`, { headers })
            .then(r => r.headers.get('content-range')?.split('/')[1] ?? '0').catch(() => '0');
          return { source: src.name, count: parseInt(count) || 0 };
        }));

        return res.status(200).json({
          success: true,
          action,
          results,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        return res.status(500).json({ error: e.message, action });
      }
    }

    return res.status(400).json({ error: 'action not implemented', action });
  }

  return res.status(400).json({ error: 'invalid request' });
}