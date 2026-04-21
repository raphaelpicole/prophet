# Prophet — Cronograma do Projeto

> Última atualização: 2026-04-21

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

## ✅ Fase 4 — Pipeline LLM (19-20/abr)
- [x] `/api/cron/collect` — RSS → Supabase com dedup real
- [x] `stories` table populada + grouping automático
- [x] **Ollama Cloud** adaptado — `OLLAMA_API_KEY` configurada no Vercel, usa `gemma4:31b`
- [x] Sports filter — keyword-based, remove artigos de esportes
- [x] Future event filter — ignora artigos sobre eventos futuros
- [x] Article grouping com `shouldGroupWithStory` + similarity detection
- [x] `story_articles` junction table populada no collect
- [x] Historical events seed — 34 eventos históricos para analogia (via predictions table)
- [x] Historical predictions — reasoning-based predictions com Ollama (JSON em description)
- [x] Stories buscam predictions via `/api/story` endpoint

---

## ✅ Fase 5 — Melhorias (18-21/abr)
- [x] **Filtro por região** no RadarScreen → chips com região + cor
- [x] **PWA** — manifest.json + iOS meta tags (add to home screen)
- [x] **Story timeline** — gráfico de evolução temporal com fl_chart
- [x] **Mapa heatmap** — CircleLayer com densidade de histórias por região
- [x] **Track record real** — predictions table + API real (35 previsões, 71% accuracy)
- [x] **Twitter/X share** — botão partilhar story (url_launcher)
- [x] **Responsivo** — side nav em desktop (>800px), bottom nav em mobile
- [x] **Monitorização** — logs table + logError em todos os endpoints + ConfigScreen
- [x] **Admin tab** — 3 abas (Ações/Tabelas/Logs), 9 tabelas, 5 botões de acção
- [x] **ProphetScreen detail** — bottom sheet ao clicar previsão com probabilidade, Brier score
- [x] **Story article preview** — cards expandem na web mostrando preview de artigos
- [x] **Fontes internacionais** — 6 novas fontes (AP News, Al Jazeera, France24, DW, RTÉ, NBC)
- [x] **Foreign Media section** no AnalysisScreen com fontes estrangeiras
- [x] **Sports filter na API** — stories esportivas filtradas no `/api/stories` (keywords expandidas)
- [x] **HTML entities decode** — `&#8220;`, `&#215;`, `&amp;` etc. convertidos para caracteres normais
- [x] **Historical events hidden from UI** — seed events (`source=prophet-historical` sem story_id) não aparecem no Profeta, apenas contexto LLM
- [x] **Historical predictions com reasoning** — prediction card mostra análogo histórico, reasoning, confiança, horizonte

---

## ✅ Fase 6 — Polimento & QA (20-21/abr)
- [x] **Sports filter no collect** — filtro expandido (times brasileiros: Atlético-MG, Coritiba, Flamengo, etc.)
- [x] **Sports stories deletadas** — 11 stories esportivas/celebridades removidas do banco
- [x] **Article 2+ para prediction** — só gera previsão se story tem ≥2 artigos (mais realista)
- [x] **Sports filter na API** — filtro em `/api/stories` antes de retornar ao Flutter
- [x] **Vercel API consolidation** — 8 serverless functions (≤12 limit do Hobby plan)
- [x] **Bug fixes** — storiesRes query movida para depois do insert; JSON parse de predictions
- [x] **CI/CD GitHub Actions** — `.github/workflows/ci.yml` com test + lint jobs
- [x] **Celebridades filter** — BBB, reality shows, anitta, cinema, shows, turnês filtrados
- [x] **Mapa desabilitado** — tab removido da navegação (foco em análise de viés)
- [x] **Timeline colapsável no RadarScreen** — gráfico de ciclos + stories recentes no topo
- [x] **Story detail melhorado** — cards de artigos com fonte, título, summary e tempo relativo
- [x] **PWA manifest corrigido** — theme-color #0D1117, ícones verificados
- [x] **indicators.js com dados reais** — agregação de stories últimos 7 dias (ciclos, regiões, hot stories)
- [x] **Tabela analysis_summary** — migration `007_analysis_summary.sql` criada

---

## 📋 Backlog (pós-lançamento)
- [ ] Agregação de artigos (ideal: 5-15 por story) — melhorar grouping no collect
- [ ] Mais fontes RSS — decisão no final do projeto
- [ ] Push notifications (web push)
- [ ] LLM analysis pipeline completo (`grouper.ts` wiring)

---

## 🗺️ Arquitetura Atual

```
Flutter Web (app/)
  └─ ApiService → https://prophet-nofpwylvr-raphaelpicoles-projects.vercel.app/api

Vercel (serverless functions — 8 total)
  └─ api/collect.js     → pipeline completo (16 fontes: 10 BR + 6 internacional)
  └─ api/stories.js     → Supabase stories (filtro sports/celebridades, HTML decode)
  └─ api/story.js       → Supabase articles (junction) + prediction
  └─ api/misc.js        → consolidated: hello, regions, sources, historical
  └─ api/data.js        → consolidated: predictions, logs
  └─ api/admin-panel.js → consolidated: admin actions + tables
  └─ api/indicators.js  → agregações reais (7 dias)
  └─ api/health.js      → health check

Supabase (banco)
  └─ raw_articles (~420 artigos)
  └─ story_articles (junction table)
  └─ sources (16 fontes: 10 BR + 6 internacional)
  └─ stories (~90 stories, filtro sports/celebridades)
  └─ regions (8 regiões seed)
  └─ analysis_summary (diário: ciclos+regiões)
  └─ predictions (35 reais, 71% accuracy)
  └─ predictions (34 seed events históricos — contexto LLM)
  └─ logs (monitorização)
```

---

## 🔑 Notas Importantes
- **Production URL**: https://prophet-nofpwylvr-raphaelpicoles-projects.vercel.app
- **Repo**: github.com/raphaelpicole/prophet
- **OLLAMA_API_KEY**: configurada no Vercel (gemma4:31b)
- **SUPABASE_KEY**: hardcoded nos API files
- **RLS**: tabelas predictions e logs com policies para anon insert/read
- **Vercel Hobby limit**: 12 serverless functions (usando 8 ✅) | 1 cron/day (diário 8h BRT)
- **Foco do produto**: análise de viés midiático — impacto no Brasil, mundo e conflitos

---

## ⚠️ Decisões Pendentes (antes do lançamento)
- [ ] **Monetização** — definir modelo antes de lançar (freemium, API B2B, relatórios, newsletter)
  - Trade-off: ads conflita com missão (anunciantes = financiadores da mídia que o Prophet analisa)
  - Prioridade: API B2B ou relatórios como fonte de receita

---

## 📊 Estatísticas Atuais (21/abr)

| Métrica | Valor |
|---------|-------|
| Stories | ~90 |
| Artigos totais | ~420 |
| Previsões | 35 |
| Accuracy | 71% |
| Brier Score | 0.40 |
| Fontes | 16 (10 BR + 6 intl) |
| Ciclos ativos | 7 |

---

## 📊 Fontes Ativas (16)

### Brasil (10)
G1, Folha de S.Paulo, UOL, Estadão, O Globo, BBC News, CNN Brasil, ICL Notícias, Metropoles, Reuters

### Internacional (6)
AP News, Al Jazeera, France 24, DW English, RTÉ News, NBC News
