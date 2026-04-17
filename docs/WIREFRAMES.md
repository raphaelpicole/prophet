# Prophet — Wireframes v2 (com Profeta)

## Setup

- **Frames:** Mobile 390×844 | Tablet 768×1024 | Desktop 1440×900
- **Grid:** 8px
- **Tema:** Dark mode (bg #0D0D0D, surface #1A1A1A, card #242424)
- **Primária:** #6C5CE7 (roxo)
- **Alerta:** #FF6B6B / #FFD93D / #6BCB77
- **Profeta:** #A855F7 (roxo-claro, distinguir da primária)
- **Fonte:** Inter

---

## Bottom Navigation (5 abas)

```
🏠 Radar    📊 Análise    🔮 Profeta    🗺️ Mapa    ⚙️ Config
```

---

## Tela 1: Radar (Home)

```
┌──────────────────────────────────────────────────────────┐
│ 🔮 Prophet                              🔔  👤          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  KPI Cards (scroll horizontal)                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ 📰 847  │ │ 🔥 12   │ │ 🔮 5    │ │ ⚠️ 3    │      │
│  │ artigos │ │ stories │ │ previsões│ │ alertas │      │
│  │ /dia    │ │ quentes │ │ ativas  │ │ hoje    │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                          │
│  ── 🔥 Histórias Quentes ──────────────────────────────  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Operação Narco Fluxo                              │  │
│  │ 3 fontes • 14 artigos • 6h atrás                  │  │
│  │ Divergência narrativa: 🔴 Alta                     │  │
│  │ ┌─G1──┐ ┌─Folha─┐ ┌─ICL──┐                       │  │
│  │ │ 0.0 │ │ -0.3 │ │ -0.6 │  bias bar              │  │
│  │ └─────┘ └──────┘ └──────┘                         │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Escala 6×1                                        │  │
│  │ 5 fontes • 23 artigos • 2h atrás                  │  │
│  │ Divergência narrativa: 🟡 Média                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ── 🔮 Previsões do Profeta ──────────────────────────  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ⚠️ Conflito armado — Oriente Médio                │  │
│  │ ████████████████░░░░ 78%   ← 90 dias              │  │
│  │ ↑ +13% desde ontem                                │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 📉 Crise econômica — Argentina                    │  │
│  │ ████████████░░░░░░░░ 62%   ← 6 meses              │  │
│  │ ↑ +5% (FMI liberou US$ 1 bi)                     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ── 📊 Painel Rápido ─────────────────────────────────  │
│  ┌─────────────────────┐  ┌──────────────────────┐      │
│  │ Ciclo Dominante    │  │ Sentimento Geral      │      │
│  │  Donut:            │  │  Gauge:               │      │
│  │  Político 40%     │  │  ◄──😐──────────►     │      │
│  │  Econômico 25%    │  │     -0.1 neutro        │      │
│  │  Social 15%       │  │                        │      │
│  └─────────────────────┘  └──────────────────────┘      │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 🏠 Radar  📊 Análise  🔮 Profeta  🗺️ Mapa  ⚙️ Config │
└──────────────────────────────────────────────────────────┘
```

---

## Tela 2: Análise Narrativa

```
┌──────────────────────────────────────────────────────────┐
│ ← Voltar    Operação Narco Fluxo              🔗 ⋮       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ── 📊 Barômetro de Viés ────────────────────────────── │
│  Esquerda ◄─────────────────────────────────────► Direita│
│           ICL    Folha         G1    Estadão  OGlobo     │
│          -0.6   -0.3          0.0    0.3     0.4        │
│                                                          │
│  ── 📰 Cobertura por Fonte ──────────────────────────── │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Fonte     │ Artigos │ Tom         │ Enquadramento  │ │
│  │  G1        │    4    │ Informativo │ "Operação PF"  │ │
│  │  Folha     │    3    │ Analítico   │ "Esquema R$1,6bi"│
│  │  ICL       │    2    │ Combativo   │ "Choquei na mira"│
│  │  Estadão   │    3    │ Informativo │ "Funkeiros presos"│
│  │  O Globo   │    2    │ Sensacional.│ "Funk e crime" │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ── ✅ Fatos Consenso (5) ───────────────────────────── │
│  ┌────────────────────────────────────────────────────┐ │
│  │ • PF prendeu MC Ryan e MC Poze do Rodo             │ │
│  │ • Esquema de lavagem de R$ 1,6 bilhão             │ │
│  │ • Operação Narco Fluxo                             │ │
│  │ • Dono do Choquei preso                            │ │
│  │ • Bets ilegais financiavam esquema                 │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ── ⚠️ Fatos Disputados (3) ──────────────────────────  │
│  ┌────────────────────────────────────────────────────┐ │
│  │ • "8/10 músicas mais ouvidas" → ✅G1 ❌Folha ❌ICL│ │
│  │ • "CPI desmoralizada"        → ❌G1 ❌Folha ✅ICL│ │
│  │ • "Dívida 100% PIB"         → ❌G1 ✅Folha ❌ICL│ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ── 🔴 Omissões ──────────────────────────────────────  │
│  ┌────────────────────────────────────────────────────┐ │
│  │ • G1 não mencionou ligação com CPI                │ │
│  │ • ICL omitiu detalhes do esquema de bets          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ── 👤 Entidades — Protagonismo ──────────────────────  │
│  ┌────────────────────────────────────────────────────┐ │
│  │  MC Ryan    → G1: protagonista  Folha: citado     │ │
│  │  Choquei    → G1: citado        ICL: protagonista  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 🏠 Radar  📊 Análise  🔮 Profeta  🗺️ Mapa  ⚙️ Config │
└──────────────────────────────────────────────────────────┘
```

---

## Tela 3: Timeline Narrativa

```
┌──────────────────────────────────────────────────────────┐
│ ← Voltar    Timeline Narrativa               ⋮          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Operação Narco Fluxo                                    │
│  Filtros: [Todas fontes ▾] [Hoje ▾]                    │
│                                                          │
│  14:00 ─── G1 ────────────────────────────────────────  │
│  │  "PF prende funkeiros em esquema de lavagem"        │
│  │  ℹ️ Informativo │ Viés: 0.0 │ Fatos: 3              │
│  │  🔵 Novo fato: "PF prendeu MC Ryan"                │
│  │                                                      │
│  15:00 ─── FOLHA ──────────────────────────────────────  │
│  │  "Operação da PF mira esquema de R$ 1,6 bi"         │
│  │  📊 Analítico │ Viés: -0.3 │ Fatos: 4               │
│  │  🟢 +1 fato: "transações de R$ 1,6 bi"             │
│  │                                                      │
│  17:00 ─── ICL ────────────────────────────────────────  │
│  │  "Choquei entra na mira da PF"                       │
│  │  🔥 Combativo │ Viés: -0.6 │ Fatos: 3               │
│  │  🟢 +1 fato: "ligação com CPI" (exclusivo)         │
│  │                                                      │
│  19:00 ─── G1 ────────────────────────────────────────  │
│  │  "8 das 10 mais ouvidas têm artistas alvos"          │
│  │  ℹ️ Informativo │ Viés: 0.1 (+0.1 📈) │ Fatos: 5    │
│  │  🟢 +2 fatos │ 🔄 Enquadramento mudou              │
│  │                                                      │
│  21:00 ─── ICL ────────────────────────────────────────  │
│     "CPI do Crime termina desmoralizada"                  │
│     🔥 Combativo │ Viés: -0.7 (-0.1 📉) │ Fatos: 4      │
│     🟢 +1 fato │ 🔄 Ângulo expandiu pra política        │
│                                                          │
│  ────── [Carregar mais] ──────                           │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 🏠 Radar  📊 Análise  🔮 Profeta  🗺️ Mapa  ⚙️ Config │
└──────────────────────────────────────────────────────────┘
```

---

## Tela 4: Profeta (NOVA — aba principal)

```
┌──────────────────────────────────────────────────────────┐
│ 🔮 Profeta                                    🏆 0.21  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ── 🏆 Track Record ──────────────────────────────────  │
│  ┌────────────────────────────────────────────────────┐ │
│  │  142 previsões │ 63% corretas │ Brier: 0.21       │ │
│  │  ████████████████████████████░░░░░░░░  Calibração  │ │
│  │  📈 Tendência: melhorando (+5% vs 6m atrás)      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ── Filtros ──────────────────────────────────────────  │
│  [Todas ▾]  [Conflito] [Econômico] [Político] [Social] │
│  [30 dias ▾]                                           │
│                                                          │
│  ── ⚠️ Previsões Ativas ─────────────────────────────  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ⚠️ Conflito armado — Oriente Médio        🔴 Crit  │ │
│  │                                                    │ │
│  │ ████████████████████░░░░░░ 78%                    │ │
│  │ Horizonte: 90 dias │ Confiança: 70%              │ │
│  │                                                    │ │
│  │ ↑ +13% desde ontem                                │ │
│  │ Motivo: Mobilização militar detectada             │ │
│  │                                                    │ │
│  │ Padrão: "Escalada → Conflito" Etapa 3/4           │ │
│  │ Histórico: 15/23 casos completaram (65%)          │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ 📚 Crise da Crimeia 2014      Sim: 82%      │ │ │
│  │ │ 📚 Guerra Yom Kippur 1973    Sim: 71%      │ │ │
│  │ │ 📚 Invasão do Kuwait 1990    Sim: 65%      │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ ⚡ Gatilhos ↑: Rompimento diplomático             │ │
│  │ 🕊️ Gatilhos ↓: Acordo de cessar-fogo             │ │
│  │                                                    │ │
│  │ [Ver detalhes →]                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📉 Crise econômica — Argentina           🟡 Aviso │ │
│  │                                                    │ │
│  │ ████████████████░░░░░░░░░░ 62%                    │ │
│  │ Horizonte: 6 meses │ Confiança: 65%              │ │
│  │                                                    │ │
│  │ ↑ +5% (FMI liberou US$ 1 bi)                    │ │
│  │ Padrão: "Resgate FMI → Estabilização parcial"    │ │
│  │ Histórico: 8/12 estabilizaram (67%)              │ │
│  │                                                    │ │
│  │ [Ver detalhes →]                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🗳️ Mudança de governo — Hungria          🟢 Info  │ │
│  │                                                    │ │
│  │ ██████████████████████████░░ 85%                   │ │
│  │ Horizonte: 1 ano │ Confiança: 80%                 │ │
│  │                                                    │ │
│  │ ↓ -8% (oposição venceu eleição)                   │ │
│  │ Resolvido: ✅ CORRETO — Magyar venceu             │ │
│  │ Brier: 0.02 (excelente)                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ── 📊 Previsões por Tipo ──────────────────────────  │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Conflito    ████████████  5 ativas │ 72% acerto   │ │
│  │  Econômico   ████████      3 ativas │ 61% acerto   │ │
│  │  Político    ██████████    4 ativas │ 68% acerto   │ │
│  │  Social      ████          1 ativa  │ 55% acerto   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 🏠 Radar  📊 Análise  🔮 Profeta  🗺️ Mapa  ⚙️ Config │
└──────────────────────────────────────────────────────────┘
```

---

## Tela 5: Previsão Detalhada

```
┌──────────────────────────────────────────────────────────┐
│ ← Voltar    🔮 Conflito armado — Oriente Médio           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Probabilidade: ████████████████████░░░░ 78%             │
│  Horizonte: 90 dias (expira 15/07/2026)                  │
│  Confiança: 70%                                          │
│                                                          │
│  ── 📈 Evolução da Probabilidade ────────────────────   │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Sparkline: ___/‾‾‾\___/‾‾‾‾‾                    │ │
│  │  65% → 68% → 72% → 78%                            │ │
│  │  Mar 20    Mar 25   Abr 5   Abr 15                 │ │
│  │                                                    │ │
│  │  Updates:                                          │ │
│  │  +13% 15/04 — Mobilização militar detectada       │ │
│  │  +7%  05/04 — Incidente na fronteira              │ │
│  │  +3%  25/03 — Retirada de negociadores             │ │
│  │  Base 20/03 — Previsão criada (65%)               │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ── 🔗 Padrão Identificado ──────────────────────────   │
│  ┌────────────────────────────────────────────────────┐ │
│  │  "Escalada de tensão → Conflito armado"            │ │
│  │                                                    │ │
│  │  Etapa 1: Disputas diplomáticas      ✅ Completa   │ │
│  │  Etapa 2: Mobilização militar        ✅ Completa   │ │
│  │  Etapa 3: Incidentes fronteiriços    🔄 Atual     │ │
│  │  Etapa 4: Conflito armado            ⬜ Pendente   │ │
│  │                                                    │ │
│  │  Progresso: ████████████████░░░░░░ 75%             │ │
│  │  Taxa histórica: 65% (15 de 23)                   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ── 📚 Eventos Históricos Similares ──────────────────   │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Crise da Crimeia 2014                 Sim: 82%    │ │
│  │  → Resultado: Conflito armado (5 dias após etapa 3)│ │
│  │                                                    │ │
│  │  Guerra do Yom Kippur 1973            Sim: 71%    │ │
│  │  → Resultado: Conflito armado (surpresa)            │ │
│  │                                                    │ │
│  │  Invasão do Kuwait 1990              Sim: 65%    │ │
│  │  → Resultado: Conflito armado (3 meses após etapa 3)│ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ── 🎭 Cenários ──────────────────────────────────────  │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ✅ Provável (55%)                                 │ │
│  │  Escaramuças limitadas por 60 dias, sem conflito   │ │
│  │  aberto entre nações                               │ │
│  │                                                    │ │
│  │  ⚠️ Possível (25%)                                 │ │
│  │  Conflito aberto com alianças regionais             │ │
│  │  Envolvimento de potências externas                 │ │
│  │                                                    │ │
│  │  🕊️ Improvável (20%)                               │ │
│  │  Desescalada diplomática, acordo mediado pela ONU   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ── ⚡ Gatilhos ───────────────────────────────────────  │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ↑ AUMENTARIAM a chance                            │ │
│  │  • Rompimento diplomático formal        → +15%     │ │
│  │  • Ataque a infraestrutura civil         → +20%     │ │
│  │  • Aliança militar com potência          → +10%     │ │
│  │                                                    │ │
│  │  ↓ REDUZIRIAM a chance                            │ │
│  │  • Acordo de cessar-fogo                 → -20%    │ │
│  │  • Mediação internacional (ONU)          → -15%    │ │
│  │  • Retirada de tropas da fronteira       → -10%    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 🏠 Radar  📊 Análise  🔮 Profeta  🗺️ Mapa  ⚙️ Config │
└──────────────────────────────────────────────────────────┘
```

---

## Tela 6: Perfil de Fonte

```
┌──────────────────────────────────────────────────────────┐
│ ← Voltar    Perfil: G1                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  G1 — O portal de notícias da Globo              │   │
│  │  🏷️ Centro-esquerda  ℹ️ Informativo  📊 Médio   │   │
│  │  847 artigos/mês │ 1.200 palavras médio          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Viés Histórico                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ~~~~~~~\_______/~~~~~~~~  Média: -0.1           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌────────────┬────────────┬────────────┬────────────┐  │
│  │ Cobertura  │ Velocidade │ Profund.   │ Confiab.   │  │
│  │   78%      │  +15min    │  1.200     │  ⭐⭐⭐⭐  │  │
│  └────────────┴────────────┴────────────┴────────────┘  │
│                                                          │
│  🔴 Padrões de Omissão                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  • Raramente menciona: ligação com CPIs          │   │
│  │  • Tende a omitir: viés de fontes parceiras      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  📈 Enquadramentos Mais Comuns                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  "Operação policial"    ████████████ 32%         │   │
│  │  "Decisão do governo"   ██████████ 25%           │   │
│  │  "Crise econômica"      ████████ 18%             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 🏠 Radar  📊 Análise  🔮 Profeta  🗺️ Mapa  ⚙️ Config │
└──────────────────────────────────────────────────────────┘
```

---

## Tela 7: Mapa Geopolítico

```
┌──────────────────────────────────────────────────────────┐
│ 🔮 Prophet    🗺️ Mapa                       ⚙️          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                                                    │   │
│  │              MAPA INTERATIVO                      │   │
│  │                                                    │   │
│  │    🟡 Europa        🔴 Oriente Médio              │   │
│  │    🟠 América Sul   🔵 Ásia                      │   │
│  │    🟢 Brasil        ⚪ África                     │   │
│  │                                                    │   │
│  │    Pins = stories ativas                          │   │
│  │    Cor = ciclo (vermelho=conflito, etc)            │   │
│  │    Tamanho = hotness                               │   │
│  │    Clique → lista de stories da região             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Camadas: [Stories] [Previsões 🔮] [Calor]              │
│  Filtros: [Todos os ciclos ▾] [24h ▾]                  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 🏠 Radar  📊 Análise  🔮 Profeta  🗺️ Mapa  ⚙️ Config │
└──────────────────────────────────────────────────────────┘
```

---

## Tela 8: Configurações

```
┌──────────────────────────────────────────────────────────┐
│ ⚙️ Configurações                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  👤 Conta                                                │
│  Email: rapha@example.com                               │
│  Plano: Free                                             │
│                                                          │
│  🔔 Notificações                                         │
│  Previsões críticas     [✅]                             │
│  Divergência narrativa  [✅]                             │
│  Novas stories          [ ]                              │
│  Resumo diário          [✅]                             │
│                                                          │
│  📊 Preferências de Dashboard                           │
│  Fontes preferidas    [G1, Folha, ICL, BBC]             │
│  Regiões de interesse [Brasil, América do Sul]           │
│  Cicos prioritários   [Político, Econômico]             │
│  Tema                  [Dark ▾]                         │
│                                                          │
│  🔮 Configurações do Profeta                             │
│  Horizonte mínimo      [30 dias ▾]                      │
│  Probabilidade mínima  [50% ▾]                          │
│  Notificar acima de    [70% ▾]                           │
│                                                          │
│  📈 Dados                                                │
│  Armazenamento: 240 MB / 500 MB                          │
│  Artigos coletados: 847                                 │
│  Previsões ativas: 5                                    │
│  Última coleta: há 12 min                               │
│                                                          │
│  [Limpar cache]  [Exportar dados]  [Sobre o Prophet]    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 🏠 Radar  📊 Análise  🔮 Profeta  🗺️ Mapa  ⚙️ Config │
└──────────────────────────────────────────────────────────┘
```

---

## Componentes Reutilizáveis

1. **Story Card** — título, fontes, bias bar, timestamp, divergência badge
2. **Bias Meter** — barra horizontal ←→ com marcadores por fonte
3. **KPI Card** — ícone + número + label
4. **Fact Item** — texto + badges ✅/❌ por fonte
5. **Source Badge** — nome + cor + viés indicator
6. **Timeline Node** — hora + fonte + resumo + deltas
7. **Cycle Tag** — chip com ícone e nome do ciclo
8. **Prediction Card** — probabilidade bar, horizonte, delta, gatilhos
9. **Pattern Progress** — etapas do padrão (1/4, 2/4...)
10. **Historical Match** — evento + similaridade + resultado
11. **Scenario Card** — provável/possível/improvável
12. **Trigger List** — gatilhos ↑ (verde) e ↓ (vermelho)
13. **Track Record Widget** — brier, calibração, acertos
14. **Bottom Nav** — 5 ícones
15. **Donut Chart** — ciclos
16. **Gauge** — sentimento
17. **Sparkline** — evolução de probabilidade

---

## Ordem de Criação no Figma

1. Setup: frames, cores (#0D0D0D, #6C5CE7, #A855F7), Inter, grid 8px
2. Componentes base: KPI Card, Story Card, Bias Meter, Bottom Nav
3. Tela 1: Radar (Home)
4. Tela 2: Análise Narrativa
5. Tela 3: Timeline
6. Componentes Profeta: Prediction Card, Pattern Progress, Trigger List
7. Tela 4: Profeta (aba principal)
8. Tela 5: Previsão Detalhada
9. Tela 6: Perfil de Fonte
10. Tela 7: Mapa
11. Tela 8: Config
12. Protótipo: conectar navegação