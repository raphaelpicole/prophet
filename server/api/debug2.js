const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Test 1: direct fetch to Supabase
    const r1 = await fetch(`${URL}/rest/v1/stories?select=id&limit=1`, {
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
    });
    const d1 = await r1.text();

    // Test 2: same fetch with different header casing
    const r2 = await fetch(`${URL}/rest/v1/stories?select=id&limit=1`, {
      headers: { 'apikey': KEY, 'authorization': `Bearer ${KEY}` }
    });
    const d2 = await r2.text();

    return res.json({
      test1: { status: r1.status, body: d1.slice(0, 200) },
      test2: { status: r2.status, body: d2.slice(0, 200) },
      urlUsed: URL,
      keyLen: KEY.length,
    });
  } catch(e) {
    return res.json({ error: e.message });
  }
}
