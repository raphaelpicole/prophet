# Prophet — Schema & API (Design Final)

## Extensões PostgreSQL

```sql
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "vector";
```

---

## Enums

```sql
create type source_type as enum ('rss', 'scrape', 'api');
create type entity_type as enum ('person', 'org', 'place');
create type article_status as enum ('pending', 'analyzing', 'analyzed', 'failed');
create type bias_label as enum (
  'esquerda', 'centro-esquerda', 'centro', 'centro-direita', 'direita', 'indefinido'
);
create type sentiment_label as enum ('positivo', 'neutro', 'negativo');
create type cycle_type as enum (
  'conflito', 'pandemia', 'economico', 'politico',
  'social', 'tecnologico', 'ambiental', 'cultural'
);
create type article_tone as enum (
  'informativo', 'analitico', 'combativo', 'sensacionalista', 'opinativo'
);
create type narrative_role as enum (
  'primeira_fonte', 'reforco', 'contraponto', 'exclusiva'
);
```

---

## Tabelas

### 1. sources — Fontes de notícia

```sql
create table sources (
  id              uuid default uuid_generate_v4() primary key,
  slug            text not null unique,
  name            text not null,
  url             text not null,
  rss_url         text,
  type            source_type not null default 'rss',
  country         char(2) not null default 'BR',
  language        char(2) not null default 'pt',
  active          boolean default true,
  ideology        bias_label default 'indefinido',
  config          jsonb default '{}',
  last_fetched_at timestamptz,
  fetch_error_count int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

### 2. raw_articles — Notícias brutas

```sql
create table raw_articles (
  id            uuid default uuid_generate_v4() primary key,
  source_id     uuid not null references sources(id) on delete cascade,
  title         text not null,
  url           text not null unique,
  content       text,
  summary       text,
  author        text,
  image_url     text,
  published_at  timestamptz,
  collected_at  timestamptz default now(),
  content_hash  text,
  title_norm    text generated always as (
    lower(regexp_replace(title, '[^\w\s]', '', 'g'))
  ) stored,
  embedding     vector(1536),
  status        article_status default 'pending',
  retry_count   int default 0,
  last_error    text,
  word_count    int generated always as (
    coalesce(array_length(regexp_split_to_array(coalesce(content, ''), '\s+'), 1), 0)
  ) stored
);
```

### 3. analysis — Análise LLM por artigo

```sql
create table analysis (
  id                uuid default uuid_generate_v4() primary key,
  article_id        uuid not null unique references raw_articles(id) on delete cascade,

  -- Análise básica
  political_bias    bias_label default 'indefinido',
  sentiment         sentiment_label default 'neutro',
  bias_score        real default 0,
  sentiment_score   real default 0,
  categories        jsonb default '[]',
  confidence        real default 0,
  analysis_version  int default 1,
  analyzed_at       timestamptz default now(),
  model_used        text,
  tokens_used       int default 0,
  raw_response      jsonb,

  -- Análise narrativa (novos)
  framing           text,                     -- enquadramento jornalístico
  tone              article_tone,             -- tom editorial
  omitted_facts     jsonb default '[]',       -- fatos que poderiam ter sido mencionados
  narrative_role    narrative_role,           -- papel narrativo na story
  vocabulary_level  text,                     -- 'popular' | 'medio' | 'formal' | 'acadêmico'
  emotion_score     real default 0,           -- 0 a 1, nível de apelo emocional
  main_subject      text,                     -- assunto principal extraído pelo LLM
  key_facts         jsonb default '[]'        -- fatos-chave identificados no artigo
);
```

### 4. stories — Histórias (agrupamento)

```sql
create table stories (
  id              uuid default uuid_generate_v4() primary key,
  title           text not null,
  summary         text,
  main_subject    text not null,
  cycle           cycle_type not null default 'politico',
  sentiment_trend text default 'stable',
  hotness         int default 0,
  article_count   int default 1,
  started_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  archived        boolean default false,
  divergence_score real default 0,           -- 0 a 1, quanto as fontes divergem
  dominant_frame  text                       -- enquadramento dominante
);
```

### 5. story_articles — N:N story ↔ artigo

```sql
create table story_articles (
  story_id   uuid not null references stories(id) on delete cascade,
  article_id uuid not null references raw_articles(id) on delete cascade,
  relevance  float default 1.0,
  linked_at  timestamptz default now(),
  primary key (story_id, article_id)
);
```

### 6. entities — Entidades (pessoas, orgs, lugares)

```sql
create table entities (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  type        entity_type not null default 'person',
  aliases     jsonb default '[]',
  description text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(name, type)
);
```

### 7. article_entities — Menções em artigos

```sql
create table article_entities (
  article_id  uuid not null references raw_articles(id) on delete cascade,
  entity_id   uuid not null references entities(id) on delete cascade,
  role        text,
  sentiment   sentiment_label,
  primary key (article_id, entity_id)
);
```

### 8. story_entities — Entidades nas stories (agregado)

```sql
create table story_entities (
  story_id      uuid not null references stories(id) on delete cascade,
  entity_id     uuid not null references entities(id) on delete cascade,
  mention_count int default 1,
  primary key (story_id, entity_id)
);
```

### 9. regions — Regiões geográficas

```sql
create table regions (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null unique,
  code        char(3) not null unique,
  parent_id   uuid references regions(id),
  created_at  timestamptz default now()
);
```

### 10. article_regions / story_regions

```sql
create table article_regions (
  article_id uuid not null references raw_articles(id) on delete cascade,
  region_id  uuid not null references regions(id) on delete cascade,
  primary key (article_id, region_id)
);

create table story_regions (
  story_id uuid not null references stories(id) on delete cascade,
  region_id uuid not null references regions(id) on delete cascade,
  primary key (story_id, region_id)
);
```

### 11. narrative_analysis — Análise comparativa por story

```sql
create table narrative_analysis (
  id                uuid default uuid_generate_v4() primary key,
  story_id          uuid not null unique references stories(id) on delete cascade,
  analyzed_at       timestamptz default now(),

  -- Enquadramento
  dominant_frame    text,
  framing_variance  real default 0,

  -- Fatos
  consensus_facts   jsonb default '[]',
  disputed_facts    jsonb default '[]',
  omitted_facts     jsonb default '[]',

  -- Tom e estilo
  tone_analysis     jsonb default '{}',

  -- Entidades
  entity_prominence jsonb default '[]',

  -- Viés
  bias_spread       jsonb default '{}',

  -- Evolução
  narrative_shift   text
);
```

### 12. source_narrative_profile — Perfil de cada fonte

```sql
create table source_narrative_profile (
  id                  uuid default uuid_generate_v4() primary key,
  source_id           uuid not null unique references sources(id) on delete cascade,
  updated_at          timestamptz default now(),

  editorial_line     text,
  typical_tone        article_tone,
  avg_article_length int,
  vocabulary_level   text,
  preferred_frames   jsonb default '[]',
  entity_preferences jsonb default '{}',
  omission_patterns  jsonb default '[]',
  total_analyzed     int default 0,
  avg_bias_score     real default 0,
  avg_sentiment      real default 0,
  avg_confidence     real default 0,
  coverage_rate      real default 0,
  avg_response_time_min int default 0
);
```

### 13. narrative_timeline — Snapshots temporais

```sql
create table narrative_timeline (
  id              uuid default uuid_generate_v4() primary key,
  story_id        uuid not null references stories(id) on delete cascade,
  source_id       uuid not null references sources(id) on delete cascade,
  article_id      uuid not null references raw_articles(id) on delete cascade,
  timestamp       timestamptz not null,

  frame           text,
  key_facts       jsonb default '[]',
  tone            article_tone,
  bias_score      real,
  sentiment_score real,

  narrative_delta text,
  new_facts_added jsonb default '[]',
  facts_dropped   jsonb default '[]'
);
```

### 14. pipeline_log — Auditoria

```sql
create table pipeline_log (
  id          uuid default uuid_generate_v4() primary key,
  run_id      uuid not null,
  step        text not null,
  source_id   uuid references sources(id),
  status      text not null,
  message     text,
  count       int default 0,
  duration_ms int,
  created_at  timestamptz default now()
);
```

### 15. alerts — Alertas do sistema

```sql
create table alerts (
  id          uuid default uuid_generate_v4() primary key,
  type        text not null,                  -- 'divergence' | 'omission' | 'shift' | 'cycle' | 'entity' | 'prediction'
  story_id    uuid references stories(id),
  source_id   uuid references sources(id),
  prediction_id uuid references predictions(id),
  severity    text not null default 'info',   -- 'info' | 'warning' | 'critical'
  title       text not null,
  description text,
  data        jsonb default '{}',
  read        boolean default false,
  created_at  timestamptz default now()
);
```

### 16. historical_events — Base de fatos históricos

```sql
create table historical_events (
  id              uuid default uuid_generate_v4() primary key,
  title           text not null,
  description     text,
  event_date      date not null,
  event_type      text not null,              -- 'conflito' | 'crise_economica' | 'eleicao' | 'golpe' | 'pandemia' | 'acordo' | 'protesto' | 'reforma' | 'escandalo' | 'desastre' | 'revolucao'
  region_id       uuid references regions(id),
  country         char(2),
  causes          jsonb default '[]',
  consequences    jsonb default '[]',
  key_entities    jsonb default '[]',
  related_cycles  jsonb default '[]',
  parent_event_id uuid references historical_events(id),
  similarity_tags jsonb default '[]',
  source_url      text,
  source_name     text,
  confidence      real default 0.9,
  created_at      timestamptz default now()
);
```

### 17. event_patterns — Padrões recorrentes

```sql
create table event_patterns (
  id              uuid default uuid_generate_v4() primary key,
  name            text not null unique,
  description     text,
  sequence        jsonb not null,              -- [{step, type, description}]
  typical_duration text,
  trigger_conditions jsonb default '[]',
  occurrence_count int default 0,
  success_rate    real default 0,
  avg_time_between_steps jsonb default '{}',
  applicable_regions jsonb default '[]',
  applicable_cycles  jsonb default '[]',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

### 18. predictions — Previsões do Profeta

```sql
create type prediction_status as enum ('active', 'partially_correct', 'correct', 'incorrect', 'expired');

create table predictions (
  id                uuid default uuid_generate_v4() primary key,
  created_at        timestamptz default now(),
  title             text not null,
  description       text,
  probability       real not null,              -- 0.0 a 1.0
  confidence        real default 0,
  time_horizon      text,                       -- '30 dias' | '6 meses' | '1 ano'
  story_id          uuid references stories(id),
  pattern_id        uuid references event_patterns(id),
  matched_historical jsonb default '[]',
  trigger_facts     jsonb default '[]',
  narrative_signals jsonb default '[]',
  prediction_type   text not null,
  region_id         uuid references regions(id),
  cycle             cycle_type,
  affected_entities jsonb default '[]',
  status            prediction_status default 'active',
  resolved_at       timestamptz,
  resolution_notes  text,
  resolution_source text,
  brier_score       real,
  calibration_score real
);
```

### 19. prediction_updates — Atualizações bayesianas

```sql
create table prediction_updates (
  id              uuid default uuid_generate_v4() primary key,
  prediction_id   uuid not null references predictions(id) on delete cascade,
  updated_at      timestamptz default now(),
  old_probability real not null,
  new_probability real not null,
  delta           real not null,
  reason          text not null,
  trigger_article_id uuid references raw_articles(id),
  trigger_type       text,
  trigger_data       jsonb default '{}'
);
```

### 20. prediction_audits — Track record

```sql
create table prediction_audits (
  id                uuid default uuid_generate_v4() primary key,
  period_start      date not null,
  period_end        date not null,
  total_predictions int default 0,
  correct           int default 0,
  partially_correct int default 0,
  incorrect          int default 0,
  expired           int default 0,
  avg_brier_score   real,
  calibration_slope real,
  by_type           jsonb default '{}',
  by_horizon        jsonb default '{}',
  notes             text,
  created_at        timestamptz default now()
);
```

---

## Índices

```sql
-- Artigos
create index idx_articles_status on raw_articles(status);
create index idx_articles_published on raw_articles(published_at desc);
create index idx_articles_source on raw_articles(source_id);
create index idx_articles_hash on raw_articles(content_hash) where content_hash is not null;
create index idx_articles_title_trgm on raw_articles using gin(title_norm gin_trgm_ops);

-- Embedding
create index idx_articles_embedding on raw_articles
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64)
  where embedding is not null;

-- Stories
create index idx_stories_updated on stories(updated_at desc);
create index idx_stories_subject on stories(main_subject);
create index idx_stories_cycle on stories(cycle);
create index idx_stories_hot on stories(hotness desc) where not archived;
create index idx_stories_divergence on stories(divergence_score desc) where not archived;

-- Analysis
create index idx_analysis_bias on analysis(political_bias);
create index idx_analysis_tone on analysis(tone);
create index idx_analysis_model on analysis(model_used);

-- Timeline
create index idx_timeline_story on narrative_timeline(story_id, timestamp desc);
create index idx_timeline_source on narrative_timeline(source_id, timestamp desc);

-- Pipeline
create index idx_pipeline_run on pipeline_log(run_id);
create index idx_pipeline_step on pipeline_log(step, created_at desc);

-- Entities
create index idx_entities_type on entities(type);
create index idx_entities_name_trgm on entities using gin(name gin_trgm_ops);

-- Alerts
create index idx_alerts_unread on alerts(read, created_at desc) where not read;
create index idx_alerts_type on alerts(type, created_at desc);
```

---

## Views

```sql
-- Dashboard: stories com indicadores agregados
create view v_story_indicators as
select
  s.id, s.title, s.summary, s.main_subject, s.cycle,
  s.article_count, s.hotness, s.started_at, s.updated_at, s.archived,
  s.divergence_score, s.dominant_frame,
  avg(a.bias_score) as avg_bias,
  avg(a.sentiment_score) as avg_sentiment,
  count(a.id) as analyzed_count,
  count(distinct ra.source_id) as source_count
from stories s
join story_articles sa on sa.story_id = s.id
join raw_articles ra on ra.id = sa.article_id
left join analysis a on a.article_id = sa.article_id
group by s.id;

-- Fontes: stats de coleta
create view v_source_stats as
select
  src.id, src.slug, src.name, src.ideology, src.active,
  count(ra.id) as total_articles,
  count(ra.id) filter (where ra.published_at >= now() - interval '24 hours') as articles_24h,
  count(ra.id) filter (where ra.status = 'analyzed') as analyzed_count,
  count(ra.id) filter (where ra.status = 'failed') as failed_count,
  src.last_fetched_at, src.fetch_error_count
from sources src
left join raw_articles ra on ra.source_id = src.id
group by src.id;

-- Comparação narrativa
create view v_narrative_comparison as
select
  s.id as story_id, s.title, s.main_subject,
  count(distinct ra.source_id) as source_count,
  count(distinct a.id) as article_count,
  avg(a.bias_score) as avg_bias,
  stddev(a.bias_score) as bias_spread,
  min(a.analyzed_at) as first_coverage,
  max(a.analyzed_at) as last_coverage,
  s.divergence_score
from stories s
join story_articles sa on sa.story_id = s.id
join raw_articles ra on ra.id = sa.article_id
join analysis a on a.article_id = ra.id
group by s.id;
```

---

## Seeds

```sql
-- Fontes
insert into sources (slug, name, url, rss_url, type, country, language, ideology, config) values
  ('g1',          'G1',               'https://g1.globo.com',             'https://g1.globo.com/rss/g1/',                     'rss',    'BR', 'pt', 'centro-esquerda', '{}'),
  ('folha',       'Folha de S.Paulo', 'https://www.folha.uol.com.br',     'https://feeds.folha.uol.com.br/folha/emaisp/rss091.xml', 'rss', 'BR', 'pt', 'centro-esquerda', '{}'),
  ('uol',         'UOL',              'https://www.uol.com.br',           'https://rss.uol.com.br/feed/noticias.xml',         'rss',    'BR', 'pt', 'centro-esquerda', '{}'),
  ('estadao',     'Estadão',          'https://www.estadao.com.br',       'https://www.estadao.com.br/rss',                   'rss',    'BR', 'pt', 'centro-direita',  '{}'),
  ('oglobo',      'O Globo',          'https://oglobo.globo.com',         'https://oglobo.globo.com/rss',                     'rss',    'BR', 'pt', 'centro-direita',  '{}'),
  ('metropoles',  'Metrópoles',       'https://www.metropoles.com',       null,                                               'scrape', 'BR', 'pt', 'centro',          '{"selectors": {"article": ".card-news", "title": "h3", "link": "a", "date": "time"}}'),
  ('icl',         'ICL Notícias',     'https://iclnoticias.com.br',       null,                                               'scrape', 'BR', 'pt', 'centro-esquerda', '{"selectors": {"article": "article", "title": "h2", "link": "a", "date": "time"}}'),
  ('bbc',         'BBC Brasil',       'https://www.bbc.com/portuguese',   'https://feeds.bbci.co.uk/portuguese/rss.xml',       'rss',    'GB', 'pt', 'centro',          '{}'),
  ('reuters',     'Reuters',          'https://www.reuters.com',           'https://feeds.reuters.com/reuters/topNews',        'rss',    'US', 'en', 'centro',          '{}'),
  ('cnn',         'CNN Brasil',       'https://www.cnnbrasil.com.br',     'https://www.cnnbrasil.com.br/rss',                 'rss',    'BR', 'pt', 'centro',          '{}')
on conflict (slug) do nothing;

-- Regiões
insert into regions (name, code, parent_id) values
  ('América do Norte', 'NAM', null),
  ('América do Sul',   'SAM', null),
  ('Europa',           'EUR', null),
  ('Ásia',             'ASI', null),
  ('África',           'AFR', null),
  ('Oriente Médio',    'MID', null),
  ('Oceania',          'OCE', null),
  ('Global',           'GLB', null),
  ('Brasil',           'BRA', (select id from regions where code = 'SAM')),
  ('Estados Unidos',   'USA', (select id from regions where code = 'NAM')),
  ('Argentina',        'ARG', (select id from regions where code = 'SAM')),
  ('China',            'CHN', (select id from regions where code = 'ASI')),
  ('Leste Europeu',    'EEU', (select id from regions where code = 'EUR')),
  ('Leste Asiático',   'EAS', (select id from regions where code = 'ASI'))
on conflict (code) do nothing;
```

---

## API Endpoints

### Pipeline (execução)

| Método | Path | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/collect` | Executa pipeline completo (coleta → dedup → análise → agrupamento → narrativa) | cron key |
| `GET` | `/api/collect` | Status da última execução do pipeline | público |

### Stories

| Método | Path | Descrição | Query params |
|--------|------|-----------|-------------|
| `GET` | `/api/stories` | Lista stories com filtros | `cycle`, `bias`, `sentiment`, `region`, `search`, `limit`, `offset`, `sort` (hot/latest/divergent) |
| `GET` | `/api/stories/:id` | Detalhe de uma story | — |
| `GET` | `/api/stories/:id/articles` | Artigos de uma story | `source_id`, `limit`, `offset` |

### Análise Narrativa

| Método | Path | Descrição | Query params |
|--------|------|-----------|-------------|
| `GET` | `/api/narrative/:storyId` | Análise narrativa comparativa | — |
| `GET` | `/api/narrative/:storyId/timeline` | Timeline de evolução narrativa | `source_id`, `from`, `to` |
| `GET` | `/api/narrative/insights` | Insights gerais (stories mais divergentes, omissões) | `period` (24h/7d/30d), `limit` |

### Fontes

| Método | Path | Descrição | Query params |
|--------|------|-----------|-------------|
| `GET` | `/api/sources` | Lista fontes com stats | — |
| `GET` | `/api/sources/:id` | Detalhe de uma fonte | — |
| `GET` | `/api/sources/:id/profile` | Perfil narrativo de uma fonte | — |
| `GET` | `/api/sources/:id/articles` | Artigos de uma fonte | `status`, `limit`, `offset` |

### Indicadores (Dashboard)

| Método | Path | Descrição | Query params |
|--------|------|-----------|-------------|
| `GET` | `/api/indicators` | KPIs gerais (totais, ciclos, hot stories) | — |
| `GET` | `/api/indicators/bias-spectrum` | Distribuição de viés de todas as fontes | — |
| `GET` | `/api/indicators/cycles` | Contagem e tendência por ciclo | `period` |
| `GET` | `/api/indicators/sentiment` | Sentimento médio e tendência | `period` |

### Entidades

| Método | Path | Descrição | Query params |
|--------|------|-----------|-------------|
| `GET` | `/api/entities` | Busca entidades | `search`, `type`, `limit` |
| `GET` | `/api/entities/:id` | Detalhe de uma entidade | — |
| `GET` | `/api/entities/:id/stories` | Stories que mencionam a entidade | `limit` |

### Regiões

| Método | Path | Descrição | Query params |
|--------|------|-----------|-------------|
| `GET` | `/api/regions` | Lista regiões (hierarquia) | — |
| `GET` | `/api/regions/:id/stories` | Stories de uma região | `limit`, `offset` |

### Alertas

| Método | Path | Descrição | Query params |
|--------|------|-----------|-------------|
| `GET` | `/api/alerts` | Lista alertas não lidos | `type`, `severity`, `limit` |
| `PATCH` | `/api/alerts/:id` | Marca como lido | — |
| `PATCH` | `/api/alerts` | Marca todos como lidos | — |

### Busca

| Método | Path | Descrição | Query params |
|--------|------|-----------|-------------|
| `GET` | `/api/search` | Busca semântica (título + conteúdo + embedding) | `q`, `filters` (cycle, bias, sentiment, region, source), `limit` |

### Sistema

| Método | Path | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/health` | Status do sistema (pipeline, fontes, banco) | público |
| `GET` | `/api/pipeline/log` | Últimas execuções do pipeline | admin |

---

## Resumo: 25 endpoints

| Categoria | Qtd | Endpoints |
|-----------|-----|-----------|
| Pipeline | 2 | collect (POST/GET) |
| Stories | 3 | list, detail, articles |
| Narrativa | 3 | comparison, timeline, insights |
| Fontes | 4 | list, detail, profile, articles |
| Indicadores | 4 | geral, bias, cycles, sentiment |
| Entidades | 3 | search, detail, stories |
| Regiões | 2 | list, stories |
| Alertas | 3 | list, read one, read all |
| Busca | 1 | semantic search |
| Profeta | 5 | predictions list/detail/updates, patterns list/detail, history, track-record, scenarios |
| Sistema | 2 | health, pipeline log |

---

## Resumo: 30 endpoints

| Categoria | Qtd |
|-----------|-----|
| Pipeline | 2 |
| Stories | 3 |
| Narrativa | 3 |
| Fontes | 4 |
| Indicadores | 4 |
| Entidades | 3 |
| Regiões | 2 |
| Alertas | 3 |
| Busca | 1 |
| **Profeta** | **5** |
| Sistema | 2 |

---

## Resumo: 20 tabelas

| Tabela | Finalidade |
|--------|-----------|
| sources | Fontes de notícia |
| raw_articles | Notícias brutas |
| analysis | Análise LLM (básica + narrativa) |
| stories | Histórias agrupadas |
| story_articles | N:N story ↔ artigo |
| entities | Pessoas, orgs, lugares |
| article_entities | Menções em artigos |
| story_entities | Entidades nas stories |
| regions | Regiões geográficas |
| article_regions | Artigo ↔ região |
| story_regions | Story ↔ região |
| narrative_analysis | Comparação narrativa por story |
| source_narrative_profile | Perfil editorial de cada fonte |
| narrative_timeline | Snapshots temporais |
| pipeline_log | Auditoria do pipeline |
| alerts | Alertas do sistema |
| historical_events | Base de fatos históricos |
| event_patterns | Padrões recorrentes |
| predictions | Previsões do Profeta |
| prediction_updates | Atualizações bayesianas |
| prediction_audits | Track record |