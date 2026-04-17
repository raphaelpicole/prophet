const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Show first 50 chars of URL and last 10 of key
  return res.json({
    url: url || 'MISSING',
    urlLen: url ? url.length : 0,
    keyPrefix: key ? key.slice(0, 10) : 'MISSING',
    keyLen: key ? key.length : 0,
    // Try fetching with the env vars
    testResult: await fetch(`${url}/rest/v1/stories?select=id&limit=1`, {
      headers: { 'apikey': key!, 'Authorization': `Bearer ${key}` }
    }).then(r => r.text()).catch(e => e.message)
  });
}
