/**
 * Script para adicionar fontes ICL e O Globo ao Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configure SUPABASE_URL e SUPABASE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const newSources = [
  {
    slug: 'icl',
    name: 'ICL Notícias',
    url: 'https://iclnoticias.com.br',
    rss_url: null,
    type: 'scrape',
    country: 'BR',
    language: 'pt',
    active: true,
    ideology: 'esquerda',
    config: { scraper: 'icl' },
  },
  {
    slug: 'oglobo',
    name: 'O Globo',
    url: 'https://oglobo.globo.com',
    rss_url: 'https://oglobo.globo.com/rss',
    type: 'rss',
    country: 'BR',
    language: 'pt',
    active: true,
    ideology: 'centro',
    config: {},
  },
];

async function addSources() {
  console.log('\n📝 Adicionando novas fontes ao Supabase\n');
  
  for (const source of newSources) {
    const { data, error } = await supabase
      .from('sources')
      .upsert(source, { onConflict: 'slug' })
      .select();
    
    if (error) {
      console.log(`❌ ${source.name}: ${error.message}`);
    } else {
      console.log(`✅ ${source.name} (${source.slug}) - ${source.type}`);
    }
  }
  
  // Listar todas as fontes
  console.log('\n📋 Fontes ativas no banco:');
  const { data: sources } = await supabase
    .from('sources')
    .select('slug, name, type, active')
    .eq('active', true)
    .order('slug');
  
  sources?.forEach(s => {
    console.log(`   ${s.slug}: ${s.name} (${s.type})`);
  });
  
  console.log('\n✅ Concluído!\n');
}

addSources().catch(console.error);
