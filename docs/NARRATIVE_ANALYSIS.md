# Prophet — Narrative Analysis (Análise Narrativa Comparativa)

## Visão

Analisar a **mesma história** coberta por **fontes diferentes**, comparando:
- **Estilo do texto** (tom, vocabulário, extensão, profundidade)
- **Narrativa abordada** (enquadramento, protagonismo, o que é destacado vs omitido)
- **Fatos mencionados** (quais fatos cada fonte inclui/exclui)
- **Evolução temporal** (como a narrativa muda ao longo do tempo em cada fonte)

## Caso de Uso

> "A mesma notícia da Operação Narco Fluxo foi tratada pelo G1 como 'esquema de lavagem de dinheiro', pela Folha como 'PF prende funkeiros' e pelo ICL como 'Choquei entra na mira da PF'. Quais fatos cada um destacou? O que foi omitido? Como a narrativa evoluiu de hora em hora?"

## Fluxo de Dados (atualizado)

```
[Fontes] → [Crawler] → [Deduplicação] → [Agrupamento por Story]
                                                        ↓
                                              [Análise IA por artigo]
                                                        ↓
                                              [Análise Narrativa Comparativa]
                                                        ↓
                                              [Timeline de Evolução Narrativa]
                                                        ↓
                                              [Supabase DB] → [API] → [Flutter Web]
```

## Novas Tabelas / Campos

### 1. `narrative_analysis` — Análise comparativa por story

```sql
create table narrative_analysis (
  id                uuid default uuid_generate_v4() primary key,
  story_id          uuid not null references stories(id) on delete cascade,
  analyzed_at       timestamptz default now(),

  -- Enquadramento
  dominant_frame    text,                          -- "combate ao crime" vs "perseguição política" vs "espetacularização"
  framing_variance  real default 0,               -- 0.0 = todos enquadram igual; 1.0 = enquadramentos totalmente opostos

  -- Fatos
  shared_facts      jsonb default '[]',           -- fatos mencionados por TODAS as fontes
  disputed_facts    jsonb default '[]',           -- fatos mencionados por apenas algumas fontes
  omitted_facts     jsonb default '[]',           -- fatos importantes omitidos por alguma fonte [{fact, omitted_by: [source_ids]}]

  -- Tom e estilo
  tone_analysis     jsonb default '{}',            -- {source_id: {tone: "sensacionalista|informativo|analítico|combativo", vocabulary_level: "popular|médio|formal", emotion_score: 0.8}}

  -- Entidades
  entity_prominence jsonb default '[]',            -- [{entity_name, mentioned_by: [source_ids], role_by_source: {source_id: "protagonista"|"citado"}}]

  -- Viés
  bias_spread       jsonb default '{}',            -- {source_id: bias_score} — dispersão de viés entre fontes

  -- Evolução
  narrative_shift   text,                          -- Descrição de como a narrativa mudou desde o primeiro artigo
);
```

### 2. `source_narrative_profile` — Perfil narrativo de cada fonte

```sql
create table source_narrative_profile (
  id                uuid default uuid_generate_v4() primary key,
  source_id         uuid not null unique references sources(id) on delete cascade,
  updated_at        timestamptz default now(),

  -- Perfil editorial
  editorial_line    text,                          -- "centro-esquerda, informativo, amplo"
  typical_tone      text,                          -- "neutro|combativo|sensacionalista|analítico"
  avg_article_length int,                           -- média de palavras por artigo
  vocabulary_level  text,                          -- "popular|médio|formal|acadêmico"

  -- Padrões
  preferred_frames  jsonb default '[]',            -- enquadramentos mais comuns ["combate ao crime", "vitimismo", "heroísmo"]
  entity_preferences jsonb default '{}',           -- entidades que a fonte tende a destacar ou omitir
  omission_patterns  jsonb default '[]',           -- padrões de omissão recorrentes

  -- Estatísticas
  total_analyzed    int default 0,
  avg_bias_score    real default 0,
  avg_sentiment     real default 0,
  avg_confidence    real default 0,
);
```

### 3. `narrative_timeline` — Evolução temporal da narrativa

```sql
create table narrative_timeline (
  id                uuid default uuid_generate_v4() primary key,
  story_id          uuid not null references stories(id) on delete cascade,
  source_id         uuid not null references sources(id) on delete cascade,
  article_id        uuid not null references raw_articles(id) on delete cascade,
  timestamp         timestamptz not null,           -- when the article was published

  -- Snapshot da narrativa no momento
  frame             text,                            -- enquadramento neste momento
  key_facts         jsonb default '[]',             -- fatos mencionados neste artigo
  tone              text,                            -- tom deste artigo
  bias_score        real,
  sentiment_score   real,

  -- Deltas (mudanças desde o artigo anterior da mesma fonte sobre a mesma story)
  narrative_delta   text,                           -- "mudou de tom combativo para informativo"
  new_facts_added   jsonb default '[]',             -- fatos que não estavam no artigo anterior
  facts_dropped     jsonb default '[]',             -- fatos que saíram do artigo anterior
);
```

## Pipeline Atualizado

### Etapa nova: `analyzeNarrative()` (após `analyzePending()`)

```
1. Buscar todos os artigos analisados que pertencem à mesma story
2. Agrupar por source_id
3. Se >= 2 fontes cobriram a mesma story:
   a. Prompt de análise comparativa:
      "Dado os seguintes artigos de fontes diferentes sobre o mesmo assunto,
       identifique:
       - Fatos que TODOS mencionam (consenso)
       - Fatos que apenas ALGUNS mencionam (disputa)
       - Fatos importantes omitidos por alguma fonte
       - Diferenças de enquadramento e tom
       - Entidades com papéis diferentes por fonte"
   b. Salvar em narrative_analysis
   c. Atualizar source_narrative_profile com padrões
4. Para cada artigo, criar entrada em narrative_timeline
5. Comparar com artigo anterior da mesma fonte sobre a mesma story → calcular delta
```

### Prompt de Análise Narrativa

```python
NARRATIVE_ANALYSIS_PROMPT = """
Você é um analista de mídia do Prophet. Dado um conjunto de artigos de fontes diferentes
cobrindo a mesma história, identifique:

1. CONSENSO: Fatos mencionados por TODAS as fontes
2. DISPUTA: Fatos mencionados por apenas algumas fontes — quais e quem omite o quê
3. ENQUADRAMENTO: Como cada fonte "enquadra" a história (ex: "combate ao crime" vs "perseguição" vs "espetacularização")
4. TOM: Classifique cada fonte (sensacionalista|informativo|analítico|combativo|opinativo)
5. ENTIDADES: Quem cada fonte coloca como protagonista, quem cita, quem omite
6. VIÉS: Na escala -1 a +1, qual o viés político de cada cobertura?
7. EVOLUÇÃO: Se houver artigos de momentos diferentes, como a narrativa mudou?

Responda em JSON:
{
  "consensus_facts": ["fato1", "fato2"],
  "disputed_facts": [{"fact": "descrição", "mentioned_by": ["g1"], "omitted_by": ["folha"]}],
  "framing_by_source": {"g1": "combate ao crime", "folha": "investigação jornalística"},
  "tone_by_source": {"g1": "informativo", "icl": "combativo"},
  "entity_roles": {"Lula": {"g1": "citado", "folha": "protagonista", "icl": "omisso"}},
  "bias_by_source": {"g1": 0.0, "folha": -0.3, "icl": -0.6},
  "narrative_evolution": "O ICL foi o primeiro a mencionar X, depois o G1 incluiu no dia seguinte..."
}
"""
```

## API Endpoints Novos

### `GET /api/narrative/:storyId`
Retorna análise narrativa completa de uma story, incluindo comparação entre fontes e timeline.

### `GET /api/narrative/:storyId/timeline`
Retorna a evolução temporal da narrativa, artigo por artigo, fonte por fonte.

### `GET /api/sources/:sourceId/profile`
Retorna o perfil narrativo de uma fonte (padrões de viés, tom, omissões).

### `GET /api/narrative/insights`
Retorna insights gerais:
- Stories com maior divergência narrativa entre fontes
- Fontes que mais omitem fatos relevantes
- Enquadramentos mais comuns por viés político

## Visualização no Dashboard (Flutter Web)

### Tela: Comparação Narrativa

```
┌─────────────────────────────────────────────────────┐
│ STORY: Operação Narco Fluxo                        │
│                                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│ │   G1    │ │  FOLHA  │ │   ICL   │               │
│ │ 📰 78%  │ │ 📰 65%  │ │ 📰 82%  │ ← cobertura  │
│ │ ➡️ 0.0  │ │ ➡️ -0.3 │ │ ⬅️ -0.6 │ ← viés      │
│ │ ℹ️ Info │ │ 📊 Anal │ │ 🔥 Comb │ ← tom        │
│ └─────────┘ └─────────┘ └─────────┘               │
│                                                     │
│ CONSENSO: ✅ 5 fatos                                │
│ • PF prendeu MC Ryan e Poze do Rodo                 │
│ • Esquema de R$ 1,6 bi                             │
│ • Operação Narco Fluxo                              │
│ • Lavagem de dinheiro                              │
│ • Dono do Choquei preso                             │
│                                                     │
│ DISPUTA: ⚠️ 3 fatos                                 │
│ • "8 das 10 músicas mais ouvidas" → só G1          │
│ • "CPI desmoralizada" → só ICL                      │
│ • "FMI projeta dívida 100% PIB" → só Folha          │
│                                                     │
│ OMITIDOS: 🔴                                        │
│ • G1 omitiu: ligação com CPI                       │
│ • Folha omitiu: "trabalho até exaustão"            │
│ • ICL omitiu: detalhes do esquema de bets          │
│                                                     │
│ TIMELINE: ──────────────────────────────────────    │
│ 14:00 G1: "PF prende funkeiros em esquema"         │
│ 15:00 FOLHA: "Operação mira R$ 1,6 bi"            │
│ 17:00 ICL: "Choquei entra na mira da PF"          │
│ 19:00 G1: + "8 das 10 mais ouvidas"               │
│ 21:00 ICL: + "CPI desmoralizada"                  │
└─────────────────────────────────────────────────────┘
```

### Widget: Barômetro de Viés

```
Esquerda ◄──────────────┼──────────────────► Direita
         ICL    Folha         G1
         -0.6   -0.3          0.0
```

### Widget: Radar de Omissões

```
Fato → Fontes que mencionaram
────────────────────────────────
"Esquema de bets" → G1 ✅ Folha ✅ ICL ❌
"CPI desmoralizada" → G1 ❌ Folha ❌ ICL ✅
"Dívida 100% PIB" → G1 ❌ Folha ✅ ICL ❌
```

## Prioridade de Implementação

1. **Fase 2 (agora):** Adicionar campos `framing`, `tone`, `omitted_facts` no prompt do Analyzer existente
2. **Fase 3:** Criar tabela `narrative_analysis` + endpoint `/api/narrative/:storyId`
3. **Fase 4:** Criar `source_narrative_profile` + análise de padrões por fonte
4. **Fase 5:** Implementar `narrative_timeline` + deltas temporais
5. **Fase 5 (Flutter):** Tela de comparação narrativa no dashboard

## Impacto no Schema Atual

### Campos novos em `analysis` (tabela existente)

```sql
alter table analysis add column framing text;
alter table analysis add column tone text;
alter table analysis add column omitted_facts jsonb default '[]';
alter table analysis add column narrative_role text;
  -- "primeira fonte" | "reforço" | "contraponto" | "exclusiva"
```

### View nova: `v_narrative_comparison`

```sql
create view v_narrative_comparison as
select
  s.id as story_id,
  s.title,
  s.main_subject,
  count(distinct ra.source_id) as source_count,
  count(distinct a.id) as article_count,
  avg(a.bias_score) as avg_bias,
  stddev(a.bias_score) as bias_spread,
  min(a.analyzed_at) as first_coverage,
  max(a.analyzed_at) as last_coverage
from stories s
join story_articles sa on sa.story_id = s.id
join raw_articles ra on ra.id = sa.article_id
join analysis a on a.article_id = ra.id
group by s.id;
```