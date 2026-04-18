const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const MOCK_REGIONS = [
  { id: '1', name: '🌍 Global', code: 'GLB', parent_id: null },
  { id: '2', name: '🌎 América do Sul', code: 'SAM', parent_id: null },
  { id: '3', name: '🇧🇷 Brasil', code: 'BRA', parent_id: '2' },
  { id: '4', name: '🇺🇸 Estados Unidos', code: 'USA', parent_id: '5' },
  { id: '5', name: '🌐 América do Norte', code: 'NAM', parent_id: null },
  { id: '6', name: '🌍 Europa', code: 'EUR', parent_id: null },
  { id: '7', name: '🌏 Ásia', code: 'ASI', parent_id: null },
  { id: '8', name: '🟡 Oriente Médio', code: 'MID', parent_id: null },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const roots = MOCK_REGIONS.filter(r => !r.parent_id);
  const children = MOCK_REGIONS.filter(r => r.parent_id);
  const tree = roots.map(r => ({ ...r, children: children.filter(c => c.parent_id === r.id) }));

  return res.status(200).json({ regions: MOCK_REGIONS, tree });
}