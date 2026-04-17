-- ============================================
-- PROPHET SCHEMA v2 - SQL COMPLETO
-- 
-- Para aplicar no Supabase:
-- 1. Acesse: https://app.supabase.com/project/omwkxneqhvvebenvldkb/sql-editor
-- 2. Copie os blocos abaixo e execute um por um
-- 3. Clique "Run" em cada bloco
-- ============================================

-- ============================================
-- BLOCO 1: RESET (apaga tudo se existir)
-- ============================================
DROP TABLE IF EXISTS pipeline_log, analysis, article_entities, article_regions, 
story_articles, story_entities, story_regions, entities, regions, stories, 
raw_articles, sources CASCADE;
DROP TYPE IF EXISTS cycle_type, sentiment_label, bias_label, article_status, 
entity_type, source_type CASCADE;

-- ============================================
-- BLOCO 2: EXTENSÕES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- BLOCO 3: ENUMS (tipos controlados)
-- ============================================
CREATE TYPE source_type AS ENUM ('rss', 'scrape', 'api');
CREATE TYPE entity_type AS ENUM ('person', 'org', 'place');
CREATE TYPE article_status AS ENUM ('pending', 'analyzing', 'analyzed', 'failed');
CREATE TYPE bias_label AS ENUM ('esquerda', 'centro-esquerda', 'centro', 'centro-direita', 'direita', 'indefinido');
CREATE TYPE sentiment_label AS ENUM ('positivo', 'neutro', 'negativo');
CREATE TYPE cycle_type AS ENUM ('conflito', 'pandemia', 'economico', 'politico', 'social', 'tecnologico', 'ambiental', 'cultural');

-- ============================================
-- BLOCO 4: TABELA sources
-- ============================================
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BLOCO 5: TABELA raw_articles
-- ============================================
CREATE TABLE raw_articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  content TEXT,
  summary TEXT,
  author TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  content_hash TEXT,
  status article_status DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  last_error TEXT
);

-- ============================================
-- BLOCO 6: TABELA stories
-- ============================================
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

-- ============================================
-- BLOCO 7: TABELAS DE LIGAÇÃO
-- ============================================
CREATE TABLE story_articles (
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES raw_articles(id) ON DELETE CASCADE,
  relevance FLOAT DEFAULT 1.0,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (story_id, article_id)
);

-- ============================================
-- BLOCO 8: TABELA analysis
-- ============================================
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
  model_used TEXT,
  tokens_used INT DEFAULT 0,
  raw_response JSONB
);

-- ============================================
-- BLOCO 9: ÍNDICES
-- ============================================
CREATE INDEX idx_articles_status ON raw_articles(status);
CREATE INDEX idx_articles_published ON raw_articles(published_at DESC);
CREATE INDEX idx_articles_source ON raw_articles(source_id);
CREATE INDEX idx_articles_hash ON raw_articles(content_hash);
CREATE INDEX idx_stories_updated ON stories(updated_at DESC);
CREATE INDEX idx_stories_cycle ON stories(cycle);
CREATE INDEX idx_analysis_bias ON analysis(political_bias);

-- ============================================
-- BLOCO 10: VIEW v_story_indicators
-- ============================================
CREATE VIEW v_story_indicators AS
SELECT
  s.id,
  s.title,
  s.summary,
  s.main_subject,
  s.cycle,
  s.article_count,
  s.started_at,
  s.updated_at,
  s.archived,
  AVG(a.bias_score) AS avg_bias,
  AVG(a.sentiment_score) AS avg_sentiment,
  COUNT(a.id) AS analyzed_count
FROM stories s
LEFT JOIN story_articles sa ON sa.story_id = s.id
LEFT JOIN raw_articles ra ON ra.id = sa.article_id
LEFT JOIN analysis a ON a.article_id = sa.article_id
GROUP BY s.id;

-- ============================================
-- BLOCO 11: SEED - Fontes
-- ============================================
INSERT INTO sources (slug, name, url, rss_url, type, country, language, ideology, config) VALUES
  ('g1', 'G1', 'https://g1.globo.com', 'https://g1.globo.com/rss/g1/', 'rss', 'BR', 'pt', 'centro-esquerda', '{}'),
  ('folha', 'Folha de S.Paulo', 'https://www.folha.uol.com.br', 'https://feeds.folha.uol.com.br/emais/rss091.xml', 'rss', 'BR', 'pt', 'centro-esquerda', '{}'),
  ('cnn', 'CNN Brasil', 'https://www.cnnbrasil.com.br', 'https://www.cnnbrasil.com.br/rss', 'rss', 'BR', 'pt', 'centro', '{}'),
  ('bbc', 'BBC Brasil', 'https://www.bbc.com/portuguese', 'https://feeds.bbci.co.uk/portuguese/rss.xml', 'rss', 'GB', 'pt', 'centro', '{}')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute após todos os blocos:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- SELECT slug FROM sources;