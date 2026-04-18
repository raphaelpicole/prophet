-- Logs table for Prophet monitoring
CREATE TABLE IF NOT EXISTS logs (
  id          uuid default gen_random_uuid() primary key,
  level       text not null default 'error',  -- info, warn, error, critical
  source      text,                            -- flutter, node, cron-collect, api
  message     text not null,
  context     jsonb,
  resolved    boolean default false,
  created_at  timestamptz default now()
);

-- Auto-cleanup: keep only last 7 days
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM logs WHERE created_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql;

-- Auto cleanup trigger (daily)
CREATE OR REPLACE FUNCTION schedule_log_cleanup()
RETURNS void AS $$
BEGIN
  PERFORM cleanup_old_logs();
END;
$$ LANGUAGE plpgsql;

-- Index for querying recent logs by source/level
CREATE INDEX IF NOT EXISTS idx_logs_source_level ON logs(source, level, created_at desc);
CREATE INDEX IF NOT EXISTS idx_logs_unresolved ON logs(resolved) WHERE resolved = false;

-- Seed some example error logs so the API is visible
INSERT INTO logs (level, source, message, context) VALUES
  ('error', 'cron-collect', 'RSS fetch failed for g1.globo.com: timeout after 10s', '{"feed": "https://g1.globo.com/rss/g1/brasil/", "attempt": 2}'),
  ('warn', 'node', 'Rate limit hit on Supabase REST API - backing off 5s', '{"endpoint": "/rest/v1/raw_articles", "retryCount": 3}'),
  ('info', 'flutter', 'User opened MapScreen from bottom nav', '{"userId": "anon", "screen": "map"}'),
  ('error', 'api', 'Story grouping failed: no articles matched similarity threshold', '{"storyId": "abc-123", "threshold": 0.7}')
ON CONFLICT DO NOTHING;