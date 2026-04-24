import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from '../src/middleware/sentry.js';

const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';

export default withSentry(async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Create enum type if not exists
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/pg_enum_create`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        enum_name: 'bias_label',
        enum_values: ['esquerda', 'centro-esquerda', 'centro', 'centro-direita', 'direita', 'indefinido']
      })
    }).catch(() => {});

    // Add columns using raw SQL via a workaround - create a temp function
    const sqls = [
      "DO $$ BEGIN CREATE TYPE bias_label AS ENUM ('esquerda', 'centro-esquerda', 'centro', 'centro-direita', 'direita', 'indefinido'); EXCEPTION WHEN duplicate_object THEN null; END $$",
      "ALTER TABLE analysis ADD COLUMN IF NOT EXISTS political_bias bias_label DEFAULT 'indefinido'",
      "ALTER TABLE analysis ADD COLUMN IF NOT EXISTS bias_score real DEFAULT 0",
      "ALTER TABLE analysis ADD COLUMN IF NOT EXISTS sentiment_score real DEFAULT 0",
      "ALTER TABLE analysis ADD COLUMN IF NOT EXISTS analysis_version int DEFAULT 1",
      "ALTER TABLE analysis ADD COLUMN IF NOT EXISTS tokens_used int DEFAULT 0"
    ];

    const results = [];
    for (const sql of sqls) {
      // Use pg_execute to run raw SQL via a workaround
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pg_execute`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: sql })
      }).catch(() => null);
      results.push({ sql: sql.substring(0, 50), status: r?.ok ? 'ok' : 'failed' });
    }

    return res.status(200).json({ success: true, results });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});