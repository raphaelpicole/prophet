/**
 * Prophet Maintenance — Cron job
 * Executado todo domingo às 6h BRT
 * 
 * Jobs:
 * 1. Remove predictions de teste (description = "test", "Teste", etc.)
 * 2. Remove stories órfãs sem artigos
 * 3. Reset article_count inflated
 */

const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const log = [];
  const now = new Date().toISOString();

  try {
    // ── 1. Delete test predictions ─────────────────────────────────
    const testPredsRaw = await fetch(
      `${SUPABASE_URL}/rest/v1/predictions?id=in.(26c1fa67,1f5cacc6,01db85fb)`,
      { headers }
    ).then(r => r.json()).catch(() => []);
    const testPreds = Array.isArray(testPredsRaw) ? testPredsRaw : [];

    for (const p of testPreds) {
      await fetch(`${SUPABASE_URL}/rest/v1/predictions?id=eq.${p.id}`, {
        method: 'DELETE',
        headers,
      });
      log.push(`Deleted test prediction: ${p.id} — ${p.description?.slice(0, 30)}`);
    }

    // Also clean predictions with description containing only "test" or "Teste"
    const allPredsRaw = await fetch(
      `${SUPABASE_URL}/rest/v1/predictions?select=id,description`,
      { headers }
    ).then(r => r.json()).catch(() => []);
    const allPreds = Array.isArray(allPredsRaw) ? allPredsRaw : [];

    for (const p of allPreds) {
      const desc = (p.description || '').trim();
      // Delete: exact "test"/"Teste", or JSON with "Teste" evento, or JSON with reasoning:"test"
      const isTest = desc.toLowerCase() === 'test' || desc.toLowerCase() === 'teste';
      let isTestJson = false;
      try {
        const parsed = JSON.parse(desc);
        isTestJson = (parsed.evento && parsed.evento.toLowerCase() === 'teste') ||
                     (parsed.reasoning && parsed.reasoning.toLowerCase() === 'test');
      } catch {}
      if (isTest || isTestJson) {
        await fetch(`${SUPABASE_URL}/rest/v1/predictions?id=eq.${p.id}`, {
          method: 'DELETE',
          headers,
        });
        log.push(`Deleted test: ${p.id} — "${p.description?.slice(0, 40)}"`);
      }
    }

    // ── 2. Fix stories with article_count mismatch ──────────────────
    const stories = await fetch(
      `${SUPABASE_URL}/rest/v1/stories?select=id,title,article_count`,
      { headers }
    ).then(r => r.json()).catch(() => []);

    for (const s of stories) {
      const articles = await fetch(
        `${SUPABASE_URL}/rest/v1/story_articles?story_id=eq.${s.id}&select=id`,
        { headers }
      ).then(r => r.json()).catch(() => []);

      const actualCount = Array.isArray(articles) ? articles.length : 0;
      if (s.article_count !== actualCount) {
        await fetch(`${SUPABASE_URL}/rest/v1/stories?id=eq.${s.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ article_count: actualCount }),
        });
        log.push(`Fixed article_count: "${s.title?.slice(0, 30)}" ${s.article_count}→${actualCount}`);
      }
    }

    // ── 3. Delete stories with 0 articles and old (órfãs) ─────────
    const storiesWithCount = await fetch(
      `${SUPABASE_URL}/rest/v1/stories?select=id,title,article_count,updated_at&article_count=eq.0`,
      { headers }
    ).then(r => r.json()).catch(() => []);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 2); // only delete if >2 days old

    for (const s of storiesWithCount) {
      const updated = new Date(s.updated_at);
      if (updated < cutoff) {
        await fetch(`${SUPABASE_URL}/rest/v1/stories?id=eq.${s.id}`, {
          method: 'DELETE',
          headers,
        });
        log.push(`Deleted orphan story: "${s.title?.slice(0, 30)}"`);
      }
    }

    log.push(`Maintenance done at ${now}`);
    console.log(log.join('\n'));

    return res.status(200).json({ ok: true, log });

  } catch (err) {
    console.error('Maintenance error:', err);
    return res.status(500).json({ error: err.message, log });
  }
}
