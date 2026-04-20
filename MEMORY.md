# Prophet — Estado Atual (2026-04-20)

## Projeto
- **Tipo:** Aggregator de notícias com IA
- **Stack:** Flutter Web + Node.js API + Supabase (PostgreSQL)
- **Repo:** `github.com/raphaelpicole/prophet`
- **Vercel Project:** `prophet`

## Caminho ABSOLUTO do Projeto
`/Users/ti/.openclaw/workspace/prophet/`

## URLs Atuais (verificadas em 2026-04-20)
- **Flutter:** `https://prophet-9v2jem4ra-raphaelpicoles-projects.vercel.app`
- **API:** `https://prophet-h1ildogos-raphaelpicoles-projects.vercel.app`
- **Alias:** `prophet-olive.vercel.app`

## Estrutura de Pastas
```
prophet/
├── api/                    ← API Vercel (serverless functions)
│   ├── __tests__/          ← Testes Node.js (13 testes passing)
│   ├── cron/collect.js     ← Pipeline RSS + Ollama
│   ├── stories.js          ← GET stories
│   ├── story.js            ← GET story detail
│   ├── indicators.js       ← KPIs por ciclo/região
│   ├── health.js           ← Health check endpoint
│   └── admin/              ← Admin tables + actions
├── app/                    ← Flutter Web app
│   └── lib/presentation/screens/
│       ├── radar_screen.dart    ← Timeline + Trends implementados
│       └── story_detail_screen.dart
└── .github/workflows/ci.yml  ← GitHub Actions CI/CD
```

## Pendências
- Health endpoint ainda não foi deployado (precisa deploy primeiro)
- Timeline/Trends no RadarScreen (implementado pelo agente frontend)
- Agrupamento de artigos (melhorado pelo agente coletor)

## Importante: NÃO CONFUNDIR COM
- `/Users/ti/.openclaw/workspace/` ← Root workspace (NÃO É O PROPHET)
- O Prophet vive em `/Users/ti/.openclaw/workspace/prophet/`
- Qualquer arquivo criado deve ser dentro de `prophet/`
