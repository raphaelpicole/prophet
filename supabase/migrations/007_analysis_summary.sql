-- analysis_summary: stores daily cycle+region aggregated stats
-- Populated by /api/indicators on each request (if not already stored for today)
CREATE TABLE IF NOT EXISTS analysis_summary (
  id                uuid default gen_random_uuid() primary key,
  cycle             text not null,
  region            text not null,
  date              date not null default current_date,
  total_stories     int default 0,
  total_articles    int default 0,
  avg_article_count float default 0,
  top_subjects      jsonb default '[]',
  sentiment_breakdown jsonb default '{"up":0,"stable":0,"down":0}',
  updated_at        timestamptz default now(),
  unique(cycle, region, date)
);

CREATE INDEX IF NOT EXISTS idx_analysis_summary_cycle_region_date
  ON analysis_summary(cycle, region, date desc);

CREATE INDEX IF NOT EXISTS idx_analysis_summary_date
  ON analysis_summary(date desc);

COMMENT ON TABLE analysis_summary IS 'Daily aggregated stats per cycle+region, populated by indicators API';