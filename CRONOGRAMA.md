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

## 🔄 Fase 4 — Pipeline LLM (pendente)
- [ ] Coletor cron diário (RSS → Supabase)
- [ ] `stories` table populada com grouping automático
- [ ] `analysis` table populada (viés/sentimento por artigo)
- [ ] `regions` e `v_source_stats` criados no banco real

---

## 📋 Fase 5 — Melhorias (backlog)
- [ ] Notificações push (web push)
- [ ] PWANable — add to home screen
- [ ] Gráfico de evolução temporal de story (sentiment trend)
- [ ] Filtro por região no RadarScreen → `GET /api/stories?region=X`
- [ ] Mapa com heatmap de histórias por região
- [ ] Track record real do Prophet (tabela `predictions`)
- [ ] Integração Twitter/X para share de stories
- [ ] Docker local pra rodar collect sem Vercel

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
  └─ raw_articles (✔ dados reais)
  └─ stories (✔ sendo populado pelo collect)
  └─ sources (✔ configurado)
  └─ regions (⚠ pendente — usar mock)
  └─ v_source_stats (⚠ pendente — usar mock)
  └─ analysis (⚠ pendente — LLM pipeline)
  └─ predictions (⚠ pendente — forecasting)
```

---

## 🔑 Notas Importantes
- **Token Mapbox**: commitado (reconhecido pelo GitHub secret scanning — Rapha approve manualmente)
- **SUPABASE_KEY**: hardcoded nos API files (viaja no build)
- **OLLAMA_CLOUD_MODEL**: `gemma4:31b` para análise LLM
- **Collect cron**: agendado externamente via `/api/cron/collect`
