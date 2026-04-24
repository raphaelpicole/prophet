/**
 * Migração Automática do Schema Prophet v2
 *
 * ⚠️ CUIDADO: Isso apaga dados existentes!
 *
 * Executar:
 * SUPABASE_URL=https://omwkxneqhvvebenvldkb.supabase.co \
 * SUPABASE_SERVICE_KEY=eyJhbG... \
 * npx tsx src/db/migrate.ts
 */
import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_KEY || '';
if (!url) {
    console.error('❌ SUPABASE_URL não configurada');
    process.exit(1);
}
if (!key) {
    console.error('❌ SUPABASE_SERVICE_KEY não configurada');
    process.exit(1);
}
const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
});
// Schema SQL completo
const SCHEMA_SQL = `
-- Reset
DROP TABLE IF EXISTS pipeline_log CASCADE;
DROP TABLE IF EXISTS analysis CASCADE;
DROP TABLE IF EXISTS article_entities CASCADE;
DROP TABLE IF EXISTS article_regions CASCADE;
DROP TABLE IF EXISTS story_articles CASCADE;
DROP TABLE IF EXISTS story_entities CASCADE;
DROP TABLE IF EXISTS story_regions CASCADE;
DROP TABLE IF EXISTS entities CASCADE;
DROP TABLE IF EXISTS regions CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS raw_articles CASCADE;
DROP TABLE IF EXISTS sources CASCADE;

DROP TYPE IF EXISTS cycle_type CASCADE;
DROP TYPE IF EXISTS sentiment_label CASCADE;
DROP TYPE IF EXISTS bias_label CASCADE;
DROP TYPE IF EXISTS article_status CASCADE;
DROP TYPE IF EXISTS entity_type CASCADE;
DROP TYPE IF EXISTS source_type CASCADE;

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Enums
create type source_type as enum ('rss', 'scrape', 'api');
create type entity_type as enum ('person', 'org', 'place');
create type article_status as enum ('pending', 'analyzing', 'analyzed', 'failed');
create type bias_label as enum ('esquerda', 'centro-esquerda', 'centro', 'centro-direita', 'direita', 'indefinido');
create type sentiment_label as enum ('positivo', 'neutro', 'negativo');
create type cycle_type as enum ('conflito', 'pandemia', 'economico', 'politico', 'social', 'tecnologico', 'ambiental', 'cultural');

-- Tabela sources
create table sources (
  id          uuid default uuid_generate_v4() primary key,
  slug        text not null unique,
  name        text not null,
  url         text not null,
  rss_url     text,
  type        source_type not null default 'rss',
  country     char(2) not null default 'BR',
  language    char(2) not null default 'pt',
  active      boolean default true,
  ideology    bias_label default 'indefinido',
  config      jsonb default '{}',
  last_fetched_at timestamptz,
  fetch_error_count int default 0,
  created_at  timestamptz default now()
);

-- Tabela raw_articles
create table raw_articles (
  id            uuid default uuid_generate_v4() primary key,
  source_id     uuid not null references sources(id) on delete cascade,
  title         text not null,
  url           text not null unique,
  content       text,
  summary       text,
  published_at  timestamptz,
  collected_at  timestamptz default now(),
  content_hash  text,
  status        article_status default 'pending',
  retry_count   int default 0,
  last_error    text
);

-- Tabela stories
create table stories (
  id            uuid default uuid_generate_v4() primary key,
  title         text not null,
  summary       text,
  main_subject  text not null,
  cycle         cycle_type not null default 'politico',
  article_count int default 1,
  started_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  archived      boolean default false
);

-- Ligação story_articles
create table story_articles (
  story_id   uuid not null references stories(id) on delete cascade,
  article_id uuid not null references raw_articles(id) on delete cascade,
  primary key (story_id, article_id)
);

-- Tabela analysis
create table analysis (
  id                uuid default uuid_generate_v4() primary key,
  article_id        uuid not null unique references raw_articles(id) on delete cascade,
  political_bias    bias_label default 'indefinido',
  sentiment         sentiment_label default 'neutro',
  bias_score        real default 0,
  sentiment_score   real default 0,
  categories        jsonb default '[]',
  confidence        real default 0,
  analyzed_at       timestamptz default now(),
  model_used        text
);

-- Seed: Fontes
insert into sources (slug, name, url, rss_url, type, ideology) values
  ('g1', 'G1', 'https://g1.globo.com', 'https://g1.globo.com/rss/g1/', 'rss', 'centro-esquerda'),
  ('folha', 'Folha de S.Paulo', 'https://www.folha.uol.com.br', 'https://feeds.folha.uol.com.br/emais/rss091.xml', 'rss', 'centro-esquerda'),
  ('cnn', 'CNN Brasil', 'https://www.cnnbrasil.com.br', 'https://www.cnnbrasil.com.br/rss', 'rss', 'centro'),
  ('bbc', 'BBC Brasil', 'https://www.bbc.com/portuguese', 'https://feeds.bbci.co.uk/portuguese/rss.xml', 'rss', 'centro')
on conflict (slug) do nothing;
`;
async function migrate() {
    console.log('\n🔄 MIGRAÇÃO DO SCHEMA PROPHET v2\n');
    console.log(`URL: ${url}`);
    console.log('⚠️  Isso apaga todos os dados existentes!\n');
    // Executa SQL
    console.log('Aplicando schema...');
    const { error } = await supabase.rpc('exec_sql', { sql: SCHEMA_SQL });
    if (error) {
        console.log(`❌ Erro: ${error.message}`);
        console.log('\nTente aplicar manualmente:');
        console.log('1. Acesse https://app.supabase.com/project/omwkxneqhvvebenvldkb');
        console.log('2. SQL Editor');
        console.log('3. Cole o SQL de docs/DATABASE.md');
        return;
    }
    console.log('✅ Schema aplicado com sucesso!');
    // Verifica
    const { data: sources } = await supabase.from('sources').select('slug');
    console.log(`📊 ${sources?.length || 0} fontes configuradas`);
}
migrate().catch(console.error);
