# Prophet — Cronograma do Projeto

> Última atualização: 2026-04-20

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
- [x] **Ollama Cloud** adaptado — `OLLAMA_API_KEY` configurada no Vercel, usa `gemma4:31b`
- [ ] `analysis` table populada via LLM
- [ ] `stories` grouping automático via `grouper.ts` ( wiring pendente)

---

## ✅ Fase 5 — Melhorias (18-20/abr)
- [x] **Filtro por região** no RadarScreen → chips com região + cor
- [x] **PWA** — manifest.json + iOS meta tags (add to home screen)
- [x] **Story timeline** — gráfico de evolução temporal com fl_chart
- [x] **Mapa heatmap** — CircleLayer com densidade de histórias por região
- [x] **Track record real** — predictions table + API real (8 previsões, 71% accuracy)
- [x] **Twitter/X share** — botão partilhar story (url_launcher)
- [x] **Responsivo** — side nav em desktop (>800px), bottom nav em mobile
- [x] **Monitorização** — logs table + logError em todos os endpoints + ConfigScreen
- [x] **Admin tab** — 3 abas (Ações/Tabelas/Logs), 9 tabelas, 5 botões de acção
- [x] **ProphetScreen detail** — bottom sheet ao clicar previsão com probabilidade, Brier score, model_used
- [x] **Story article preview** — cards expandem na web mostrando preview de artigos
- [x] **Fontes internacionais** — 6 novas fontes (AP News, Al Jazeera, France24, DW, RTÉ, NBC)
- [x] **Foreign Media section** no AnalysisScreen com fontes estrangeiras

---

## 📋 Backlog
- Docker local para collect (sem Vercel) — REMOVIDO
- Push notifications (web push) — REMOVIDO
- LLM analysis pipeline (necessita `LLM_API_KEY` no Vercel env vars)
- Story grouping automático via grouper.ts
- Agregação de artigos (ideal: 5-15 por story)
- Mais fontes RSS

---

## 🗺️ Arquitetura Atual

```
Flutter Web (app/)
  └─ ApiService → https://prophet-olive.vercel.app/api

Vercel (serverless functions)
  └─ api/stories.js     → Supabase stories (com preview_articles, filtro region)
  └─ api/story.js       → Supabase articles (via story_articles junction)
  └─ api/sources.js     → Supabase sources (v_source_stats view)
  └─ api/predictions.js → predictions table (track record real)
  └─ api/indicators.js  → agregações Supabase
  └─ api/logs.js        → logs table (monitorização)
  └─ api/admin/tables.js → todas as tabelas com paginação
  └─ api/admin/actions.js → botões de acção (collect, analyze, group, cleanup, status)
  └─ api/cron/collect.js → pipeline completo (16 fontes: 10 BR + 6 internacional)

Supabase (banco)
  └─ raw_articles (280+ artigos)
  └─ story_articles (junction table)
  └─ sources (16 fontes: 10 BR + 6 internacional)
  └─ stories (30 stories com region + cycle)
  └─ regions (8 regiões seed)
  └─ v_source_stats (view com stats reais)
  └─ predictions (8 previsões, 71% accuracy, Brier 0.21)
  └─ logs (monitorização de erros)
  └─ analysis (⚠ pendente — LLM pipeline)
  └─ entities (⚠ pendente — LLM pipeline)
```

---

## 🔑 Notas Importantes
- **Production URL**: https://prophet-olive.vercel.app
- **Repo**: github.com/raphaelpicole/prophet
- **OLLAMA_API_KEY**: configurada no Vercel (gemma4:31b)
- **SUPABASE_KEY**: hardcoded nos API files
- **RLS**: tabelas predictions e logs com policies para anon insert/read
- **Monitorização**: logError em todos os endpoints + ConfigScreen

---

## 📊 Fontes Ativas (16)

### Brasil (10)
G1, Folha de S.Paulo, UOL, Estadão, O Globo, BBC News, CNN Brasil, ICL Notícias, Metropoles, Reuters

### Internacional (6)
AP News, Al Jazeera, France 24, DW English, RTÉ News, NBC News
