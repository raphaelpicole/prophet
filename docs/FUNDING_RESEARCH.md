# Funding Research — Análise de Financiamento de Medios

## Visão

Identificar e visualizar **quem financia** cada fonte de notícia — anunciantes, patrocinadores, acionistas, governos e grupos econômicos. Esta informação é crucial para entender viés editorial e conflitos de interesse.

## Por que isso importa?

> "Quem paga a conta, escolhe a música." — ditado jornalístico

Uma emissora de TV depende de:
- **Publicidade** (empresas que anunciam)
- **Governo** (publicidade estatal, concessões)
- **Acionistas** (grupos econômicos)
- **Licenças** (taxas de concessão)

Entender quem financia ajuda a explicar **por que** uma fonte trata ciertos temas de certa forma.

## Fontes de Dados

### 1. Dados Públicos de Empresas

| Fonte | O que buscar |
|-------|-------------|
| Receita Federal | Quadro societário, CNPJ |
| CVM (Comissão de Valores Mobiliários) | Acionistas de empresas de capital aberto |
| Jornais/Anuncios | Históricos de patrocinadores |
| LinkedIn | Estrutura corporativa |

### 2. Databases de Mídia

| Database | Cobertura |
|----------|----------|
| **Reuters Institute Digital News Report** | Dados de consumo e modelos de negócio |
| **Pew Research** | Dados de financiamento de medios |
| **OpenSecrets** | Money in politics (EUA) |
| **Media Lens** | Análises de viés (UK) |

### 3. Dados de Publicidade Governamental

| País | Onde buscar |
|------|------------|
| Brasil | Portal da Transparência, CEAG |
| EUA | USAspending.gov |
| UK | GOV.UK advertising |

### 4. Recursos Corporativos

- **Annual Reports** (relatórios anuais de empresas de mídia)
- **Wikipedia** (seções de financiamento dos artigos de medios)
- **Newsguard** (ratings de confiança e transparência)

## Implementação no Prophet

### Funcionalidade 1: Pesquisa de Donos/Financiadores

```
[Aglomeração de telas: NewsGuard/OpenCorporates popup]
- Busca por fonte de notícia
- Retorna: dono, controladores, receita estimada, principais anunciantes
- Score de transparência
```

**Fluxo de dados:**
```
[Fontes] → [NewsGuard API / OpenCorporates] → [LLM extrai financiamento]
                                              → [Supabase: source_metadata.funding]
                                              → [Frontend: Badge de transparência]
```

### Funcionalidade 2: Radar de Publicidade Governamental

Mostrar quanto o governo gasta com propaganda em cada veículo.

```
[Mapa do Brasil com bolhas]
- Tamanho da bolha = valor de propaganda governamental
- Cor = partido/governo atual
- Filtro por ano/governo
```

### Funcionalidade 3: Score de Independência

Combinar múltiplos fatores:
- % de receita de publicidade governamental
- Identificação de donos/grupos econômicos
- Histórico de processos/críticas
- Participação em redes de desinformação (NewsGuard)

```
Score 0-100:
100 = 100% independente (financiamento coletivo, sem ads)
  0 = 100% dependente de uma fonte (governo, partido, magnate)
```

## Queries de Referência

### Buscar announcers de um meio brasileiro

```sql
-- Exemplo: quem anuncia na Globo via transparência de dados públicos
SELECT advertiser, SUM(value) as total
FROM government_ads
WHERE medium = 'globo'
  AND year >= 2020
GROUP BY advertiser
ORDER BY total DESC;
```

### Verificar sociedade de um grupo de mídia

```sql
-- Exemplo: quadro societário da Record
SELECT partner, cnpj, participation
FROM ReceitaFederal
WHERE cnpj_root = '78XXX'  -- CNPJ base da Record
```

## Tabelas Propostas

```sql
-- Informações de financiamento das fontes
CREATE TABLE source_funding (
  id                uuid primary key,
  source_id         uuid references sources(id),
  owner_name        text,
  parent_company    text,
  shareholders      jsonb default '[]',
  revenue_estimate  text,
  ad_revenue_pct    real,
  government_ads_pct real,
  transparency_score int,  -- 0-100
  last_updated      timestamptz default now(),
  sources_cited     text[]  -- fontes da pesquisa
);

-- Patrocinadores/anunciantes conhecidos
CREATE TABLE source_advertisers (
  id          uuid primary key,
  source_id   uuid references sources(id),
  advertiser  text not null,
  industry    text,
  estimated_annual_value text,
  since_year  int,
  notes       text
);
```

## Prioridade de Implementação

| Fase | Descrição | Prioridade |
|------|-----------|-----------|
| 1 | Anotação manual em cada fonte (donos conhecidos) | Alta |
| 2 | Integração NewsGuard API (rating de transparência) | Alta |
| 3 | Busca semi-automatizada via LLM (pesquisa web) | Média |
| 4 | Radar de propaganda governamental BR | Média |
| 5 | Score de independência calculado | Baixa |

## Notas

- Feature **NARRATIVE_ANALYSIS** deve incluir seção de "Conflito de interesse" quando a narrativa favorece financiador
- Ferramenta de **investigação de financiamento** pode ser separate do dashboard principal (research mode)
- Manter histórico de mudanças de ownership (quando um meio muda de dono)

## Referências

- [NewsGuard](https://www.newsguardtech.com) — Rating de confiança e transparência
- [OpenCorporates](https://opencorporates.com) — Database corporativo
- [Reuters Institute DNR](https://www.digitalnewsreport.org) — Relatório anual de mídia
- [Portal da Transparência](https://portaldatransparencia.gov.br) — Gastos governo brasileiro
- [Anatel](https://www.gov.br/anatel) — Concessões de rádio/TV
