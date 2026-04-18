-- ============================================
-- Fase 4: SQL de setup — regions + v_source_stats
-- ============================================
-- Rodar no Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/jtyxsxyesliekbuhgkje/sql

-- ─────────────────────────────────────────────
-- 1. regions table (cascata com stories)
-- ─────────────────────────────────────────────
create table if not exists regions (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  code        text not null unique,
  parent_id   uuid references regions(id) on delete set null,
  created_at  timestamptz default now()
);

create index if not exists idx_regions_parent on regions(parent_id);

-- ─────────────────────────────────────────────
-- 2. v_source_stats view (stats por fonte)
-- ─────────────────────────────────────────────
create or replace view v_source_stats as
select
  s.id,
  s.slug,
  s.name,
  s.ideology,
  s.active,
  s.last_fetched_at,
  s.fetch_error_count,
  coalesce(total.total, 0)      as total_articles,
  coalesce(day24.count, 0)       as articles_24h,
  coalesce(analyzed.count, 0)     as analyzed_count,
  coalesce(failed.count, 0)      as failed_count
from sources s
left join (
  select source_id, count(*) as total
  from raw_articles
  group by source_id
) total on total.source_id = s.id
left join (
  select source_id, count(*) as count
  from raw_articles
  where published_at > now() - interval '24 hours'
  group by source_id
) day24 on day24.source_id = s.id
left join (
  select source_id, count(*) as count
  from raw_articles
  where status = 'analyzed'
  group by source_id
) analyzed on analyzed.source_id = s.id
left join (
  select source_id, count(*) as count
  from raw_articles
  where status = 'failed'
  group by source_id
) failed on failed.source_id = s.id;

-- ─────────────────────────────────────────────
-- 3. Seed regions (dados iniciais)
-- ─────────────────────────────────────────────
insert into regions (name, code, parent_id) values
  ('🌍 Global',         'GLB', null),
  ('🌎 América do Sul', 'SAM', null),
  ('🇧🇷 Brasil',        'BRA', (select id from regions where code = 'SAM')),
  ('🌐 América do Norte','NAM', null),
  ('🇺🇸 Estados Unidos','USA', (select id from regions where code = 'NAM')),
  ('🌍 Europa',         'EUR', null),
  ('🌏 Ásia',           'ASI', null),
  ('🟡 Oriente Médio',  'MID', null),
  ('🌿 África',         'AFR', null),
  ('🔵 Oceania',        'OCE', null)
on conflict (code) do nothing;
