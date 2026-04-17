-- ============================================================
-- Migration 003: Seed Cycles
-- ============================================================

INSERT INTO cycles (name, period_years, phase, description, current_position, confidence) VALUES
  (
    'Kondratieff',
    54.0,
    'high',
    'Ciclo económico de longa duração (50-60 anos). Cada onda é associada a uma revolução tecnológica: vapor (1770s), aço (1830s), petróleo (1880s), automóveis (1930s), tecnologia da informação (1970s), IA (2020s).',
    0.72,
    0.78
  ),
  (
    'Juglar',
    8.5,
    'low',
    'Ciclo de investimento em capital fixo (7-10 anos). Alternância entre períodos de expansão e contração do investimento empresarial.',
    0.35,
    0.65
  ),
  (
    'Kitchin',
    3.5,
    'high',
    'Ciclo de inventários e confiança empresarial (2-4 anos). Variações de curto prazo nos estoques e na percepção do clima de negócios.',
    0.68,
    0.55
  ),
  (
    'Ciclo Político BR',
    4.0,
    'election',
    'Ciclo eleitoral brasileiro com intensidade de 4 anos. Períodos pré-eleitorais tendem a ter maior spending público e políticas expansionistas.',
    0.45,
    0.72
  ),
  (
    'Ciclo Conflito Geopolítico',
    NULL,
    'active',
    'Padrão de escalada e retração de conflitos geopolíticos. Baseado na teoria dos ciclos de guerra de Jack Goldstone e Pointer. Ativado por tensões comerciais, corridas armamentistas e ressentimentos históricos.',
    0.71,
    0.68
  ),
  (
    'Onda Democratização',
    25.0,
    'low',
    'Ondas de democratização e redemocratização identificadas por Samuel Huntington. Terceira onda (1974-presente) está em retrocesso parcial.',
    0.28,
    0.61
  ),
  (
    'El Niño / Oscilação Sul',
    5.2,
    'neutral',
    'Ciclo climático do Pacífico que afeta padrões climáticos globais. Impacta agricultura, desastres naturais e mercados de commodities.',
    0.50,
    0.82
  ),
  (
    'Ciclo Solar (Hathaway)',
    11.0,
    'low',
    'Ciclo de manchas solares com média de 11 anos. Máximos solares estão associados a maior atividade geomagnética, comunicacões e clima espacial.',
    0.22,
    0.75
  ),
  (
    'Ciclo de Pandemias',
    100.0,
    'high',
    'Ciclos de pandemias globais. Baseado em dados de doenças infecciosas desde a Peste Negra. Período ativo com COVID-19 e preocupação com doenças respiratórias.',
    0.85,
    0.55
  ),
  (
    'Ciclo Commodities',
    20.0,
    'high',
    'Ciclo de preços de commodities (Super-cycles). Duração média de 20-30 anos. Associado a revoluções industriais e urbanização.',
    0.65,
    0.58
  );
