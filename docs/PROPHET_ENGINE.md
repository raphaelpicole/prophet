# Prophet — O Profeta (Sistema Preditivo)

## Visão

O Profeta é a funcionalidade central do Prophet: **prever acontecimentos futuros** cruzando:
1. Notícias atuais (o que está sendo narrado agora)
2. Fatos históricos relevantes (padrões do passado)
3. Padrões recorrentes (ciclos, sequências, gatilhos)

Não é adivinhação — é **reconhecimento de padrões com base histórica**, como superforecasting.

---

## Fundamentação: Superforecasting (Tetlock)

O trabalho de Philip Tetlock (Good Judgment Project) mostrou que:

1. **Previsões probabilísticas** batem opinião de especialistas — em vez de "vai acontecer" ou "não vai", atribui-se probabilidade (72% de chance)
2. **Atualização bayesiana** — a cada novo fato, atualiza a probabilidade
3. **Busca ativa de evidências** — o bom previsor procura ativamente razões pra estar errado
4. **Agregação** — combinar múltiplas previsões é melhor que uma única
5. **Track record** — medir acertos ao longo do tempo, não em uma previsão isolada

O Profeta implementa esse framework com IA.

---

## Arquitetura do Profeta

```
[Notícias atuais] ──┐
                     ├──→ [Motor de Padrões] ──→ [Previsões] ──→ [Acompanhamento]
[Fatos históricos] ──┤         │                     │                │
                     │         ↓                     ↓                ↓
[Padrões globais] ──┘    [Gatilhos]           [Probabilidades]   [Score de acerto]
                          [Cadeias]            [Confiabilidade]   [Aprendizado]
```

---

## Tabelas Novas

### 1. historical_events — Base de fatos históricos

```sql
create table historical_events (
  id              uuid default uuid_generate_v4() primary key,
  title           text not null,
  description     text,
  event_date      date not null,
  event_type      text not null,              -- 'conflicto' | 'crise_economica' | 'eleicao' | 'golpe' | 'pandemia' | 'acordo' | 'protesto' | 'reforma' | 'escandalo' | 'desastre' | 'revolucao'
  region_id       uuid references regions(id),
  country         char(2),

  -- Contexto
  causes          jsonb default '[]',          -- causas identificadas
  consequences    jsonb default '[]',          -- consequências documentadas
  key_entities    jsonb default '[]',          -- entidades envolvidas [{name, role}]
  related_cycles  jsonb default '[]',          -- ciclos da humanidade relacionados

  -- Conectividade
  parent_event_id uuid references historical_events(id), -- evento pai (ex: "Primavera Árabe" → "Guerra Civil Síria")
  similarity_tags jsonb default '[]',          -- tags para matching com notícias atuais

  -- Fonte
  source_url      text,
  source_name     text,
  confidence      real default 0.9,             -- confiabilidade da informação histórica
  created_at      timestamptz default now()
);
```

### 2. event_patterns — Padrões recorrentes identificados

```sql
create table event_patterns (
  id              uuid default uuid_generate_v4() primary key,
  name            text not null unique,        -- "Aumento de tensão → Conflito armado"
  description     text,

  -- Sequência
  sequence        jsonb not null,              -- [{step: 1, type: "protesto", description: "..."}, {step: 2, type: "repressao", ...}, {step: 3, type: "conflito", ...}]
  typical_duration text,                        -- "6 meses a 2 anos"
  trigger_conditions jsonb default '[]',        -- condições que ativam o padrão

  -- Estatísticas
  occurrence_count int default 0,               -- quantas vezes esse padrão se repetiu na história
  success_rate    real default 0,                -- % de vezes que a sequência se completou
  avg_time_between_steps jsonb default '{}',     -- {"1_to_2": "30d", "2_to_3": "90d"}

  -- Contexto
  applicable_regions jsonb default '[]',
  applicable_cycles  jsonb default '[]',

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

### 3. predictions — Previsões do Profeta

```sql
create table predictions (
  id                uuid default uuid_generate_v4() primary key,
  created_at        timestamptz default now(),

  -- A previsão
  title             text not null,              -- "Conflito armado na região X em 60 dias"
  description       text,                       -- explicação detalhada
  probability       real not null,              -- 0.0 a 1.0 (72% = 0.72)
  confidence        real default 0,             -- 0.0 a 1.0 (quão confiante o modelo está na previsão)
  time_horizon      text,                       -- "30 dias" | "6 meses" | "1 ano"

  -- O que gerou a previsão
  story_id          uuid references stories(id),           -- story atual que disparou
  pattern_id        uuid references event_patterns(id),    -- padrão identificado
  matched_historical jsonb default '[]',                    -- eventos históricos similares [{event_id, similarity_score}]
  trigger_facts     jsonb default '[]',                     -- fatos atuais que são gatilhos
  narrative_signals jsonb default '[]',                     -- sinais das narrativas (viés mudando, escalada de tom)

  -- Categorias
  prediction_type   text not null,              -- 'conflito' | 'crise_economica' | 'mudanca_politica' | 'protesto' | 'acordo' | 'repressao' | 'pandemia'
  region_id         uuid references regions(id),
  cycle             cycle_type,
  affected_entities jsonb default '[]',           -- entidades que seriam afetadas

  -- Resolução
  status            text default 'active',       -- 'active' | 'partially_correct' | 'correct' | 'incorrect' | 'expired'
  resolved_at       timestamptz,
  resolution_notes  text,
  resolution_source text,                        -- URL do evento real que confirmou/negou

  -- Score (preenchido na resolução)
  brier_score       real,                        -- (prob - outcome)^2 — métrica padrão de previsão
  calibration_score real                         -- ao longo do tempo, quão calibrado
);
```

### 4. prediction_updates — Atualizações bayesianas

```sql
create table prediction_updates (
  id              uuid default uuid_generate_v4() primary key,
  prediction_id   uuid not null references predictions(id) on delete cascade,
  updated_at      timestamptz default now(),

  -- Delta
  old_probability real not null,
  new_probability real not null,
  delta           real not null,                 -- new - old (positivo = aumentou chance)
  reason          text not null,                  -- "Novo artigo indica mobilização militar"

  -- O que causou a atualização
  trigger_article_id uuid references raw_articles(id),
  trigger_type       text,                       -- 'new_fact' | 'escalation' | 'deescalation' | 'historical_match' | 'pattern_shift'
  trigger_data       jsonb default '{}'
);
```

### 5. prediction_audits — Auditoria de acerto (track record)

```sql
create table prediction_audits (
  id                uuid default uuid_generate_v4() primary key,
  period_start      date not null,
  period_end        date not null,

  -- Métricas
  total_predictions int default 0,
  correct           int default 0,
  partially_correct int default 0,
  incorrect          int default 0,
  expired           int default 0,
  avg_brier_score   real,                         -- menor = melhor (0 = perfeito, 1 = péssimo)
  calibration_slope real,                         -- quão bem calibrado (1.0 = perfeito)

  -- Por tipo
  by_type           jsonb default '{}',           -- {conflito: {total, correct, brier}, ...}
  by_horizon        jsonb default '{}',            -- {30d: {...}, 6m: {...}}

  notes             text,
  created_at        timestamptz default now()
);
```

---

## Pipeline do Profeta (como funciona na prática)

### Etapa 1: Ingestão de fatos históricos

```python
# Fontes de dados históricos:
# 1. Wikipedia API (eventos por data, guerras, crises, eleições)
# 2. GDELT Global Knowledge Graph (banco de eventos globais, 1979-presente)
# 3. ACLED (Armed Conflict Location & Event Data, conflitos 1997-presente)
# 4. CNTS Data Archive (conflict, politics, 1815-presente)
# 5. Polity IV (regimes políticos, 1800-presente)
# 6. World Bank Open Data (econômico)
# 7. Inserção manual (curadoria de eventos-chave)
# 8. LLM gera relações causais a partir de eventos documentados
```

### Etapa 2: Identificação de padrões

O LLM analisa a base histórica e identifica sequências recorrentes:

```
Padrão: "Escalada de tensão fronteiriça → Conflito armado"

Sequência:
1. Disputas diplomáticas (0-30 dias)
2. Mobilização militar (30-60 dias)
3. Incidentes fronteiriços (60-90 dias)
4. Conflito armado (90-180 dias)

Ocorrências na história: 23
Taxa de completude: 65% (15 de 23 completaram a sequência)
Tempo médio 1→4: 120 dias
```

### Etapa 3: Matching em tempo real

A cada ciclo do pipeline, o Profeta:

1. Pega as stories ativas e suas análises narrativas
2. Busca padrões cujos **triggers** batem com os fatos atuais
3. Busca **eventos históricos similares** (por região, tipo, entidades, ciclo)
4. Calcula **similaridade** entre situação atual e situações passadas
5. Se similaridade > threshold → gera previsão

### Etapa 4: Geração de previsão (Prompt)

```python
PROPHET_PROMPT = """
Você é o Profeta, sistema preditivo do Prophet. Com base nos fatos atuais e no contexto histórico, gere uma previsão.

SITUAÇÃO ATUAL:
- Story: {story_title}
- Fatos atuais: {key_facts}
- Narrativa por fonte: {narrative_analysis}
- Viés médio: {avg_bias}
- Sentimento: {avg_sentiment}
- Entidades: {entities}
- Região: {region}

PADRÕES HISTÓRICOS SIMILARES:
{matched_patterns}

EVENTOS HISTÓRICOS SIMILARES:
{matched_events}

Com base nisso:

1. PROBABILIDADE: Qual a chance (0-100%) de {tipo de evento} acontecer em {horizonte temporal}?
2. GATILHOS: Quais fatos, se ocorrerem, AUMENTARIAM a probabilidade?
3. FATORES DE REDUÇÃO: Quais fatos, se ocorrerem, REDUZIRIAM a probabilidade?
4. CENÁRIOS: Descreva 3 cenários (provável, possível, improvável)
5. SIMILARIDADE: Com quais eventos históricos a situação atual mais se parece? Por quê?
6. CONFIANÇA: Quão confiante você está nesta previsão (0-100%)?

Responda em JSON:
{
  "probability": 0.65,
  "prediction_type": "conflito",
  "time_horizon": "90 dias",
  "title": "Conflito armado na região X",
  "description": "...",
  "triggers_up": ["mobilização militar", "rompimento diplomático"],
  "triggers_down": ["acordo de paz", "retirada de tropas"],
  "scenarios": {
    "likely": "...",
    "possible": "...",
    "unlikely": "..."
  },
  "historical_similarity": [
    {"event": "Crise da Crimeia 2014", "similarity": 0.82},
    {"event": "Guerra do Yom Kippur 1973", "similarity": 0.71}
  ],
  "confidence": 0.7
}
"""
```

### Etapa 5: Atualização bayesiana

A cada novo artigo relevante:

```
Previsão: "Conflito em X" — probabilidade: 65%

Novo artigo: "País Y mobiliza tropas para fronteira"
→ Trigger "mobilização militar" ativado
→ Atualização: probabilidade SOBE para 78%
→ Delta: +13%
→ Motivo: "Mobilização militar é gatilho do padrão identificado (etapa 2→3)"

Novo artigo: "Partes concordam com negociação diplomática"
→ Trigger "acordo de paz" ativado
→ Atualização: probabilidade CAI para 45%
→ Delta: -33%
→ Motivo: "Negociação diplomática é fator de redução"
```

### Etapa 6: Resolução e aprendizado

Quando o horizonte temporal expira ou o evento acontece:

```
Previsão: "Conflito em X" — 65% — horizonte: 90 dias

Resultado (dia 75): Conflito armado iniciou
→ Status: CORRECT
→ Brier score: (0.65 - 1)^2 = 0.1225 (bom)
→ Atualiza padrão: occurrence_count +1, success_rate recalculado
→ Alimenta aprendizado para futuras previsões
```

---

## API Endpoints do Profeta

| Método | Path | Descrição |
|--------|------|-----------|
| `GET` | `/api/prophet/predictions` | Lista previsões ativas |
| `GET` | `/api/prophet/predictions/:id` | Detalhe de uma previsão (com updates) |
| `GET` | `/api/prophet/predictions/:id/updates` | Histórico de atualizações bayesianas |
| `GET` | `/api/prophet/patterns` | Lista padrões identificados |
| `GET` | `/api/prophet/patterns/:id` | Detalhe de um padrão |
| `GET` | `/api/prophet/history` | Busca eventos históricos |
| `GET` | `/api/prophet/track-record` | Score de acerto do Profeta |
| `GET` | `/api/prophet/scenarios/:storyId` | Cenários para uma story |

---

## Visualização no Dashboard

### Widget: Profeta (Home)

```
┌────────────────────────────────────────────────┐
│ 🔮 PREVISÕES DO PROFETA                        │
│                                                │
│ ⚠️ Conflito armado — Oriente Médio             │
│ ████████████████░░░░ 78%  ← 90 dias            │
│ ↑ +13% desde ontem (mobilização detectada)    │
│                                                │
│ 📉 Crise econômica — Argentina                 │
│ ████████████░░░░░░░░ 62%  ← 6 meses           │
│ ↑ +5% (FMI liberou US$ 1 bi)                 │
│                                                │
│ 🗳️ Mudança de governo — Hungria               │
│ ██████████████████░░ 85%  ← 1 ano             │
│ ↓ -8% (oposição venceu eleição)               │
└────────────────────────────────────────────────┘
```

### Tela: Previsão Detalhada

```
┌──────────────────────────────────────────────────┐
│ ← Voltar    🔮 Conflito armado — Oriente Médio   │
├──────────────────────────────────────────────────┤
│                                                  │
│  Probabilidade: ████████████████░░░░ 78%         │
│  Horizonte: 90 dias (expira 15/07/2026)          │
│  Confiança: 70%                                  │
│                                                  │
│  📈 Evolução                                      │
│  65% → 72% → 78%                                 │
│  ↑ Mobilização ↑ Incidente fronteiriço          │
│                                                  │
│  🔗 Padrão Identificado                          │
│  "Escalada de tensão → Conflito armado"          │
│  Etapa atual: 3/4 (incidentes fronteiriços)      │
│  Historicamente: 65% de completude (15/23)        │
│                                                  │
│  📚 Eventos Históricos Similares                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Crise da Crimeia 2014        Sim: 82%      │ │
│  │ Guerra do Yom Kippur 1973    Sim: 71%      │ │
│  │ Invasão do Kuwait 1990       Sim: 65%      │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ⚡ Gatilhos que AUMENTARIAM a chance             │
│  • Rompimento diplomático formal                 │
│  • Ataque a infraestrutura civil                 │
│  • Aliança militar com potência externa          │
│                                                  │
│  🕊️ Gatilhos que REDUZIRIAM a chance             │
│  • Acordo de cessar-fogo                        │
│  • Mediação internacional (ONU)                 │
│  • Retirada de tropas da fronteira               │
│                                                  │
│  🎭 Cenários                                     │
│  Provável (55%): Escaramuças limitadas por 60d   │
│  Possível (25%): Conflito aberto com alianças     │
│  Improvável (20%): Desescalada diplomática        │
│                                                  │
│  📊 Track Record do Profeta                      │
│  Acertos (últimos 12m): 68% | Brier: 0.18      │
│                                                  │
├──────────────────────────────────────────────────┤
│ 🏠  📊  🗺️  🔮  ⚙️                              │
└──────────────────────────────────────────────────┘
```

### Widget: Track Record

```
┌──────────────────────────────────────────────┐
│ 🏆 TRACK RECORD DO PROFETA                   │
│                                              │
│ Previsões totais: 142                         │
│ Corretas: 89 (63%) | Parciais: 28 (20%)      │
│ Incorretas: 18 (13%) | Expiradas: 7 (5%)     │
│                                              │
│ Brier Score: 0.21 (0=perfeito, 1=péssimo)   │
│ Calibração: 0.87 (1.0=perfeito)             │
│                                              │
│ Melhor tipo:  conflto (72% acerto)           │
│ Pior tipo:    pandemia (45% acerto)          │
│                                              │
│ 📈 Tendência: melhorando (+5% vs 6m atrás)  │
└──────────────────────────────────────────────┘
```

---

## Fontes de Dados Históricos

| Fonte | Período | Tipo | Acesso |
|-------|---------|------|--------|
| **Wikipedia API** | Toda história | Eventos, guerras, crises, eleições | Grátis, API aberta |
| **GDELT** | 1979-presente | 300M+ eventos globais | Grátis, API |
| **ACLED** | 1997-presente | Conflitos armados | Grátis (acadêmico) |
| **Polity IV** | 1800-2018 | Regimes políticos | Grátis |
| **CNTS** | 1815-presente | Conflitos internacionais | Pago |
| **World Bank** | 1960-presente | Indicadores econômicos | Grátis, API |
| **V-Dem** | 1789-presente | Democracia, direitos | Grátis |
| **UCDP** | 1989-presente | Conflitos armados | Grátis |
| **ICEWS** | 1995-presente | Eventos políticos | Grátis |

### Estratégia de ingestão

1. **Primeiro carregamento:** Wikipedia (eventos principais por país) + GDELT (últimos 40 anos)
2. **Incremental:** GDELT atualiza diariamente
3. **Curadoria manual:** eventos-chave que o LLM deve sempre considerar (ex: "Primavera Árabe", "Crise de 2008", "Impeachment de Dilma")
4. **LLM enriquece:** cada evento histórico é processado pelo LLM para extrair causes, consequences, key_entities, similarity_tags

---

## Cron do Profeta

```json
{
  "crons": [
    {
      "path": "/api/cron/collect",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/cron/prophecy",
      "schedule": "0 * * * *"
    }
  ]
}
```

O Profeta roda **a cada hora**, após o pipeline de coleta. Ele:
1. Pega stories atualizadas nas últimas 2h
2. Busca padrões e eventos históricos similares
3. Gera novas previsões ou atualiza existentes
4. Verifica se alguma previsão expirou → resolve

---

## Implementação por Fase

| Fase | O quê | Quando |
|------|-------|--------|
| 1 | Criar tabela `historical_events` + ingestão Wikipedia/GDELT | Fase 2 |
| 2 | Criar tabela `event_patterns` + LLM identifica padrões | Fase 3 |
| 3 | Criar `predictions` + `prediction_updates` + motor de previsão | Fase 3 |
| 4 | Atualização bayesiana automática | Fase 4 |
| 5 | `prediction_audits` + track record + aprendizado | Fase 6 |
| 6 | Tela do Profeta no Flutter | Fase 5 |