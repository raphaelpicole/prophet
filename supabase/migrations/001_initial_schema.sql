
-- ============================================
-- EXTENSÕES
-- ============================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";       -- similaridade texto
create extension if not exists "vector";         -- embeddings (pgvector)
create extension if not exists "pg_cron" schema extensions;  -- jobs internos (opcional)

-- ============================================
-- ENUMS (tipos controlados)
-- ============================================
create type source_type as enum ('rss', 'scrape', 'api');
create type entity_type as enum ('person', 'org', 'place');
create type article_status as enum ('pending', 'analyzing', 'analyzed', 'failed');
create type bias_label as enum ('esquerda', 'centro-esquerda', 'centro', 'centro-direita', 'direita', 'indefinido');
create type sentiment_label as enum ('positivo', 'neutro', 'negativo');
create type cycle_type as enum (
  'conflito', 'pandemia', 'economico', 'politico',
  'social', 'tecnologico', 'ambiental', 'cultural'
);

-- ============================================
-- TABELAS
-- ============================================

-- ────────────────────────────────────────────
-- FONTES DE NOTÍCIA
-- ────────────────────────────────────────────
create table sources (
  id          uuid default uuid_generate_v4() primary key,
  slug        text not null unique,              -- "folha", "g1", "metropoles"
  name        text not null,                      -- "Folha de S.Paulo"
  url         text not null,                      -- site base
  rss_url     text,                               -- URL do feed RSS (se tiver)
  type        source_type not null default 'rss',
  country     char(2) not null default 'BR',       -- código ISO
  language    char(2) not null default 'pt',
  active      boolean default true,
  ideology    bias_label default 'indefinido',    -- viés conhecido da fonte
  config      jsonb default '{}',
  -- config pode conter: { "selectors": {...}, "headers": {...}, "rate_limit_ms": 2000 }
  last_fetched_at timestamptz,
  fetch_error_count int default 0,               -- contador de erros consecutivos
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

comment on table sources is 'Fontes de notícia configuradas para coleta';
comment on column sources.ideology is 'Viés político conhecido/histórico da fonte (mortalha editorial)';

-- ────────────────────────────────────────────
-- NOTÍCIAS BRUTAS
-- ────────────────────────────────────────────
create table raw_articles (
  id            uuid default uuid_generate_v4() primary key,
  source_id     uuid not null references sources(id) on delete cascade,
  title         text not null,
  url           text not null unique,
  content       text,                             -- corpo completo (se coletado)
  summary       text,                             -- resumo gerado pelo LLM
  author        text,                              -- autor/jornalista
  image_url     text,                              -- imagem de capa
  published_at  timestamptz,
  collected_at  timestamptz default now(),
  content_hash  text,                              -- SHA256(title+content normalizado)
  title_norm    text generated always as (
    lower(regexp_replace(title, '[^\w\s]', '', 'g'))
  ) stored,                                       -- título normalizado para pg_trgm
  embedding     vector(1536),                      -- embedding semântico (título+resumo)
  status        article_status default 'pending',
  retry_count   int default 0,                     -- tentativas de análise
  last_error    text                               -- último erro (se failed)
);

comment on table raw_articles is 'Notícias brutas coletadas das fontes';
comment on column sources.content_hash is 'SHA-256 do conteúdo normalizado para deduplicação rápida';
comment on column raw_articles.embedding is 'Embedding vetorial para deduplicação semântica e busca';

-- ────────────────────────────────────────────
-- HISTÓRIAS (agrupamento de notícias)
-- ────────────────────────────────────────────
create table stories (
  id            uuid default uuid_generate_v4() primary key,
  title         text not null,
  summary       text,
  main_subject  text not null,                     -- "Guerra na Ucrânia"
  cycle         cycle_type not null default 'politico',
  sentiment_trend text default 'stable',           -- stable | rising | falling
 热度          int default 0,                      -- "hotness score" para ranking
  article_count int default 1,
  started_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  archived      boolean default false              -- story inativa/antiga
);

comment on table stories is 'Histórias contínuas agrupando notícias do mesmo assunto';
comment on column stories.sentiment_trend is 'Tendência do sentimento: stable, rising (melhorando), falling (piorando)';
comment on column stories.热度 is 'Score de relevância/popularidade para ranking';

-- Ligação N:N notícia ↔ história
create table story_articles (
  story_id   uuid not null references stories(id) on delete cascade,
  article_id uuid not null references raw_articles(id) on delete cascade,
  relevance  float default 1.0,                   -- quão relevante este artigo é pra story
  linked_at  timestamptz default now(),
  primary key (story_id, article_id)
);

-- ────────────────────────────────────────────
-- ENTIDADES (personagens, organizações, lugares)
-- ────────────────────────────────────────────
create table entities (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  type        entity_type not null default 'person',
  aliases     jsonb default '[]',                  -- ["Lula", "Luiz Inácio", "PT Lula"]
  description text,                               -- descrição curta
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(name, type)
);

comment on column entities.aliases is 'Nomes alternativos para deduplicação (ex: Lula = Luiz Inácio Lula da Silva)';

-- Menções de entidades nas notícias
create table article_entities (
  article_id  uuid not null references raw_articles(id) on delete cascade,
  entity_id   uuid not null references entities(id) on delete cascade,
  role        text,                                -- protagonista | citado | afetado | opositor
  sentiment   sentiment_label,                     -- como a notícia retrata a entidade
  primary key (article_id, entity_id)
);

-- Entidades nas histórias (agregado)
create table story_entities (
  story_id    uuid not null references stories(id) on delete cascade,
  entity_id   uuid not null references entities(id) on delete cascade,
  mention_count int default 1,                    -- quantas vezes citada na story
  primary key (story_id, entity_id)
);

-- ────────────────────────────────────────────
-- REGIÕES
-- ────────────────────────────────────────────
create table regions (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null unique,
  code        char(3) not null unique,             -- ISO-ish
  parent_id   uuid references regions(id),        -- hierarquia (sub-regiões)
  created_at  timestamptz default now()
);

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

-- ────────────────────────────────────────────
-- ANÁLISE (LLM output)
-- ────────────────────────────────────────────
create table analysis (
  id                uuid default uuid_generate_v4() primary key,
  article_id        uuid not null unique references raw_articles(id) on delete cascade,
  political_bias    bias_label default 'indefinido',
  sentiment         sentiment_label default 'neutro',
  bias_score        real default 0,                -- -1.0 a +1.0
  sentiment_score   real default 0,                -- -1.0 a +1.0
  categories        jsonb default '[]',            -- ["economia", "guerra"]
  framing           text,                          -- como a notícia "enquadra" o assunto
  confidence        real default 0,                -- 0.0 a 1.0
  analysis_version  int default 1,                 -- versioning (re-análise)
  analyzed_at       timestamptz default now(),
  model_used        text,
  tokens_used       int default 0,                 -- custo tracking
  raw_response      jsonb                          -- resposta bruta do LLM (audit)
);

comment on column analysis.framing is 'Enquadramento jornalístico: como a fonte escolhe contar a história';
comment on column analysis.raw_response is 'Resposta JSON bruta do LLM — para auditoria e re-processamento';
comment on column analysis.analysis_version is 'Versão da análise — permite re-analisar com modelo melhor';

-- ────────────────────────────────────────────
-- PIPELINE LOG (auditoria e debug)
-- ────────────────────────────────────────────
create table pipeline_log (
  id          uuid default uuid_generate_v4() primary key,
  run_id      uuid not null,                       -- ID da execução do cron
  step        text not null,                        -- collect | dedup | analyze | group
  source_id   uuid references sources(id),
  status      text not null,                       -- success | warning | error
  message     text,
  count       int default 0,                       -- itens processados
  duration_ms int,                                  -- tempo gasto
  created_at  timestamptz default now()
);

comment on table pipeline_log is 'Log de cada execução do pipeline para monitoramento e debug';

-- ============================================
-- ÍNDICES
-- ============================================

-- Artigos
create index idx_articles_status on raw_articles(status);
create index idx_articles_published on raw_articles(published_at desc);
create index idx_articles_source on raw_articles(source_id);
create index idx_articles_hash on raw_articles(content_hash) where content_hash is not null;
create index idx_articles_title_trgm on raw_articles using gin(title_norm gin_trgm_ops);

-- Embedding (HNSW mais rápido para queries < 10k)
create index idx_articles_embedding on raw_articles
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64)
  where embedding is not null;

-- Stories
create index idx_stories_updated on stories(updated_at desc);
create index idx_stories_subject on stories(main_subject);
create index idx_stories_cycle on stories(cycle);
create index idx_stories_hot on stories(热度 desc) where not archived;
create index idx_stories_archived on stories(archived) where archived;

-- Analysis
create index idx_analysis_bias on analysis(political_bias);
create index idx_analysis_sentiment on analysis(sentiment);
create index idx_analysis_model on analysis(model_used);

-- Pipeline log
create index idx_pipeline_run on pipeline_log(run_id);
create index idx_pipeline_step on pipeline_log(step, created_at desc);

-- Entities
create index idx_entities_type on entities(type);
create index idx_entities_name_trgm on entities using gin(name gin_trgm_ops);

-- ============================================
-- VIEWS
-- ============================================

-- Dashboard: stories com indicadores agregados
create view v_story_indicators as
select
  s.id,
  s.title,
  s.summary,
  s.main_subject,
  s.cycle,
  s.article_count,
  s.热度 as hotness,
  s.started_at,
  s.updated_at,
  s.archived,
  avg(a.bias_score)      as avg_bias,
  avg(a.sentiment_score) as avg_sentiment,
  count(a.id)            as analyzed_count,
  count(distinct ra.source_id) as source_count
from stories s
join story_articles sa on sa.story_id = s.id
join raw_articles ra on ra.id = sa.article_id
left join analysis a on a.article_id = sa.article_id
group by s.id;

-- Fontes: stats de coleta
create view v_source_stats as
select
  src.id,
  src.slug,
  src.name,
  src.ideology,
  count(ra.id) as total_articles,
  count(ra.id) filter (where ra.published_at >= now() - interval '24 hours') as articles_24h,
  count(ra.id) filter (where ra.status = 'analyzed') as analyzed_count,
  count(ra.id) filter (where ra.status = 'failed') as failed_count,
  src.last_fetched_at,
  src.fetch_error_count
from sources src
left join raw_articles ra on ra.source_id = src.id
group by src.id;

-- ============================================
-- FUNÇÕES
-- ============================================

-- Incrementa article_count e atualiza updated_at
create or replace function increment_story_article_count(p_story_id uuid)
returns void as $$
begin
  update stories
  set article_count = article_count + 1,
      updated_at = now()
  where id = p_story_id;
end;
$$ language plpgsql;

-- Recalcula hotness score de uma story
create or replace function recalc_hotness(p_story_id uuid)
returns void as $$
begin
  update stories
  set 热度 = (
    select count(*) * 10 + coalesce(avg(sa.relevance), 0) * 5
    from story_articles sa
    join raw_articles ra on ra.id = sa.article_id
    where sa.story_id = p_story_id
      and ra.published_at >= now() - interval '48 hours'
  )
  where id = p_story_id;
end;
$$ language plpgsql;

-- ============================================
-- SEED: Fontes
-- ============================================
insert into sources (slug, name, url, rss_url, type, country, language, ideology, config) values
  ('g1',          'G1',               'https://g1.globo.com',             'https://g1.globo.com/rss/g1/',                     'rss',    'BR', 'pt', 'centro-esquerda', '{}'),
  ('folha',       'Folha de S.Paulo', 'https://www.folha.uol.com.br',     'https://feeds.folha.uol.com.br/folha/emaisp/rss091.xml', 'rss', 'BR', 'pt', 'centro-esquerda', '{}'),
  ('uol',         'UOL',              'https://www.uol.com.br',           'https://rss.uol.com.br/feed/noticias.xml',         'rss',    'BR', 'pt', 'centro-esquerda', '{}'),
  ('estadao',     'Estadão',          'https://www.estadao.com.br',       'https://www.estadao.com.br/rss',                   'rss',    'BR', 'pt', 'centro-direita',  '{}'),
  ('oglobo',      'O Globo',          'https://oglobo.globo.com',         'https://oglobo.globo.com/rss',                     'rss',    'BR', 'pt', 'centro-direita',  '{}'),
  ('metropoles',  'Metrópoles',       'https://www.metropoles.com',       null,                                               'scrape', 'BR', 'pt', 'centro',          '{"selectors": {"article": ".card-news", "title": "h3", "link": "a", "date": "time"}}'),
  ('icl',         'ICL Notícias',     'https://iclnoticias.com.br',       null,                                               'scrape', 'BR', 'pt', 'indefinido',      '{"selectors": {"article": "article", "title": "h2", "link": "a", "date": "time"}}'),
  ('bbc',         'BBC Brasil',       'https://www.bbc.com/portuguese',   'https://feeds.bbci.co.uk/portuguese/rss.xml',       'rss',    'GB', 'pt', 'centro',          '{}'),
  ('reuters',     'Reuters',          'https://www.reuters.com',           'https://feeds.reuters.com/reuters/topNews',        'rss',    'US', 'en', 'centro',          '{}'),
  ('cnn',         'CNN Brasil',       'https://www.cnnbrasil.com.br',     'https://www.cnnbrasil.com.br/rss',                 'rss',    'BR', 'pt', 'centro',          '{}')
on conflict (slug) do nothing;

-- ============================================
-- SEED: Regiões
-- ============================================
insert into regions (name, code, parent_id) values
  ('América do Norte', 'NAM', null),
  ('América do Sul',   'SAM', null),
  ('Europa',           'EUR', null),
  ('Ásia',             'ASI', null),
  ('África',           'AFR', null),
  ('Oriente Médio',    'MID', null),
  ('Oceania',          'OCE', null),
  ('Global',           'GLB', null),
  -- Sub-regiões
  ('Brasil',           'BRA', (select id from regions where code = 'SAM')),
  ('Estados Unidos',   'USA', (select id from regions where code = 'NAM')),
  ('América Central',  'CAM', (select id from regions where code = 'NAM')),
  ('Leste Europeu',    'EEU', (select id from regions where code = 'EUR')),
  ('Leste Asiático',   'EAS', (select id from regions where code = 'ASI'))
on conflict (code) do nothing;

-- ============================================
-- SEED: Ciclos
-- ============================================
-- (cycle_type já é enum, mas documentamos os valores esperados)
insert into regions (name, code) values
  ('Norte da África', 'NAF', (select id from regions where code = 'AFR')),
  ('África Subsaariana', 'SSA', (select id from regions where code = 'AFR'))
on conflict (code) do nothing;
