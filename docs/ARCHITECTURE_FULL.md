# Prophet — Arquitetura Completa (Fluxograma)

## Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PROPHET — SISTEMA COMPLETO                   │
│                                                                     │
│   ┌─────────────┐    ┌─────────────┐    ┌──────────────┐            │
│   │  EXTERNAL    │    │  BACKEND    │    │  FRONTEND    │            │
│   │  DATA        │    │  Node.js/TS│    │  Flutter     │            │
│   │             │    │  Vercel     │    │  Web/iOS/Droid│           │
│   └──────┬──────┘    └──────┬──────┘    └──────┬───────┘            │
│          │                  │                   │                    │
│          ▼                  ▼                   ▼                    │
│   ┌──────────┐      ┌──────────────┐     ┌──────────┐              │
│   │ Notícias  │─────▶│ Pipeline     │────▶│ Flutter  │              │
│   │ Histórico │─────▶│ Engine       │     │ App      │              │
│   │ GDELT    │      │              │     │          │              │
│   └──────────┘      └──────┬───────┘     └──────────┘              │
│                             │                                       │
│                             ▼                                       │
│                      ┌──────────────┐                              │
│                      │  Supabase    │                              │
│                      │  PostgreSQL  │                              │
│                      └──────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fluxograma Detalhado

```
═══════════════════════════════════════════════════════════════════════
  CAMADA 1: FONTES DE DADOS (externo)
═══════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────┐
  │                    NOTÍCIAS (tempo real)                     │
  │                                                             │
  │  ┌─────┐ ┌──────┐ ┌─────┐ ┌───────┐ ┌──────┐ ┌──────────┐│
  │  │ G1  │ │Folha │ │ UOL │ │Estadão│ │OGlobo│ │Metrópoles││
  │  └──┬──┘ └──┬───┘ └──┬──┘ └──┬────┘ └──┬───┘ └────┬─────┘│
  │     │       │        │       │         │          │       │
  │  ┌──┴──┐ ┌──┴───┐ ┌──┴──┐ ┌──┴────┐ ┌──┴───┐ ┌───┴────┐│
  │  │ BBC │ │Reuters│ │ CNN │ │  ICL  │ │+mais │ │+mais   ││
  │  └─────┘ └──────┘ └─────┘ └───────┘ └──────┘ └────────┘│
  │                                                             │
  │  RSS Feeds ───────────────────── Scrapers (Cheerio)        │
  └──────────────────────────┬──────────────────────────────────┘
                             │
  ┌──────────────────────────┼──────────────────────────────────┐
  │                    HISTÓRICO (carga inicial)               │
  │                           │                                 │
  │  ┌─────────┐ ┌───────┐ ┌┴──────┐ ┌────────┐ ┌─────────┐ │
  │  │Wikipedia│ │ GDELT │ │ ACLED │ │PolityIV│ │WorldBank│ │
  │  └─────────┘ └───────┘ └───────┘ └────────┘ └─────────┘ │
  │                                                             │
  │  API ─────────────────────── CSV/JSON ──────────────────   │
  └──────────────────────────┬──────────────────────────────────┘
                             │
═══════════════════════════════════════════════════════════════════════
  CAMADA 2: PIPELINE (Backend — Vercel Serverless)
═══════════════════════════════════════════════════════════════════════
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │   CRON: a cada 30 minutos                                   │
  │   POST /api/collect                                         │
  │                                                             │
  │   ┌───────────────────────────────────────────────────┐    │
  │   │                                                   │    │
  │   │  ETAPA 1: COLETA                                  │    │
  │   │  ┌─────────────┐  ┌──────────────┐               │    │
  │   │  │ RSS Parser  │  │ Web Scraper  │               │    │
  │   │  │ (xml2js)    │  │ (Cheerio)    │               │    │
  │   │  └──────┬──────┘  └──────┬───────┘               │    │
  │   │         │                │                         │    │
  │   │         └────────┬───────┘                        │    │
  │   │                  ▼                                │    │
  │   │         RawArticle[]                              │    │
  │   │         {title, url, content, source_id}          │    │
  │   │                                                   │    │
  │   ├───────────────────────────────────────────────────┤    │
  │   │                                                   │    │
  │   │  ETAPA 2: DEDUPLICAÇÃO                            │    │
  │   │  ┌────────────────────────────────────────────┐  │    │
  │   │  │ Camada 1: URL exata     → já existe? pula │  │    │
  │   │  │ Camada 2: SHA-256 hash  → mesmo texto? pula│  │    │
  │   │  │ Camada 3: Título norm.  → similar? merge  │  │    │
  │   │  │ Camada 4: Embedding     → cosine > 0.95?  │  │    │
  │   │  └────────────────────────────────────────────┘  │    │
  │   │                  │                                │    │
  │   │                  ▼                                │    │
  │   │         newArticles[] → INSERT raw_articles       │    │
  │   │                                                   │    │
  │   ├───────────────────────────────────────────────────┤    │
  │   │                                                   │    │
  │   │  ETAPA 3: ANÁLISE LLM                             │    │
  │   │  ┌────────────────────────────────────────────┐  │    │
  │   │  │ Para cada artigo com status='pending':     │  │    │
  │   │  │                                             │  │    │
  │   │  │  Prompt → LLM (GLM-4-Flash / GPT-4o-mini) │  │    │
  │   │  │  ↓                                         │  │    │
  │   │  │  Extrai:                                   │  │    │
  │   │  │  • summary, main_subject, cycle            │  │    │
  │   │  │  • political_bias, bias_score              │  │    │
  │   │  │  • sentiment, sentiment_score              │  │    │
  │   │  │  • categories, entities, regions           │  │    │
  │   │  │  • framing, tone, key_facts ★              │  │    │
  │   │  │  • omitted_facts, emotion_score ★          │  │    │
  │   │  │  • vocabulary_level, narrative_role ★      │  │    │
  │   │  │                                             │  │    │
  │   │  │  ★ = campos novos (análise narrativa)      │  │    │
  │   │  └────────────────────────────────────────────┘  │    │
  │   │                  │                                │    │
  │   │                  ▼                                │    │
  │   │         INSERT analysis + article_entities        │    │
  │   │         UPDATE raw_articles SET status='analyzed' │    │
  │   │                                                   │    │
  │   ├───────────────────────────────────────────────────┤    │
  │   │                                                   │    │
  │   │  ETAPA 4: AGRUPAMENTO EM STORIES                  │    │
  │   │  ┌────────────────────────────────────────────┐  │    │
  │   │  │ Para cada artigo analisado:                 │  │    │
  │   │  │  1. Busca story com main_subject similar   │  │    │
  │   │  │  2. Se encontra → vincula (story_articles) │  │    │
  │   │  │  3. Se não → cria nova story               │  │    │
  │   │  │  4. Upsert entities → story_entities       │  │    │
  │   │  │  5. Recalcula hotness, divergence_score     │  │    │
  │   │  └────────────────────────────────────────────┘  │    │
  │   │                                                   │    │
  │   ├───────────────────────────────────────────────────┤    │
  │   │                                                   │    │
  │   │  ETAPA 5: ANÁLISE NARRATIVA COMPARATIVA ★        │    │
  │   │  ┌────────────────────────────────────────────┐  │    │
  │   │  │ Para cada story com >= 2 fontes:           │  │    │
  │   │  │                                             │  │    │
  │   │  │  Prompt → LLM (artigos de fontes dif.)     │  │    │
  │   │  │  ↓                                         │  │    │
  │   │  │  Compara:                                  │  │    │
  │   │  │  • consensus_facts (todos mencionam)       │  │    │
  │   │  │  • disputed_facts (só alguns mencionam)   │  │    │
  │   │  │  • omitted_facts (quem omite o quê)        │  │    │
  │   │  │  • framing_by_source (enquadramento)       │  │    │
  │   │  │  • tone_by_source (tom editorial)          │  │    │
  │   │  │  • entity_roles (quem é protagonista)      │  │    │
  │   │  │  • bias_spread (dispersão de viés)          │  │    │
  │   │  │  • narrative_evolution (mudou ao longo)     │  │    │
  │   │  └────────────────────────────────────────────┘  │    │
  │   │                  │                                │    │
  │   │                  ▼                                │    │
  │   │         UPSERT narrative_analysis                 │    │
  │   │         INSERT narrative_timeline (snapshots)     │    │
  │   │         UPDATE source_narrative_profile            │    │
  │   │         INSERT alerts (se divergência alta)       │    │
  │   │                                                   │    │
  │   └───────────────────────────────────────────────────┘    │
  │                                                             │
  └─────────────────────────────┬───────────────────────────────┘
                                │
  ┌─────────────────────────────┼───────────────────────────────┐
  │                             │                               │
  │   CRON: a cada 1 hora      │                               │
  │   POST /api/cron/prophecy  │                               │
  │                             │                               │
  │   ┌─────────────────────────┴───────────────────────────┐  │
  │   │                                                     │  │
  │   │  ETAPA 6: PROFETA (Motor Preditivo) ★★★           │  │
  │   │  ┌─────────────────────────────────────────────┐  │  │
  │   │  │ 1. Busca stories atualizadas nas últimas 2h │  │  │
  │   │  │                                             │  │  │
  │   │  │ 2. Para cada story:                         │  │  │
  │   │  │    a. Busca padrões (event_patterns)        │  │  │
  │   │  │       cujos triggers batem com fatos atuais │  │  │
  │   │  │                                             │  │  │
  │   │  │    b. Busca eventos históricos              │  │  │
  │   │  │       (historical_events) similares         │  │  │
  │   │  │       por região, tipo, entidades, ciclo     │  │  │
  │   │  │                                             │  │  │
  │   │  │    c. Prompt → LLM                          │  │  │
  │   │  │       Input: fatos atuais + padrões +       │  │  │
  │   │  │              eventos históricos similares   │  │  │
  │   │  │       Output:                               │  │  │
  │   │  │       • probability (0-100%)                │  │  │
  │   │  │       • prediction_type                     │  │  │
  │   │  │       • time_horizon                        │  │  │
  │   │  │       • triggers_up / triggers_down         │  │  │
  │   │  │       • scenarios (3)                       │  │  │
  │   │  │       • historical_similarity              │  │  │
  │   │  │       • confidence                          │  │  │
  │   │  │                                             │  │  │
  │   │  │    d. Se já existe previsão:                │  │  │
  │   │  │       → Atualização bayesiana               │  │  │
  │   │  │       → Novo fato = ajustar probabilidade  │  │  │
  │   │  │       → INSERT prediction_updates           │  │  │
  │   │  │                                             │  │  │
  │   │  │    e. Se horizonte expirou:                 │  │  │
  │   │  │       → Verificar se aconteceu              │  │  │
  │   │  │       → UPDATE predictions SET status       │  │  │
  │   │  │       → Calcular brier_score                │  │  │
  │   │  │       → Atualizar prediction_audits          │  │  │
  │   │  │       → Recalcular success_rate dos padrões │  │  │
  │   │  │                                             │  │  │
  │   │  │ 3. Gerar alertas de previsão (se >70%)      │  │  │
  │   │  └─────────────────────────────────────────────┘  │  │
  │   │                                                     │  │
  │   └─────────────────────────────────────────────────────┘  │
  │                                                             │
  └─────────────────────────────┬───────────────────────────────┘
                                │
═══════════════════════════════════════════════════════════════════════
  CAMADA 3: BANCO DE DADOS (Supabase PostgreSQL)
═══════════════════════════════════════════════════════════════════════
                                │
                                ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │   ┌──────────────────────────────────────────────────┐     │
  │   │              SUPABASE (PostgreSQL + Realtime)     │     │
  │   │                                                    │     │
  │   │  20 TABELAS:                                       │     │
  │   │                                                    │     │
  │   │  Dados de notícias:                               │     │
  │   │  ├── sources                                       │     │
  │   │  ├── raw_articles (+ embeddings pgvector)         │     │
  │   │  └── analysis (básica + narrativa)                │     │
  │   │                                                    │     │
  │   │  Stories e entidades:                             │     │
  │   │  ├── stories (hotness, divergence_score)           │     │
  │   │  ├── story_articles                               │     │
  │   │  ├── entities + article_entities + story_entities │     │
  │   │  └── regions + article_regions + story_regions    │     │
  │   │                                                    │     │
  │   │  Análise narrativa:                               │     │
  │   │  ├── narrative_analysis (comparação)               │     │
  │   │  ├── source_narrative_profile (perfil por fonte)  │     │
  │   │  └── narrative_timeline (snapshots temporais)     │     │
  │   │                                                    │     │
  │   │  Profeta:                                         │     │
  │   │  ├── historical_events (50K+ eventos)             │     │
  │   │  ├── event_patterns (padrões recorrentes)         │     │
  │   │  ├── predictions + prediction_updates             │     │
  │   │  └── prediction_audits (track record)             │     │
  │   │                                                    │     │
  │   │  Sistema:                                         │     │
  │   │  ├── pipeline_log + alerts                        │     │
  │   │  └── 3 VIEWS (v_story_indicators, v_source_stats, │     │
  │   │                v_narrative_comparison)              │     │
  │   │                                                    │     │
  │   │  Extensões: uuid-ossp, pg_trgm, vector(1536)      │     │
  │   │                                                    │     │
  │   │  Tamanho inicial: ~240 MB                         │     │
  │   │  Crescimento: ~30-40 MB/mês (com limpeza)         │     │
  │   └──────────────────────────────────────────────────┘     │
  │                                                             │
  └─────────────────────────────┬───────────────────────────────┘
                                │
═══════════════════════════════════════════════════════════════════════
  CAMADA 4: API (Vercel Serverless — 30 endpoints)
═══════════════════════════════════════════════════════════════════════
                                │
                                ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │   REST API (Node.js/TypeScript — Vercel Serverless)        │
  │                                                             │
  │   Pipeline:          GET/POST /api/collect                  │
  │                                                             │
  │   Stories:           GET /api/stories                       │
  │                      GET /api/stories/:id                    │
  │                      GET /api/stories/:id/articles           │
  │                                                             │
  │   Narrativa:         GET /api/narrative/:storyId             │
  │                      GET /api/narrative/:storyId/timeline    │
  │                      GET /api/narrative/insights              │
  │                                                             │
  │   Fontes:            GET /api/sources                       │
  │                      GET /api/sources/:id                    │
  │                      GET /api/sources/:id/profile            │
  │                      GET /api/sources/:id/articles            │
  │                                                             │
  │   Indicadores:       GET /api/indicators                     │
  │                      GET /api/indicators/bias-spectrum        │
  │                      GET /api/indicators/cycles               │
  │                      GET /api/indicators/sentiment            │
  │                                                             │
  │   Entidades:         GET /api/entities                      │
  │                      GET /api/entities/:id                  │
  │                      GET /api/entities/:id/stories            │
  │                                                             │
  │   Regiões:           GET /api/regions                       │
  │                      GET /api/regions/:id/stories            │
  │                                                             │
  │   Profeta:           GET /api/prophet/predictions            │
  │                      GET /api/prophet/predictions/:id        │
  │                      GET /api/prophet/predictions/:id/updates │
  │                      GET /api/prophet/patterns               │
  │                      GET /api/prophet/patterns/:id            │
  │                      GET /api/prophet/history                 │
  │                      GET /api/prophet/track-record           │
  │                      GET /api/prophet/scenarios/:storyId      │
  │                                                             │
  │   Alertas:           GET /api/alerts                        │
  │                      PATCH /api/alerts/:id                   │
  │                      PATCH /api/alerts                       │
  │                                                             │
  │   Busca:             GET /api/search                        │
  │                                                             │
  │   Sistema:           GET /api/health                        │
  │                      GET /api/pipeline/log                   │
  │                                                             │
  └─────────────────────────────┬───────────────────────────────┘
                                │
═══════════════════════════════════════════════════════════════════════
  CAMADA 5: FRONTEND (Flutter — Web/iOS/Android)
═══════════════════════════════════════════════════════════════════════
                                │
                                ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │   Flutter App (Dart) — Material 3, Dark Theme                │
  │                                                             │
  │   ┌─────────────────────────────────────────────────┐      │
  │   │                 BOTTOM NAV (5 abas)              │      │
  │   │                                                   │      │
  │   │  🏠 Radar  📊 Análise  🔮 Profeta  🗺️ Mapa  ⚙️ │      │
  │   └───┬─────────┬──────────┬─────────┬───────┬───────┘      │
  │       │         │          │         │       │              │
  │       ▼         ▼          ▼         ▼       ▼              │
  │   ┌───────┐ ┌────────┐ ┌──────┐ ┌─────┐ ┌──────┐         │
  │   │ Home  │ │Compar. │ │Profet│ │Mapa │ │Config│         │
  │   │       │ │Narrat. │ │      │ │     │ │      │          │
  │   │ KPIs  │ │Bias    │ │Track │ │Heat │ │Fontes│          │
  │   │Stories│ │Barômetr│ │Rec.  │ │Map  │ │Prefs │          │
  │   │Predic.│ │Fatos   │ │Predi.│ │Pins │ │Notif.│          │
  │   │Cycles │ │Omissõe│ │Detal.│ │     │ │Dados │           │
  │   └───┬───┘ └───┬────┘ └──┬───┘ └──┬──┘ └──────┘         │
  │       │         │         │        │                      │
  │       ▼         ▼         ▼        ▼                      │
  │   ┌───────────────────────────────────────────────────┐   │
  │   │              TELAS SECUNDÁRIAS                    │   │
  │   │                                                   │   │
  │   │  • Story Detail (artigos da story)                │   │
  │   │  • Timeline Narrativa (evolução temporal)         │   │
  │   │  • Perfil de Fonte (perfil editorial)             │   │
  │   │  • Previsão Detalhada (cenários, gatilhos)        │   │
  │   │  • Busca (semântica + filtros)                    │   │
  │   └───────────────────────────────────────────────────┘   │
  │                                                             │
  │   Estado: Riverpod / BLoC                                   │
  │   HTTP: Dio                                                 │
  │   Charts: fl_chart + syncfusion_flutter_charts              │
  │   Mapas: google_maps_flutter / mapbox                       │
  │   Supabase: supabase_flutter (realtime subscriptions)       │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
                                │
═══════════════════════════════════════════════════════════════════════
  INFRAESTRUTURA E DEVOPS
═══════════════════════════════════════════════════════════════════════
                                │
                                ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │   ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
  │   │   Vercel     │  │   Supabase   │  │   GitHub       │ │
  │   │              │  │              │  │                │ │
  │   │ • Serverless │  │ • PostgreSQL │  │ • Repo        │ │
  │   │ • Cron Jobs  │  │ • Realtime   │  │ • CI/CD       │ │
  │   │ • API Host   │  │ • Auth       │  │ • Issues      │ │
  │   │ • Env Vars   │  │ • Storage    │  │ • PRs         │ │
  │   └──────────────┘  └──────────────┘  └────────────────┘ │
  │                                                             │
  │   ┌──────────────┐  ┌──────────────┐                       │
  │   │   LLM API    │  │   Flutter    │                       │
  │   │              │  │   Web Host   │                       │
  │   │ • GLM-4-Flash│  │              │                       │
  │   │ • GPT-4o-mini│  │ • Vercel    │                       │
  │   │ • Embeddings │  │ • prophet.app│                       │
  │   └──────────────┘  └──────────────┘                       │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

---

## Cronograma de Dados (o que acontece quando)

```
T+0min   Cron dispara → Coleta notícias (todas as fontes, paralelo)
T+1min   Deduplicação (contra banco + mesma rodada)
T+2min   Insere novas no banco
T+3min   Análise LLM (batch de 5, até 20 artigos pendentes)
T+8min   Agrupamento em stories
T+10min  Análise narrativa comparativa (stories com 2+ fontes)
T+15min  Pipeline completa ✅

T+60min  Cron do Profeta dispara
T+61min  Busca stories atualizadas
T+62min  Matching com padrões históricos
T+63min  Matching com eventos históricos
T+65min  LLM gera/atualiza previsões
T+67min  Verifica expiradas → resolve
T+68min  Profeta completa ✅

TEMPO REAL  Flutter app consome API
           Supabase Realtime → atualizações instantâneas
           Push notifications → alertas críticos
```

---

## Variáveis de Ambiente

```
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# LLM
LLM_API_KEY=xxxx
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_MODEL=glm-4-flash
LLM_EMBEDDING_MODEL=embedding-3

# GDELT (histórico)
GDELT_API_KEY=xxxx

# App
APP_URL=https://prophet.vercel.app
APP_SECRET=xxxx
CRON_SECRET=xxxx
```