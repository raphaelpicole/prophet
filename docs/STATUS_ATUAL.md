# Prophet — Estado Atual (18/04/2026)

> Última atualização: 18/04/2026 09:50 BRT

---

## ✅ O QUE FUNCIONA

### Backend (Vercel)
- **URL de produção:** https://prophet-olive.vercel.app
- **Preview:** https://prophet-j56vnn3hv-raphaelpicoles-projects.vercel.app
- `/api/stories` ✅ — retorna stories do banco
- `/api/indicators` ✅ — KPIs agregados
- `/api/hello` ✅
- `/api/collect` ✅ — executa pipeline completo

### Pipeline (funcionando)
1. **Coleta** ✅ — RSS de G1, BBC, CNN, UOL, Folha (404), Estadão (404)
2. **Deduplicação** ✅ — por URL + hash
3. **Análise** ✅ — mock analyzer (Groq desabilitado por restrição de org)
4. **Agrupamento** ✅ — stories criadas corretamente
5. **Status:** ~200 notícias coletadas, ~20 analisadas por rodada

### Frontend (Flutter Web)
- **URL:** https://app-ten-kappa-76.vercel.app
- **Stack:** Flutter Web, tema dark (#0D0D0D), 5 telas
- **Dados:** conectado ao backend real (não mock)
- Loading state + fallback pro mock quando API vazia

### Supabase (Banco)
- **URL:** https://jtyxsxyesliekbuhgkje.supabase.co
- **Tabelas funcionando:** stories, raw_articles, analysis, story_articles, sources
- **Views:** v_story_indicators, v_source_stats
- **Colunas analysis já adicionadas:** bias_score, sentiment_score, political_bias, categories, framing, confidence, main_subject, analysis_version, model_used, tokens_used, raw_response

---

## ❌ O QUE NÃO FUNCIONA

### Groq API (Análise LLM)
- **Problema:** "Organization has been restricted. Please reach out to support if you believe this was in error."
- **Impacto:** Análise usa mock em vez de LLM real
- **Solução:** Aktivieren ou usar outro provedor (OpenAI, GLM, Claude)

### Fontes que quebram
- **Folha de S.Paulo:** HTTP 404 no RSS
- **Estadão:** HTTP 404 no RSS
- **O Globo:** sem coleta
- **Metropoles:** sem coleta
- **ICL Notícias:** sem coleta
- **Reuters:** sem coleta

---

## 📋 ENDPOINTS IMPLEMENTADOS

| Método | Path | Status |
|--------|------|--------|
| `GET` | `/api/stories` | ✅ |
| `GET` | `/api/indicators` | ✅ |
| `GET` | `/api/hello` | ✅ |
| `POST` | `/api/collect` | ✅ |
| `GET` | `/api/stories/:id` | ❌ não implementado |
| `GET` | `/api/sources` | ❌ não implementado |
| `GET` | `/api/narrative/:storyId` | ❌ não implementado |
| `GET` | `/api/prophet/predictions` | ❌ não implementado |
| `GET` | `/api/search` | ❌ não implementado |

---

## 📂 ESTRUTURA DE ARQUIVOS

```
prophet/
├── AGENTS.md                    # Configuração do agent
├── IDENTITY.md                  # Identidade do projeto
├── SOUL.md                       # Personalidade
├── USER.md                      # Dados do usuário
├── docs/
│   ├── ARCHITECTURE.md           # Arquitetura simplificada
│   ├── ARCHITECTURE_FULL.md      # Fluxograma completo
│   ├── DATABASE.md               # Schema SQL completo
│   ├── SUPABASE_DEPLOY.md        # Guia de deploy Supabase
│   ├── SCHEMA_API.md             # Schema + API (design completo)
│   ├── WIREFRAMES.md             # Wireframes das telas
│   ├── NARRATIVE_ANALYSIS.md     # Análise narrativa (planejado)
│   ├── PROPHET_ENGINE.md         # Motor preditivo (planejado)
│   ├── CRONOGRAMA.md             # Cronograma do projeto
│   └── FUNDING_RESEARCH.md       # Pesquisa de funding
├── server/                       # Backend Node.js/TypeScript
│   ├── api/
│   │   ├── collect.ts           # Endpoint de coleta
│   │   ├── cron/collect.ts       # Vercel Cron handler
│   │   ├── indicators.ts         # KPIs
│   │   ├── stories.ts            # CRUD stories
│   │   └── fix-db.ts             # Utilitário (debug)
│   ├── src/
│   │   ├── collectors/           # RSS/Scraper por fonte
│   │   ├── analyzer/             # Groq/mock analyzers
│   │   ├── pipeline/             # Worker do pipeline
│   │   ├── dedup/                # Deduplicação
│   │   └── db/                   # Cliente Supabase
│   └── dist/                     # Build compilado
├── app/                          # Frontend Flutter Web
│   └── lib/
│       ├── core/theme/           # AppTheme (dark)
│       ├── data/models/          # Story, Indicator
│       ├── data/services/        # ApiService, MockService
│       └── presentation/
│           ├── screens/          # 5 telas (Radar, etc)
│           └── widgets/          # KPI, StoryCard, CycleDonut
├── supabase/migrations/
│   └── 001_initial_schema.sql    # Schema do banco
└── vercel.json                   # Config Vercel
```

---

## 🔧 CONFIGURAÇÃO ATUAL

### Supabase
- **Project:** jtyxsxyesliekbuhgkje
- **URL:** https://jtyxsxyesliekbuhgkje.supabase.co
- **Key:** hardcoded nos arquivos (não usar env vars no Vercel serverless)

### Groq
- **API Key:** não configurada (desabilitada por restrição de org)
- **Model:** `llama-3.3-70b-versatile` (configurado mas não usado)

### Vercel
- **Project:** prophet (team raphaelpicole-projects)
- **Build:** `npm install && cd server && npm install`
- **Output Directory:** `.` (root)

---

## 📊 MÉTRICAS ATUAIS

- **Stories no banco:** ~20 (cada uma com 1 artigo)
- **Artigos pendentes:** ~190
- **Artigos analisados:** ~20
- **Pipeline runs:** executando localmente com `GROQ_API_KEY=x npx tsx src/pipeline/worker.ts`

---

##-NEXT STEPS PRIORITÁRIOS

1. **Corrigir Groq** — resolver restrição de organização OU migrar para outro LLM
2. **Implementar mais fontes** — corrigir collectors quebrados
3. **Tela de detalhe da story** — Flutter StoryCard → tela completa
4. **Vincular outras telas ao backend** — Análise, Profeta, Mapa, Config
5. **Deploy produção Flutter** — https://prophet-olive.vercel.app (não preview)
6. **Configurar Vercel Cron** — agendamento automático do `/api/collect`
7. **Análise narrativa comparativa** — implementar `/api/narrative/:storyId`
8. **Motor do Profeta** — predictions + pattern matching

---

## 📝 LIÇÕES APRENDIDAS

1. **`process.env` no Vercel Serverless** — não funciona como esperado; credentials precisam ser hardcoded
2. **Supabase schema cache** — colunas criadas depois do deploy inicial não aparecem até restart da conexão; solução: adicionar manualmente pelo SQL Editor
3. **PostgreSQL `.is('id', 'not.null')`** — não é suporte pelo client Supabase; usar apenas `.eq()` puro
4. **GitHub push protection** — chaves hardcoded disparam scanning; usar `--amend` + force push para corrigir commits com secrets