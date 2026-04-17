/**
 * Aplicação Automática do Schema Prophet v2
 * 
 * Executa o schema SQL em partes via API Supabase
 * 
 * SUPABASE_URL=https://omwkxneqhvvebenvldkb.supabase.co \
 * SUPABASE_SERVICE_KEY=eyJhbG... \
 * npx tsx src/db/apply-schema.ts
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '';

if (!url) {
  console.error('❌ SUPABASE_URL não configurada. Exemplo:');
  console.log('   SUPABASE_URL=https://seu-projeto.supabase.co npx tsx src/db/apply-schema.ts\n');
  process.exit(1);
}
const key = process.env.SUPABASE_SERVICE_KEY || '';

if (!key) {
  console.error('❌ SUPABASE_SERVICE_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Schema dividido em partes executáveis
const SCHEMA_PARTS = [
  {
    name: 'Reset',
    sql: `
      DROP TABLE IF EXISTS pipeline_log, analysis, article_entities, article_regions, 
      story_articles, story_entities, story_regions, entities, regions, stories, 
      raw_articles, sources CASCADE;
      DROP TYPE IF EXISTS cycle_type, sentiment_label, bias_label, article_status, 
      entity_type, source_type CASCADE;
    `
  },
  {
    name: 'Extensões',
    sql: `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    `
  },
  {
    name: 'Enums',
    sql: `
      CREATE TYPE source_type AS ENUM ('rss', 'scrape', 'api');
      CREATE TYPE entity_type AS ENUM ('person', 'org', 'place');
      CREATE TYPE article_status AS ENUM ('pending', 'analyzing', 'analyzed', 'failed');
      CREATE TYPE bias_label AS ENUM ('esquerda', 'centro-esquerda', 'centro', 'centro-direita', 'direita', 'indefinido');
      CREATE TYPE sentiment_label AS ENUM ('positivo', 'neutro', 'negativo');
      CREATE TYPE cycle_type AS ENUM ('conflito', 'pandemia', 'economico', 'politico', 'social', 'tecnologico', 'ambiental', 'cultural');
    `
  },
  {
    name: 'Tabela sources',
    sql: `
      CREATE TABLE sources (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        rss_url TEXT,
        type source_type NOT NULL DEFAULT 'rss',
        country CHAR(2) NOT NULL DEFAULT 'BR',
        language CHAR(2) NOT NULL DEFAULT 'pt',
        active BOOLEAN DEFAULT TRUE,
        ideology bias_label DEFAULT 'indefinido',
        config JSONB DEFAULT '{}',
        last_fetched_at TIMESTAMPTZ,
        fetch_error_count INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'Tabela raw_articles',
    sql: `
      CREATE TABLE raw_articles (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        content TEXT,
        summary TEXT,
        published_at TIMESTAMPTZ,
        collected_at TIMESTAMPTZ DEFAULT NOW(),
        content_hash TEXT,
        status article_status DEFAULT 'pending',
        retry_count INT DEFAULT 0,
        last_error TEXT
      );
    `
  },
  {
    name: 'Tabela stories',
    sql: `
      CREATE TABLE stories (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT,
        main_subject TEXT NOT NULL,
        cycle cycle_type NOT NULL DEFAULT 'politico',
        article_count INT DEFAULT 1,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        archived BOOLEAN DEFAULT FALSE
      );
    `
  },
  {
    name: 'Tabela story_articles',
    sql: `
      CREATE TABLE story_articles (
        story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
        article_id UUID NOT NULL REFERENCES raw_articles(id) ON DELETE CASCADE,
        PRIMARY KEY (story_id, article_id)
      );
    `
  },
  {
    name: 'Tabela analysis',
    sql: `
      CREATE TABLE analysis (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        article_id UUID NOT NULL UNIQUE REFERENCES raw_articles(id) ON DELETE CASCADE,
        political_bias bias_label DEFAULT 'indefinido',
        sentiment sentiment_label DEFAULT 'neutro',
        bias_score REAL DEFAULT 0,
        sentiment_score REAL DEFAULT 0,
        categories JSONB DEFAULT '[]',
        confidence REAL DEFAULT 0,
        analyzed_at TIMESTAMPTZ DEFAULT NOW(),
        model_used TEXT
      );
    `
  },
  {
    name: 'Índices',
    sql: `
      CREATE INDEX idx_articles_status ON raw_articles(status);
      CREATE INDEX idx_articles_published ON raw_articles(published_at DESC);
      CREATE INDEX idx_articles_source ON raw_articles(source_id);
      CREATE INDEX idx_stories_updated ON stories(updated_at DESC);
      CREATE INDEX idx_stories_cycle ON stories(cycle);
      CREATE INDEX idx_analysis_bias ON analysis(political_bias);
    `
  },
  {
    name: 'Seed: Fontes',
    sql: `
      INSERT INTO sources (slug, name, url, rss_url, type, ideology) VALUES
        ('g1', 'G1', 'https://g1.globo.com', 'https://g1.globo.com/rss/g1/', 'rss', 'centro-esquerda'),
        ('folha', 'Folha de S.Paulo', 'https://www.folha.uol.com.br', 'https://feeds.folha.uol.com.br/emais/rss091.xml', 'rss', 'centro-esquerda'),
        ('cnn', 'CNN Brasil', 'https://www.cnnbrasil.com.br', 'https://www.cnnbrasil.com.br/rss', 'rss', 'centro'),
        ('bbc', 'BBC Brasil', 'https://www.bbc.com/portuguese', 'https://feeds.bbci.co.uk/portuguese/rss.xml', 'rss', 'centro')
      ON CONFLICT (slug) DO NOTHING;
    `
  }
];

async function applySchema() {
  console.log('\n🔄 APLICANDO SCHEMA PROPHET v2\n');
  console.log(`URL: ${url}`);
  console.log(`Partes: ${SCHEMA_PARTS.length}\n`);
  
  for (let i = 0; i < SCHEMA_PARTS.length; i++) {
    const part = SCHEMA_PARTS[i];
    console.log(`${i + 1}/${SCHEMA_PARTS.length} ${part.name}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: part.sql });
      
      if (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        
        // Se for erro de "function does not exist", tenta via REST direto
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('   ⚠️  Função exec_sql não existe. Tentando método alternativo...');
          
          // Tenta inserir direto (só funciona pra INSERTS)
          if (part.name.includes('Seed')) {
            console.log('   ⚠️  Seed precisa ser aplicado manualmente');
            continue;
          }
        }
      } else {
        console.log(`   ✅ OK`);
      }
    } catch (err: any) {
      console.log(`   ❌ Falha: ${err.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Verificando resultado...');
  
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE');
  
  if (tablesError) {
    console.log(`❌ Erro ao verificar: ${tablesError.message}`);
  } else {
    console.log(`\n📊 Tabelas criadas: ${tables?.length || 0}`);
    tables?.forEach((t: any) => console.log(`   - ${t.table_name}`));
  }
  
  const { data: sources } = await supabase.from('sources').select('slug');
  console.log(`\n📰 Fontes configuradas: ${sources?.length || 0}`);
  sources?.forEach((s: any) => console.log(`   - ${s.slug}`));
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Processo concluído!\n');
  
  if ((tables?.length || 0) < 4) {
    console.log('⚠️  Algumas tabelas podem não ter sido criadas.');
    console.log('   Aplique manualmente via SQL Editor:');
    console.log('   https://app.supabase.com/project/omwkxneqhvvebenvldkb/sql-editor\n');
  }
}

applySchema().catch(console.error);
