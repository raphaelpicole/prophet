import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ SUPABASE_URL e SUPABASE_KEY devem estar configurados no .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper para verificar conexão
export async function checkSupabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.from('sources').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}