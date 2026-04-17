-- ============================================================
-- Migration 008: Full-Text Search + Final indexes
-- ============================================================

-- ============================================================
-- FTS: Articles
-- ============================================================

ALTER TABLE articles
ADD COLUMN fts TSVECTOR
GENERATED ALWAYS AS (
  to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(content, ''))
) STORED;

CREATE INDEX idx_articles_fts ON articles USING gin(fts);

-- ============================================================
-- FTS: Historical Events
-- ============================================================

ALTER TABLE historical_events
ADD COLUMN fts TSVECTOR
GENERATED ALWAYS AS (
  to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, ''))
) STORED;

CREATE INDEX idx_historical_events_fts ON historical_events USING gin(fts);

-- ============================================================
-- FTS: Subjects
-- ============================================================

ALTER TABLE subjects
ADD COLUMN fts TSVECTOR
GENERATED ALWAYS AS (
  to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(description, ''))
) STORED;

CREATE INDEX idx_subjects_fts ON subjects USING gin(fts);

-- ============================================================
-- Function: Vector similarity search (pgvector)
-- ============================================================

CREATE OR REPLACE FUNCTION match_historical_events(
  query_embedding VECTOR(1536),
  match_threshold NUMERIC DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  date_start DATE,
  similarity NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    he.id,
    he.title,
    he.description,
    he.date_start,
    1 - (he.embedding <=> query_embedding) AS similarity
  FROM historical_events he
  WHERE 1 - (he.embedding <=> query_embedding) > match_threshold
  ORDER BY he.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- Function: Dashboard aggregate (v1)
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_data(
  p_user_id UUID,
  p_period_from DATE,
  p_period_to DATE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Tenta pegar do cache primeiro
  SELECT data INTO v_result
  FROM dashboard_cache
  WHERE user_id = p_user_id
    AND period_from = p_period_from
    AND period_to = p_period_to
    AND computed_at > NOW() - INTERVAL '1 hour';

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  -- Se não tem cache, calcula
  SELECT jsonb_build_object(
    'period', jsonb_build_object(
      'from', p_period_from,
      'to', p_period_to
    ),
    'stats', (
      SELECT jsonb_build_object(
        'total_analyses', COUNT(DISTINCT aa.id),
        'unique_sources', COUNT(DISTINCT a.source_id),
        'unique_subjects', COUNT(DISTINCT ar.subject_id),
        'regions_involved', COUNT(DISTINCT arr.region_id)
      )
      FROM article_analyses aa
      JOIN articles a ON a.id = aa.article_id
      LEFT JOIN article_subjects ar ON ar.article_id = a.id
      LEFT JOIN article_regions arr ON arr.article_id = a.id
      WHERE aa.user_id = p_user_id
        AND aa.created_at::date BETWEEN p_period_from AND p_period_to
    ),
    'bias_by_category', (
      SELECT jsonb_agg(jsonb_build_object(
        'category', c.key,
        'score_avg', ROUND(AVG(ac.score)::numeric, 4),
        'trend', 'stable'
      ))
      FROM article_analyses aa
      JOIN article_categories ac ON ac.analysis_id = aa.id
      JOIN categories c ON c.id = ac.category_id
      WHERE aa.user_id = p_user_id
        AND aa.created_at::date BETWEEN p_period_from AND p_period_to
      GROUP BY c.key, c.display_order
      ORDER BY c.display_order
    ),
    'top_sources', (
      SELECT jsonb_agg(sub.*)
      FROM (
        SELECT
          s.name AS source,
          COUNT(*) AS count,
          ROUND(AVG(aa.overall_bias_score)::numeric, 2) AS avg_bias
        FROM article_analyses aa
        JOIN articles a ON a.id = aa.article_id
        JOIN sources s ON s.id = a.source_id
        WHERE aa.user_id = p_user_id
          AND aa.created_at::date BETWEEN p_period_from AND p_period_to
        GROUP BY s.id, s.name
        ORDER BY count DESC
        LIMIT 10
      ) sub
    ),
    'recent_articles', (
      SELECT jsonb_agg(sub.*)
      FROM (
        SELECT
          a.id,
          a.title,
          s.name AS source,
          aa.overall_bias_score AS score,
          a.published_at
        FROM article_analyses aa
        JOIN articles a ON a.id = aa.article_id
        JOIN sources s ON s.id = a.source_id
        WHERE aa.user_id = p_user_id
        ORDER BY aa.created_at DESC
        LIMIT 10
      ) sub
    )
  ) INTO v_result;

  -- Salva no cache
  INSERT INTO dashboard_cache (user_id, period_from, period_to, data)
  VALUES (p_user_id, p_period_from, p_period_to, v_result)
  ON CONFLICT (user_id, period_from, period_to)
  DO UPDATE SET data = v_result, computed_at = NOW();

  RETURN v_result;
END;
$$;

-- ============================================================
-- Seed: Roles (application roles)
-- ============================================================

CREATE TYPE app_role AS ENUM ('admin', 'analyst', 'viewer');

-- ============================================================
-- Seed: API Keys table (para API access do plano Intelligence)
-- ============================================================

CREATE TABLE api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash    VARCHAR(64) NOT NULL,
  name        VARCHAR(100),
  last_used   TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT key_hash_unique UNIQUE (key_hash)
);

CREATE INDEX idx_api_keys_user    ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- ============================================================
-- Seed: Audit Log (opcional, para compliance)
-- ============================================================

CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID,
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(50),
  entity_id  UUID,
  metadata   JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user     ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity   ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_created  ON audit_log(created_at DESC);
