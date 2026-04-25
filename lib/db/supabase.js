import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
} else {
    console.warn('⚠️ SUPABASE_URL ou SUPABASE_KEY não configurados. Supabase não será inicializado.');
}
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
