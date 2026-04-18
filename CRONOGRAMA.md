# Prophet — Cronograma do Projeto

> Última atualização: 2026-04-18

---

## ✅ Fase 1 — Infraestrutura (17/abr)
- [x] Repositório + estrutura `server/` + `app/`
- [x] Supabase configurado (schema, tables, views)
- [x] Vercel project + deploy via Git Connect
- [x] API endpoints básicos (`/api/stories`, `/api/indicators`)
- [x] RSS collectors: G1, Folha, UOL, Estadão, O Globo, CNN, BBC, Metropoles
- [x] Deduplicador + pipeline de coleta

---

## ✅ Fase 2 — Backend Completo (18/abr)
- [x] `/api/sources` — lista fontes com stats
- [x] `/api/regions` — árvore hierárquica de regiões
- [x] `/api/story?id=X` — detalhe da story + artigos
- [x] `/api/predictions` — mock de previsões
- [x] Groq analyzer (LLM) + content filter
- [x] Cron job de coleta (`/api/cron/collect`)

---

## ✅ Fase 3 — Frontend Flutter (18/abr)
- [x] Flutter Web app com tema dark
- [x] **RadarScreen** — stories com busca + filtros de ciclo
- [x] **StoryDetailScreen** — artigos reais via API
- [x] **AnalysisScreen** — viés por fonte + grid
- [x] **MapScreen** — Mapbox dark, marcadores por região
- [x] **ProphetScreen** — previsões com filtros por ciclo
- [x] Bottom navigation + routing

---

## 🔄 Fase 4 — Pipeline LLM (parcialmente completo)
- [x] `/api/cron/collect` — RSS → Supabase com dedup real
- [x] `stories` table populada + grouping (parcial)
- [x] `regions` e `v_source_stats` criados no banco real
- [ ] `analysis` table populada via LLM (`LLM_API_KEY` needed)
- [ ] `stories` grouping automático via `grouper.ts` ( wiring pendente)

---

## 📋 Fase 5 — Melhorias (backlog)
- [ ] **Filtro por região no RadarScreen** → `GET /api/stories?region=X`
- [ ] **PWA** — manifest + service worker (add to home screen)
- [ ] **Story timeline** — gráfico de evolução temporal (sentiment trend)
- [ ] **Mapa heatmap** — densidade de histórias por região
- [ ] **Track record real** — tabela `predictions` + histórico
- [ ] **Twitter/X share** — de stories
- [ ] **Docker local** — collect sem Vercel
- [ ] **Push notifications** — web push

---

## 🗺️ Arquitetura Atual

```
Flutter Web (app/)
  └─ ApiService → https://prophet-olive.vercel.app/api

Vercel (serverless functions)
  └─ api/stories.js     → Supabase stories
  └─ api/story.js       → Supabase articles
  └─ api/sources.js     → Supabase sources
  └─ api/regions.js     → mock regions
  └─ api/predictions.js → mock predictions
  └─ api/indicators.js → agregações Supabase
  └─ api/cron/collect.js → RSS → Supabase pipeline

Supabase (banco)
  └─ raw_articles (✔ 263+ artigos)
  └─ sources (✔ 10 fontes ativas)
  └─ stories (✔ 20 stories agrupadas)
  └─ regions (✔ 8 regiões seed)
  └─ v_source_stats (✔ view com stats reais)
  └─ analysis (⚠ pendente — LLM pipeline)
  └─ predictions (⚠ mock — forecasting)
```

---

## 🔑 Notas Importantes
- **Token Mapbox**: commitado (reconhecido pelo GitHub secret scanning — Rapha approve manualmente)
- **SUPABASE_KEY**: hardcoded nos API files (viaja no build)
- **OLLAMA_CLOUD_MODEL**: `gemma4:31b` para análise LLM
- **Collect cron**: agendado externamente via `/api/cron/collect`
