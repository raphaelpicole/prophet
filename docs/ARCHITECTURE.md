# Prophet — Arquitetura

## Estado Atual (18/04/2026)

### ✅ Funcionando
- Backend: https://prophet-olive.vercel.app (produção)
- Frontend: https://app-ten-kappa-76.vercel.app
- API: `/api/stories`, `/api/indicators`, `/api/collect`, `/api/hello`
- Pipeline: coleta RSS → mock analyzer → stories
- Banco: Supabase com 20 tabelas + views

### ❌ Problemas Conhecidos
- Groq: "Organization has been restricted" → análise usa mock
- Fontes quebradas: Folha (404), Estadão (404), O Globo, Metrópoles, ICL, Reuters

---

## Visão Geral

Painel de acompanhamento em tempo real das histórias do mundo. Notícias são coletadas, desduplicadas, categorizadas e apresentadas com indicadores visuais.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend/Jobs | Node.js (TypeScript) — Vercel Serverless Functions |
| Banco | Supabase (PostgreSQL) |
| Frontend | Flutter Web |
| Infra | Vercel (backend + hosting) |

## Fluxo de Dados

```
[Fontes de Notícia] → [Crawler/Scraper] → [Deduplicação] → [Análise IA] → [Análise Narrativa] → [Supabase DB]
                                                                                            ↓
                                              [Flutter Web] ← [Supabase Realtime / REST API]
```

### Análise Narrativa Comparativa

Quando >= 2 fontes cobrem a mesma story, o Prophet compara:
- **Enquadramento** (como cada fonte "conta" a história)
- **Fatos compartilhados vs disputados vs omitidos**
- **Tom e estilo** (sensacionalista, informativo, combativo, analítico)
- **Viés** dispersão entre fontes
- **Evolução temporal** (como a narrativa muda ao longo do tempo)

Ver documentação completa em `NARRATIVE_ANALYSIS.md`.

## Componentes

### 1. News Collector (Node — Serverless)
- **Trigger:** Cron job (Vercel Cron) a cada X minutos
- **Fontes:** RSS feeds, scraping de portais (G1, Folha, BBC, Reuters, CNN, etc.)
- **Output:** Notícia bruta com título, URL, conteúdo, fonte, data de publicação

### 2. Deduplicator (Node — Serverless Function)
- Compara título + conteúdo com hash semântico (embedding) contra DB existente
- Se similaridade > threshold → merge/atualiza a história existente
- Se nova → insere como nova notícia

### 3. Analyzer (Node — Serverless Function)
- Usa LLM (GLM/GPT) para extrair:
  - Personagens
  - Regiões
  - Assunto principal
  - Ciclo da humanidade
  - Viés político
  - Sentimento
  - Categorias de análise
- Escreve resultados no Supabase

### 4. API Layer (Node — Vercel Serverless)
- REST endpoints para o Flutter consumir
- Filtros: por região, assunto, ciclo, viés, data
- Agregações para indicadores

### 5. Flutter Web Panel
- Dashboard com indicadores em tempo real
- Mapa de calor por região
- Timeline de histórias
- Filtros e busca

## Estrutura de Diretórios (Backend)

```
prophet/
├── docs/                    # Documentação
│   ├── ARCHITECTURE.md
│   └── DATABASE.md
├── server/                  # Node.js — Vercel
│   ├── api/                 # Serverless functions
│   │   ├── cron/
│   │   │   └── collect.ts   # Vercel Cron entry
│   │   ├── analyze.ts       # Análise + categorização
│   │   ├── stories.ts       # CRUD histórias
│   │   └── indicators.ts    # Agregações
│   ├── src/
│   │   ├── collectors/      # Scrapers por fonte
│   │   ├── dedup/           # Lógica de desduplicação
│   │   ├── analyzer/        # LLM analysis pipeline
│   │   ├── db/              # Supabase client & queries
│   │   └── utils/
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json
├── app/                     # Flutter Web
│   ├── lib/
│   │   ├── models/
│   │   ├── services/
│   │   ├── screens/
│   │   └── widgets/
│   └── pubspec.yaml
└── README.md
```

## Vercel Cron

```json
{
  "crons": [{
    "path": "/api/cron/collect",
    "schedule": "*/15 * * * *"
  }]
}
```

## Variáveis de Ambiente

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
LLM_API_KEY=
LLM_BASE_URL=
NEWS_SOURCES=                  # JSON com configuração das fontes
```