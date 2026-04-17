/**
 * Adicionar todas as fontes ao Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configure SUPABASE_URL e SUPABASE_KEY no .env');
  console.error('Exemplo: SUPABASE_URL=https://xxx.supabase.co SUPABASE_KEY=eyJ... npx tsx src/setup-sources.ts');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sources = [
  // Já existem
  { slug: 'g1', name: 'G1', url: 'https://g1.globo.com', type: 'rss', active: true, ideology: 'centro' },
  { slug: 'cnn', name: 'CNN Brasil', url: 'https://www.cnnbrasil.com.br', type: 'rss', active: true, ideology: 'centro' },
  { slug: 'bbc', name: 'BBC Brasil', url: 'https://www.bbc.com/portuguese', type: 'rss', active: true, ideology: 'centro' },
  { slug: 'folha', name: 'Folha de S.Paulo', url: 'https://www.folha.uol.com.br', rss_url: 'https://feeds.folha.uol.com.br/emais/rss091.xml', type: 'rss', active: true, ideology: 'centro-esquerda' },
  // Novas
  { slug: 'uol', name: 'UOL', url: 'https://www.uol.com.br', rss_url: 'https://rss.uol.com.br/feed/noticias.xml', type: 'rss', active: true, ideology: 'centro' },
  { slug: 'estadao', name: 'Estadão', url: 'https://www.estadao.com.br', rss_url: 'https://www.estadao.com.br/ultimas/rss', type: 'rss', active: true, ideology: 'centro-direita' },
  { slug: 'metropoles', name: 'Metrópoles', url: 'https://www.metropoles.com', type: 'scrape', active: true, ideology: 'centro' },
  // Protegidas (não ativas por enquanto)
  { slug: 'icl', name: 'ICL Notícias', url: 'https://iclnoticias.com.br', type: 'scrape', active: false, ideology: 'esquerda' },
  { slug: 'oglobo', name: 'O Globo', url: 'https://oglobo.globo.com', rss_url: 'https://oglobo.globo.com/rss.xml', type: 'rss', active: false, ideology: 'centro' },
];

async function addSources() {
  console.log('\n📝 Configurando fontes no Supabase\n');
  
  for (const source of sources) {
    const { data, error } = await supabase
      .from('sources')
      .upsert({
        slug: source.slug,
        name: source.name,
        url: source.url,
        rss_url: source.rss_url || null,
        type: source.type,
        country: 'BR',
        language: 'pt',
        active: source.active,
        ideology: source.ideology,
        config: source.type === 'scrape' ? { scraper: source.slug } : {},
      }, { onConflict: 'slug' })
      .select();
    
    const status = source.active ? '✅' : '⚠️';
    if (error) {
      console.log(`❌ ${source.name}: ${error.message}`);
    } else {
      console.log(`${status} ${source.name} (${source.slug}) — ${source.ideology} ${!source.active ? '(desativada)' : ''}`);
    }
  }
  
  console.log('\n📋 Fontes configuradas:');
  const { data: allSources } = await supabase
    .from('sources')
    .select('slug, name, type, active, ideology')
    .order('slug');
  
  allSources?.forEach(s => {
    const icon = s.active ? '✓' : '✗';
    console.log(`   ${icon} ${s.slug}: ${s.name} (${s.ideology})`);
  });
  
  console.log(`\n✅ Total: ${allSources?.length} fontes\n`);
}

addSources().catch(console.error);
