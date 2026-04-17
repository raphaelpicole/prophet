import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

let _supabase;
export function getSupabase() {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('❌ SUPABASE_URL e SUPABASE_KEY devem estar configurados');
    }
    if (!_supabase) {
        _supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }
    return _supabase;
}
export const supabase = { get supabase() { return getSupabase(); } };
// Helper para verificar conexão
export async function checkSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('sources').select('count', { count: 'exact', head: true });
        if (error)
            throw error;
        return { ok: true };
    }
    catch (err) {
        return { ok: false, error: err.message };
    }
}
