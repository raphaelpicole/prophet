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
- [x] **RadarScreen** — stories com busca + filtros de ciclo + região
- [x] **StoryDetailScreen** — artigos reais via API + sentiment timeline chart
- [x] **AnalysisScreen** — viés por fonte + grid
- [x] **MapScreen** — Mapbox dark, marcadores por região + heatmap circles
- [x] **ProphetScreen** — previsões com filtros por ciclo + track record real
- [x] **ConfigScreen** — monitoramento de logs em tempo real
- [x] Bottom navigation + routing + responsive layout (side nav desktop)

---

## ✅ Fase 4 — Pipeline LLM (parcialmente completo)
- [x] `/api/cron/collect` — RSS → Supabase com dedup real
- [x] `stories` table populada + grouping (parcial)
- [x] `regions` e `v_source_stats` criados no banco real
- [ ] `analysis` table populada via LLM (`LLM_API_KEY` needed)
- [ ] `stories` grouping automático via `grouper.ts` ( wiring pendente)

---

## ✅ Fase 5 — Melhorias (18/abr à tarde)
- [x] **Filtro por região** no RadarScreen → chips com região + cor
- [x] **PWA** — manifest.json + iOS meta tags (add to home screen)
- [x] **Story timeline** — gráfico de evolução temporal com fl_chart
- [x] **Mapa heatmap** — CircleLayer com densidade de histórias por região
- [x] **Track record real** — predictions table + API real (8 previsões, 71% accuracy)
- [x] **Twitter/X share** — botão partilhar story (url_launcher)
- [x] **Responsivo** — side nav em desktop (>800px), bottom nav em mobile
- [x] **Monitorização** — logs table + logError em todos os endpoints + ConfigScreen
- [ ] **Docker local** — collect sem Vercel
- [ ] **Push notifications** — web push

---

## 🗺️ Arquitetura Atual

```
Flutter Web (app/)
  └─ ApiService → https://prophet-olive.vercel.app/api

Vercel (serverless functions)
  └─ api/stories.js     → Supabase stories (com filtro region)
  └─ api/story.js       → Supabase articles (via story_articles junction)
  └─ api/sources.js     → Supabase sources (v_source_stats view)
  └─ api/regions.js     → mock regions
  └─ api/predictions.js → predictions table (track record real)
  └─ api/indicators.js  → agregações Supabase
  └─ api/logs.js        → logs table (monitorização)
  └─ api/cron/collect.js → RSS → Supabase pipeline

Supabase (banco)
  └─ raw_articles (✔ 283+ artigos)
  └─ story_articles (✔ junction table)
  └─ sources (✔ 10 fontes ativas)
  └─ stories (✔ 20 stories com region + cycle)
  └─ regions (✔ 8 regiões seed)
  └─ v_source_stats (✔ view com stats reais)
  └─ predictions (✔ 8 previsões, 71% accuracy, Brier 0.21)
  └─ logs (✔ monitoramento de erros)
  └─ analysis (⚠ pendente — LLM pipeline)
```

---

## 🔑 Notas Importantes
- **Production URL**: https://prophet-olive.vercel.app
- **Token Mapbox**: commitado (client-safe, pk.eyJ1...)
- **SUPABASE_KEY**: hardcoded nos API files (viaja no build)
- **RLS**: tabelas predictions e logs têm policies para anon insert/read
- **Monitorização**: todos os endpoints têm logError() que regista no banco
- **Filtro região**: stories.region populada com 'SAM' (América do Sul)

---

## 📋 Backlog
- Docker local para collect (sem Vercel)
- Push notifications (web push)
- LLM analysis pipeline (necessita `LLM_API_KEY` no Vercel env vars)
- Story grouping automático via grouper.ts