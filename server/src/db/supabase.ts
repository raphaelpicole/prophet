import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_KEY || '';
if (!url || !key) {
    throw new Error('❌ SUPABASE_URL e SUPABASE_KEY devem estar configurados');
}
export const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
});
