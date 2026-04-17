# Prophet — Cronograma de Desenvolvimento

## Visão Geral

**Duração estimada:** 6-8 semanas (1 pessoa full-time ou 2 pessoas part-time)
**Dependências críticas:** Conta Supabase (grátis), conta Vercel (grátis), API key LLM

---

## FASE 1: Infraestrutura & Setup (Semana 1)

### Objetivo
Ambiente de desenvolvimento funcional, schema do banco aplicado, primeiro deploy.

### Tarefas
| # | Tarefa | Esforço | Pode fazer? |
|---|--------|---------|-------------|
| 1.1 | Criar projeto Supabase (free tier) | 30 min | ❌ Você (precisa do seu email) |
| 1.2 | Rodar schema SQL completo | 15 min | ✅ Eu forneço o script |
| 1.3 | Configurar Vercel projeto + env vars | 45 min | ✅ Eu crio o boilerplate |
| 1.4 | Setup repositório GitHub | 20 min | ✅ Eu inicializo e estruturo |
| 1.5 | Criar conta LLM (GLM/OpenAI) e pegar API key | 30 min | ❌ Você (dados sensíveis) |

### Entregáveis
- [ ] Supabase project rodando
- [ ] Vercel deploy inicial (hello world)
- [ ] Repo GitHub estruturado (`main`, `develop` branches)
- [ ] `.env.example` documentado

### Como ajudo
- Script SQL pronto pra copiar/colocar
- Boilerplate Node.js/TypeScript com estrutura de pastas
- `vercel.json` configurado com cron jobs
- Documentação de variáveis de ambiente

---

## FASE 2: Coleta de Dados (Semanas 2-3)

### Objetivo
Coletadores funcionando para todas as 10 fontes, deduplicação implementada.

### Tarefas
| # | Tarefa | Esforço | Pode fazer? |
|---|--------|---------|-------------|
| 2.1 | Implementar collector RSS genérico | 4h | ✅ Eu escrevo completo |
| 2.2 | Implementar scraper para Metrópoles | 3h | ✅ Eu escrevo |
| 2.3 | Implementar scraper para ICL Notícias | 3h | ✅ Eu escrevo |
| 2.4 | Testar cada fonte individualmente | 4h | 🔶 Junto — você valida os dados |
| 2.5 | Implementar deduplicação (3 camadas) | 6h | ✅ Eu escrevo completo |
| 2.6 | Testar deduplicação com dados reais | 3h | 🔶 Junto — analisamos falsos positivos |
| 2.7 | Criar job cron Vercel (a cada 15min) | 1h | ✅ Eu configuro |

### Entregáveis
- [ ] 7 fontes RSS funcionando (G1, Folha, UOL, Estadão, O Globo, BBC, Reuters, CNN)
- [ ] 2 scrapers funcionando (Metrópoles, ICL)
- [ ] Deduplicação: URL + hash + embedding
- [ ] ~1000 artigos coletados sem duplicatas

### Como ajudo
- Código completo dos collectors com tratamento de erro
- Logs detalhados pra debug
- Script de teste unitário pra cada fonte
- Análise de falsos positivos na deduplicação

---

## FASE 3: Análise com LLM (Semanas 3-4)

### Objetivo
Pipeline de análise extraindo todas as entidades, viés, sentimento, ciclos.

### Tarefas
| # | Tarefa | Esforço | Pode fazer? |
|---|--------|---------|-------------|
| 3.1 | Criar prompt otimizado pro LLM | 4h | 🔶 Junto — iteramos juntos |
| 3.2 | Implementar analyzer (1 chamada = tudo) | 6h | ✅ Eu escrevo |
| 3.3 | Implementar batch processing (rate limit) | 3h | ✅ Eu escrevo |
| 3.4 | Implementar upsert de entidades | 4h | ✅ Eu escrevo |
| 3.5 | Implementar story grouper | 5h | ✅ Eu escrevo |
| 3.6 | Calibrar thresholds (bias, sentimento) | 4h | 🔶 Junto — você define os limites |
| 3.7 | Criar job de análise (separado do coletor) | 2h | ✅ Eu configuro |

### Entregáveis
- [ ] Analyzer extrai: personagens, regiões, viés, sentimento, ciclos, categorias
- [ ] Entidades sendo deduplicadas (Lula = Luiz Inácio)
- [ ] Stories sendo agrupadas automaticamente
- [ ] ~500 artigos analisados com alta confiança (>70%)

### Como ajudo
- Prompt engineering otimizado (temperature 0.1, formato JSON estrito)
- Código com retry e fallback
- Dashboard de calibração (análise de amostras)
- Ajuste de thresholds baseado em resultados reais

---

## FASE 4: API REST (Semana 4)

### Objetivo
Endpoints pro Flutter consumir dados filtrados e agregados.

### Tarefas
| # | Tarefa | Esforço | Pode fazer? |
|---|--------|---------|-------------|
| 4.1 | Criar endpoints: `/stories` (CRUD + filtros) | 4h | ✅ Eu escrevo |
| 4.2 | Criar endpoints: `/indicators` (dashboard) | 3h | ✅ Eu escrevo |
| 4.3 | Criar endpoints: `/entities` (busca) | 2h | ✅ Eu escrevo |
| 4.4 | Criar endpoints: `/search` (texto livre) | 4h | ✅ Eu escrevo |
| 4.5 | Implementar paginação e cache | 3h | ✅ Eu escrevo |
| 4.6 | Documentar API (OpenAPI/Swagger) | 3h | ✅ Eu gero |
| 4.7 | Testar endpoints com Postman/Insomnia | 2h | 🔶 Junto — você valida |

### Entregáveis
- [ ] API documentada e testada
- [ ] Filtros funcionando: data, região, ciclo, viés, entidade
- [ ] Busca semântica por embedding
- [ ] Resposta < 500ms para queries comuns

### Como ajudo
- Código completo dos endpoints
- OpenAPI spec gerada
- Coleção Postman exportada
- Exemplos de queries pra cada caso de uso

---

## FASE 5: Dashboard Web (Flutter) — Semanas 5-6

### Objetivo
Painel visual interativo funcionando no browser.

### Tarefas
| # | Tarefa | Esforço | Pode fazer? |
|---|--------|---------|-------------|
| 5.1 | Setup Flutter Web projeto | 2h | ✅ Eu crio estrutura |
| 5.2 | Criar models (DTOs) mapeando API | 3h | ✅ Eu gero do OpenAPI |
| 5.3 | Implementar service layer (HTTP client) | 3h | ✅ Eu escrevo |
| 5.4 | Tela Dashboard (KPIs + gráficos) | 8h | ✅ Eu escrevo |
| 5.5 | Tela Lista de Histórias (filtros) | 6h | ✅ Eu escrevo |
| 5.6 | Tela Timeline (evolução da story) | 6h | ✅ Eu escrevo |
| 5.7 | Tela Mapa (visualização geográfica) | 6h | ✅ Eu escrevo |
| 5.8 | Tela Detalhe (comparação fontes) | 6h | ✅ Eu escrevo |
| 5.9 | Responsividade mobile | 4h | ✅ Eu ajusto |
| 5.10 | Deploy Vercel (Flutter Web) | 2h | ✅ Eu configuro |

### Entregáveis
- [ ] 5 telas funcionais conforme wireframes
- [ ] Dashboard responsivo (desktop + mobile)
- [ ] Realtime updates (Supabase Realtime opcional)
- [ ] URL acessível: `prophet.vercel.app`

### Como ajudo
- Estrutura Flutter completa (clean architecture)
- Widgets customizados (bias meter, heatmap, timeline)
- Integração com Supabase client
- Build e deploy automatizado no Vercel

---

## FASE 6: Polish & Lançamento (Semana 7-8)

### Objetivo
Sistema estável, documentado, pronto pra uso.

### Tarefas
| # | Tarefa | Esforço | Pode fazer? |
|---|--------|---------|-------------|
| 6.1 | Otimizar queries lentas | 4h | ✅ Eu analiso e ajusto |
| 6.2 | Adicionar rate limiting na API | 2h | ✅ Eu configuro |
| 6.3 | Criar página de status (health check) | 2h | ✅ Eu crio |
| 6.4 | Documentação usuário final | 4h | ✅ Eu escrevo |
| 6.5 | Documentação técnica (README) | 3h | ✅ Eu escrevo |
| 6.6 | Teste de carga (simular 1000 usuários) | 3h | 🔶 Junto — você roda os testes |
| 6.7 | Backup e disaster recovery | 2h | ✅ Eu documento |
| 6.8 | Lançamento 🚀 | 1h | 🎉 Juntos! |

### Entregáveis
- [ ] Sistema rodando 24/7 estável
- [ ] Docs completas
- [ ] Monitoramento (logs + alertas)
- [ ] Lançamento público

---

## Resumo: O que Posso Fazer

### ✅ Eu faço sozinho (código):
- Todo o backend Node.js/TypeScript
- Todos os coletores (RSS + scrapers)
- Deduplicação e analyzer
- API REST completa
- Flutter Web (todas as telas)
- Schema SQL e migrations
- Deploy Vercel/Supabase configs
- Documentação técnica

### 🔶 Fazemos juntos (decisões + validação):
- Prompt do LLM (iteração)
- Thresholds de calibração (bias, sentimento)
- Testes de qualidade (falsos positivos)
- Validação de dados reais
- Design final (cores, tipografia)

### ❌ Você precisa fazer (dados sensíveis/contas):
- Criar conta Supabase
- Criar conta Vercel
- Criar conta LLM (GLM/OpenAI) + API key
- Configurar domínio custom (opcional)
- Cobrança/separação de custos (se escalar)

---

## Próximo Passo Imediato

Quer que eu comece preparando o **boilerplate completo**?

1. Estrutura de pastas Node.js + TypeScript
2. Configuração Vercel + Cron jobs
3. Primeiro collector (G1) funcionando local
4. Testes unitários setup

Isso deixa você pronto pra só conectar as contas e rodar.

**Tempo:** 2-3h de trabalho meu
**Sua ação depois:** criar as contas e colar as credenciais no `.env`

Quer que eu faça isso?