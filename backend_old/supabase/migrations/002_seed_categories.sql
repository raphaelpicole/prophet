-- ============================================================
-- Migration 002: Seed Categories (8 categorias de viés)
-- ============================================================

INSERT INTO categories (key, name, description, weight_default, display_order) VALUES
  (
    'ideologico',
    'Ideológico',
    'Viés político que posiciona a matéria em relação a esquerda/direita/centro. Mede alinhamento com correntes políticas específicas.',
    1.00,
    1
  ),
  (
    'economico',
    'Econômico',
    'Viés relacionado à preferência por políticas de mercado livre versus intervenção estatal. Mede alinhamento com correntes econômicas.',
    1.00,
    2
  ),
  (
    'geopolitico',
    'Geopolítico',
    'Viés que reflete alinhamento com nações, blocos ou movimentos geopolíticos específicos. Identifica lealdades e antipatias internacionais.',
    1.00,
    3
  ),
  (
    'social',
    'Social',
    'Viés em questões sociais como família, religião, costumes, moral. Mede posicionamento entre progressista e conservador.',
    1.00,
    4
  ),
  (
    'framing',
    'Framing',
    'Viés de enquadramento: como a história é contada, quais aspectos são destacados ou omitidos, que narrativa é construída.',
    1.00,
    5
  ),
  (
    'emocional',
    'Emocional',
    'Viés que mede o uso de linguagem emocional para manipular o leitor: medo, raiva, esperança, indignação, etc.',
    1.00,
    6
  ),
  (
    'temporal',
    'Temporal',
    'Viés de urgência e temporalidade: sensacionalismo, "fim do mundo", exaggerated timelines, catastrophizing.',
    1.00,
    7
  ),
  (
    'authority',
    'Authority',
    'Viés de autoridade: uso excessivo de fontes anônimas, apelo a autoridade sem contexto,名人介入 não verificado.',
    1.00,
    8
  );
