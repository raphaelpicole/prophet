-- Historical events table
create table if not exists historical_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  event_date date not null,
  end_date date,
  cycle_type text not null check (cycle_type in ('economico', 'conflito', 'politico', 'cultural', 'ambiental', 'social', 'tecnologico')),
  region text,
  tags text[],
  significance int default 1,
  outcome text,
  source text,
  created_at timestamptz default now()
);

-- Cycle patterns table
create table if not exists cycle_patterns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cycle_type text not null,
  description text,
  avg_duration_years decimal(4,1),
  recurrence_years int,
  indicators text[],
  phase text,
  historical_count int default 0,
  created_at timestamptz default now()
);

-- Predictions table new columns for historical context
alter table predictions add column if not exists historical_analogue text;
alter table predictions add column if not exists reasoning text;
alter table predictions add column if not exists confidence text;
alter table predictions add column if not exists horizon_days int;

-- Indexes
create index if not exists idx_historical_events_cycle_type on historical_events(cycle_type);
create index if not exists idx_historical_events_date on historical_events(event_date);
create index if not exists idx_historical_events_tags on historical_events using gin(tags);
create index if not exists idx_cycle_patterns_type on cycle_patterns(cycle_type);

-- RLS
alter table historical_events enable row level security;
alter table cycle_patterns enable row level security;

create policy "Allow all read historical_events" on historical_events for select using (true);
create policy "Allow all read cycle_patterns" on cycle_patterns for select using (true);
create policy "Allow anon insert historical_events" on historical_events for insert with check (true);
create policy "Allow anon insert cycle_patterns" on cycle_patterns for insert with check (true);