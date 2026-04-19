const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const TABLES = ['raw_articles', 'stories', 'sources', 'predictions', 'logs'];

// GET /api/admin/tables?table=X&page=0&limit=20
// POST /api/admin/tables?table=X&action=insert - body contains row data
// PUT /api/admin/tables?table=X - body contains row data with id
// DELETE /api/admin/tables?table=X&id=X

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { table, action, page = '0', limit = '20', id } = req.query;

  // Validate table
  if (table && !TABLES.includes(table)) {
    return res.status(400).json({ error: `Unknown table. Available: ${TABLES.join(', ')}` });
  }

  // GET: list tables or table data
  if (req.method === 'GET') {
    // List all tables with row counts
    if (!table) {
      const tableInfos = await Promise.all(TABLES.map(async (t) => {
        try {
          const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?limit=1&offset=0`, { headers });
          const count = r.headers.get('content-range')?.split('/')[1] ?? '?';
          return { name: t, count: parseInt(count) || 0 };
        } catch { return { name: t, count: -1 }; }
      }));
      return res.status(200).json({ tables: tableInfos });
    }

    // Get single row
    if (id) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { headers });
        const data = await r.json();
        return res.status(200).json({ rows: data });
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }

    // Paginated list
    try {
      const offset = parseInt(page) * parseInt(limit);
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?limit=${limit}&offset=${offset}&order=created_at.desc`,
        { headers }
      );
      const data = await r.json();
      const total = r.headers.get('content-range')?.split('/')[1] ?? data.length;
      return res.status(200).json({
        rows: data,
        pagination: {
          table, page: parseInt(page), limit: parseInt(limit),
          total: parseInt(total) || data.length,
          pages: Math.ceil((parseInt(total) || data.length) / parseInt(limit)),
        }
      });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // POST: insert new row
  if (req.method === 'POST' && action === 'insert') {
    const row = req.body;
    if (!table) return res.status(400).json({ error: 'table required' });
    if (!row || Object.keys(row).length === 0) return res.status(400).json({ error: 'body required' });

    // Remove id if provided (let DB generate)
    const { id: _ignored, ...insertRow } = row;

    try {
      // Log the change
      await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({
          level: 'info',
          source: 'admin',
          message: `INSERT into ${table}`,
          context: { action: 'insert', table, row: insertRow, by: 'admin_panel' },
        }),
      });

      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(insertRow),
      });
      const result = await r.json();
      return res.status(201).json({ inserted: result });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // PUT: update row
  if (req.method === 'PUT') {
    const row = req.body;
    const targetId = row.id || id;
    if (!table) return res.status(400).json({ error: 'table required' });
    if (!targetId) return res.status(400).json({ error: 'id required' });

    const { id: _r, created_at: _ca, ...updateRow } = row;

    try {
      // Log the change
      await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({
          level: 'info',
          source: 'admin',
          message: `UPDATE ${table}`,
          context: { action: 'update', table, id: targetId, changes: updateRow, by: 'admin_panel' },
        }),
      });

      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${targetId}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(updateRow),
      });
      const result = await r.json();
      return res.status(200).json({ updated: result });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // DELETE: delete row
  if (req.method === 'DELETE') {
    const targetId = req.query.id || id;
    if (!table) return res.status(400).json({ error: 'table required' });
    if (!targetId) return res.status(400).json({ error: 'id required' });

    try {
      // Log the change
      await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({
          level: 'warn',
          source: 'admin',
          message: `DELETE from ${table}`,
          context: { action: 'delete', table, id: targetId, by: 'admin_panel' },
        }),
      });

      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${targetId}`, {
        method: 'DELETE',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({}),
      });
      const result = await r.json();
      return res.status(200).json({ deleted: result });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  return res.status(400).json({ error: 'invalid request' });
}