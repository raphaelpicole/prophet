export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const result = {
    keys: Object.keys(process.env).filter(k => k.startsWith('SUPABASE') || k === 'VERCEL_ENV'),
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
  };

  for (const key of result.keys) {
    const val = process.env[key];
    result[key] = val ? `${val.slice(0, 5)}... (len=${val.length})` : 'undefined';
  }

  return res.json(result);
}
