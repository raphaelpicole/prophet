import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_KEY || '';

export default function handler(req, res) {
  try {
    if (!url || !key) {
      return res.status(500).json({ error: 'missing env', supabaseUrl: !!url, supabaseKey: !!key });
    }
    const supabase = createClient(url, key);
    return res.json({ ok: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
