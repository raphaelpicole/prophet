-- ============================================================
-- Migration 001: Schema inicial
-- Criado em: 2026-04-12
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_plan AS ENUM ('free', 'pro', 'intelligence', 'enterprise');
CREATE TYPE article_status AS ENUM ('pending', 'processing', 'analyzed', 'archived');
CREATE TYPE alert_type AS ENUM ('cycle_phase', 'prediction', 'historical_similarity', 'trend_alert');

-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(254) NOT NULL,
  password_hash   VARCHAR(255),
  name            VARCHAR(200),
  plan            user_plan NOT NULL DEFAULT 'free',
  analyses_count  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted         BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted = FALSE;
CREATE INDEX idx_users_plan  ON users(plan);

-- ============================================================
-- 2. SOURCES
-- ============================================================

CREATE TABLE sources (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(200) NOT NULL,
  domain            VARCHAR(200) NOT NULL,
  bias_historic     JSONB DEFAULT '{
    "ideologico": null,
    "economico": null,
    "geopolitico": null,
    "social": null,
    "framing": null,
    "emocional": null,
    "temporal": null,
    "authority": null
  }'::jsonb,
  reliability_score NUMERIC(3,2) DEFAULT 0.50,
  flags             JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT sources_domain_unique UNIQUE (domain)
);

CREATE INDEX idx_sources_domain ON sources(domain);

-- ============================================================
-- 3. AUTHORS
-- ============================================================

CREATE TABLE authors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(200) NOT NULL,
  source_id  UUID REFERENCES sources(id) ON DELETE SET NULL,
  known_for  TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_authors_source ON authors(source_id);


-- ============================================================
-- 4. REGIONS
-- ============================================================

CREATE TABLE regions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      VARCHAR(200) NOT NULL,
  code      CHAR(3),
  parent_id UUID REFERENCES regions(id) ON DELETE SET NULL
);

CREATE INDEX idx_regions_code    ON regions(code);
CREATE INDEX idx_regions_parent  ON regions(parent_id);

-- ============================================================
-- 5. SUBJECTS
-- ============================================================

CREATE TABLE subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  slug        VARCHAR(200) NOT NULL,
  description TEXT,
  parent_id   UUID REFERENCES subjects(id) ON DELETE SET NULL,
  cycle_tags  TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT subjects_slug_unique UNIQUE (slug)
);

CREATE INDEX idx_subjects_slug    ON subjects(slug);
CREATE INDEX idx_subjects_parent  ON subjects(parent_id);


-- ============================================================
-- 6. CHARACTERS
-- ============================================================

CREATE TABLE characters (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(200) NOT NULL,
  role       VARCHAR(100),
  region_id  UUID REFERENCES regions(id) ON DELETE SET NULL,
  aliases    TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX idx_characters_region ON characters(region_id);

-- ============================================================
-- 7. CATEGORIES (8 categorias de viés)
-- ============================================================

CREATE TABLE categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key            VARCHAR(50) NOT NULL,
  name           VARCHAR(100) NOT NULL,
  description    TEXT,
  weight_default NUMERIC(3,2) DEFAULT 1.00,
  display_order  INT NOT NULL DEFAULT 0,

  CONSTRAINT categories_key_unique UNIQUE (key)
);

CREATE INDEX idx_categories_key_order ON categories(display_order);

-- ============================================================
-- 8. CYCLES
-- ============================================================

CREATE TABLE cycles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(200) NOT NULL,
  period_years     NUMERIC(4,1),
  phase            VARCHAR(50),
  description      TEXT,
  current_position NUMERIC(5,4) DEFAULT 0.5,
  confidence       NUMERIC(3,2) DEFAULT 0.5,
  metadata         JSONB DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cycles_name   ON cycles(name);
CREATE INDEX idx_cycles_phase ON cycles(phase);

-- ============================================================
-- 9. HISTORICAL_EVENTS
-- ============================================================

CREATE TABLE historical_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  date_start    DATE,
  date_end      DATE,
  subject_ids   UUID[] DEFAULT '{}',
  region_ids    UUID[] DEFAULT '{}',
  character_ids UUID[] DEFAULT '{}',
  embedding     VECTOR(1536),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- pgvector index para相似性搜索
CREATE INDEX idx_historical_events_embedding
  ON historical_events
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_historical_events_date_start ON historical_events(date_start);


-- ============================================================
-- 10. ARTICLES
-- ============================================================

CREATE TABLE articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(500) NOT NULL,
  content      TEXT,
  content_hash VARCHAR(64) NOT NULL,
  source_id    UUID REFERENCES sources(id) ON DELETE SET NULL,
  author_id    UUID REFERENCES authors(id) ON DELETE SET NULL,
  url          TEXT,
  published_at TIMESTAMPTZ,
  lang         CHAR(2) DEFAULT 'pt',
  status       article_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT articles_content_hash_unique UNIQUE (content_hash)
);

CREATE INDEX idx_articles_hash         ON articles(content_hash);
CREATE INDEX idx_articles_source       ON articles(source_id);
CREATE INDEX idx_articles_author       ON articles(author_id);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_status       ON articles(status);
CREATE INDEX idx_articles_lang         ON articles(lang);

-- ============================================================
-- 11. ARTICLE_ANALYSES
-- ============================================================

CREATE TABLE article_analyses (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id        UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_bias_score NUMERIC(5,4) NOT NULL DEFAULT 0.5,
  bias_by_category  JSONB NOT NULL DEFAULT '{}'::jsonb,
  indicators        JSONB DEFAULT '[]'::jsonb,
  llm_explanation  TEXT,
  metadata         JSONB DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_article_user_analysis UNIQUE (article_id, user_id)
);

CREATE INDEX idx_analyses_article  ON article_analyses(article_id);
CREATE INDEX idx_analyses_user    ON article_analyses(user_id);
CREATE INDEX idx_analyses_created ON article_analyses(created_at DESC);

-- ============================================================
-- 12. ARTICLE_CATEGORIES
-- ============================================================

CREATE TABLE article_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES article_analyses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  score       NUMERIC(5,4) NOT NULL DEFAULT 0.5,
  indicators  JSONB DEFAULT '[]'::jsonb,
  explanation TEXT,

  CONSTRAINT unique_analysis_category UNIQUE (analysis_id, category_id)
);

CREATE INDEX idx_article_categories_analysis ON article_categories(analysis_id);
CREATE INDEX idx_article_categories_category ON article_categories(category_id);

-- ============================================================
-- 13. ARTICLE_SUBJECTS
-- ============================================================

CREATE TABLE article_subjects (
  article_id  UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  confidence  NUMERIC(3,2) DEFAULT 0.5,

  PRIMARY KEY (article_id, subject_id)
);

CREATE INDEX idx_article_subjects_article ON article_subjects(article_id);
CREATE INDEX idx_article_subjects_subject ON article_subjects(subject_id);

-- ============================================================
-- 14. ARTICLE_REGIONS
-- ============================================================

CREATE TABLE article_regions (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  region_id  UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,

  PRIMARY KEY (article_id, region_id)
);

CREATE INDEX idx_article_regions_article ON article_regions(article_id);
CREATE INDEX idx_article_regions_region  ON article_regions(region_id);

-- ============================================================
-- 15. ARTICLE_CHARACTERS
-- ============================================================

CREATE TABLE article_characters (
  article_id   UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

  PRIMARY KEY (article_id, character_id)
);

CREATE INDEX idx_article_characters_article  ON article_characters(article_id);
CREATE INDEX idx_article_characters_character ON article_characters(character_id);

-- ============================================================
-- 16. ARTICLE_CYCLES
-- ============================================================

CREATE TABLE article_cycles (
  article_id          UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  cycle_id            UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  similarity          NUMERIC(3,2) DEFAULT 0.0,
  historical_event_id UUID REFERENCES historical_events(id) ON DELETE SET NULL,

  PRIMARY KEY (article_id, cycle_id)
);

CREATE INDEX idx_article_cycles_article     ON article_cycles(article_id);
CREATE INDEX idx_article_cycles_cycle       ON article_cycles(cycle_id);
CREATE INDEX idx_article_cycles_similarity ON article_cycles(similarity DESC);

-- ============================================================
-- 17. DASHBOARD_CACHE
-- ============================================================

CREATE TABLE dashboard_cache (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_from DATE NOT NULL,
  period_to   DATE NOT NULL,
  data        JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_period_cache UNIQUE (user_id, period_from, period_to)
);

CREATE INDEX idx_dashboard_cache_user   ON dashboard_cache(user_id);
CREATE INDEX idx_dashboard_cache_period ON dashboard_cache(period_from, period_to);

-- ============================================================
-- 18. ALERTS
-- ============================================================

CREATE TABLE alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cycle_id     UUID REFERENCES cycles(id) ON DELETE SET NULL,
  type         alert_type NOT NULL,
  title        VARCHAR(300) NOT NULL,
  message      TEXT,
  probability  NUMERIC(3,2),
  horizon      VARCHAR(50),
  read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_user    ON alerts(user_id);
CREATE INDEX idx_alerts_read   ON alerts(read) WHERE read = FALSE;
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cycles_updated_at
  BEFORE UPDATE ON cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Contador de análises
CREATE OR REPLACE FUNCTION increment_analyses_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET analyses_count = analyses_count + 1 WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_analyses_count
  AFTER INSERT ON article_analyses
  FOR EACH ROW EXECUTE FUNCTION increment_analyses_count();

-- ============================================================
-- PERMISSIONS (RLS - Multi-tenant)
-- ============================================================

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_cache ENABLE ROW LEVEL SECURITY;

-- Policies (definidas depois, quando app_current_user_id estiver setado)
-- Por ora, comentamos para permitir superuser setup

-- CREATE POLICY user_isolation ON users
--   USING (id = current_setting('app.current_user_id', true)::uuid);
--
-- CREATE POLICY user_isolation_analyses ON article_analyses
--   USING (user_id = current_setting('app.current_user_id', true)::uuid);
--
-- CREATE POLICY user_isolation_alerts ON alerts
--   USING (user_id = current_setting('app.current_user_id', true)::uuid);
--
-- CREATE POLICY user_isolation_cache ON dashboard_cache
--   USING (user_id = current_setting('app.current_user_id', true)::uuid);
