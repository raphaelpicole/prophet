-- ============================================================
-- Migration 006: Seed Subjects (assuntos/temas)
-- ============================================================

-- subjects com UUIDs válidos

INSERT INTO subjects (id, name, slug, description, parent_id, cycle_tags) VALUES
  -- Top-level
  ('a0000001-0000-0000-0000-000000000001', 'Geopolítica', 'geopolitica',
    'Relações internacionais, conflitos, diplomatas, alliances, política externa', NULL,
    ARRAY['ciclo-conflito', 'kondratieff']),
  ('a0000002-0000-0000-0000-000000000002', 'Economia', 'economia',
    'Mercados, políticas monetárias, fiscais, crescimento, recessão', NULL,
    ARRAY['juglar', 'kitchin', 'kondratieff']),
  ('a0000003-0000-0000-0000-000000000003', 'Tecnologia', 'tecnologia',
    'Inovação, IA, startups, big tech, regulação tecnológica', NULL,
    ARRAY['kondratieff']),
  ('a0000004-0000-0000-0000-000000000004', 'Meio Ambiente', 'meio-ambiente',
    'Clima, sustentabilidade, energias renováveis, desastres ecológicos', NULL,
    ARRAY['el-nino', 'ciclo-solar', 'kondratieff']),
  ('a0000005-0000-0000-0000-000000000005', 'Política Interna', 'politica-interna',
    'Eleições, partidos, governo, políticas públicas domesticas', NULL,
    ARRAY['ciclo-politico-br']),
  ('a0000006-0000-0000-0000-000000000006', 'Saúde', 'saude',
    'Pandemias, sistemas de saúde, medicamentos, políticas sanitárias', NULL,
    ARRAY['ciclo-pandemias']),
  ('a0000007-0000-0000-0000-000000000007', 'Conflitos Armados', 'conflitos-armados',
    'Guerras, combates, tensão militar, armas, cessar-fogo', NULL,
    ARRAY['ciclo-conflito']),
  ('a0000008-0000-0000-0000-000000000008', 'Commodities', 'commodities',
    'Petróleo, minérios, agrícolas, preços,供应链', NULL,
    ARRAY['ciclo-commodities', 'el-nino']),
  ('a0000009-0000-0000-0000-000000000009', 'Direitos Humanos', 'direitos-humanos',
    'Liberdades civis, minorias, justiça social, movimentos sociais', NULL,
    ARRAY['onda-democratizacao']),
  ('a0000010-0000-0000-0000-000000000010', 'Migração', 'migracao',
    'Imigração, emigração, refugiados, muros, políticas migratórias', NULL,
    ARRAY['onda-democratizacao', 'ciclo-conflito']);

-- Sub-assuntos (children)
INSERT INTO subjects (id, name, slug, description, parent_id, cycle_tags) VALUES
  -- Geopolítica
  ('b0000001-0000-0000-0000-000000000001', 'Guerra da Ukraine', 'guerra-ucrania',
    'Conflito entre Rússia e Ucrânia, invasão, ocupação, sanções',
    'a0000001-0000-0000-0000-000000000001', ARRAY['ciclo-conflito', 'ciclo-geopolitico']),
  ('b0000002-0000-0000-0000-000000000002', 'Relações EUA-China', 'relacoes-eua-china',
    'Guerra comercial, tensão militar, tecnologia, influência global',
    'a0000001-0000-0000-0000-000000000001', ARRAY['ciclo-conflito', 'kondratieff']),
  ('b0000003-0000-0000-0000-000000000003', 'Taiwan', 'taiwan',
    'Tensão no Estreito de Taiwan, independência, intervenção militar',
    'a0000001-0000-0000-0000-000000000001', ARRAY['ciclo-conflito']),
  ('b0000004-0000-0000-0000-000000000004', 'BRICS', 'brics',
    'Alargamento, desdolarização, influência geopolítica',
    'a0000001-0000-0000-0000-000000000001', ARRAY['kondratieff']),

  -- Economia
  ('b0000005-0000-0000-0000-000000000005', 'Inflação', 'inflacao',
    'Aumento de preços, políticas monetárias, juros',
    'a0000002-0000-0000-0000-000000000002', ARRAY['kitchin', 'juglar']),
  ('b0000006-0000-0000-0000-000000000006', 'Juros', 'juros',
    'Taxas Selic, Fed, BCE, política monetária',
    'a0000002-0000-0000-0000-000000000002', ARRAY['kitchin', 'juglar']),
  ('b0000007-0000-0000-0000-000000000007', 'Câmbio', 'cambio',
    'Dólar, real, moedas, taxas de câmbio',
    'a0000002-0000-0000-0000-000000000002', ARRAY['kitchin']),
  ('b0000008-0000-0000-0000-000000000008', 'Recessão', 'recessao',
    'Contração económica, PIB negativo, desemprego',
    'a0000002-0000-0000-0000-000000000002', ARRAY['juglar', 'kondratieff']),

  -- Tecnologia
  ('b0000009-0000-0000-0000-000000000009', 'Inteligência Artificial', 'ia',
    'ChatGPT, LLMs, automação, regulação de IA',
    'a0000003-0000-0000-0000-000000000003', ARRAY['kondratieff']),
  ('b0000010-0000-0000-0000-000000000010', 'Chips e Semicondutores', 'chips',
    'TSMC, sanções, cadeia de fornecimento, chips AI',
    'a0000003-0000-0000-0000-000000000003', ARRAY['kondratieff', 'ciclo-conflito']),
  ('b0000011-0000-0000-0000-000000000011', 'Big Tech', 'big-tech',
    'Google, Apple, Meta, Amazon, regulação antitruste',
    'a0000003-0000-0000-0000-000000000003', ARRAY['kondratieff']),

  -- Meio Ambiente
  ('b0000012-0000-0000-0000-000000000012', 'Crise Climática', 'crise-climatica',
    'Aquecimento global, metas, acordos, fenômenos extremos',
    'a0000004-0000-0000-0000-000000000004', ARRAY['kondratieff']),
  ('b0000013-0000-0000-0000-000000000013', 'Energia', 'energia',
    'Petróleo, gás, renováveis, transição energética, nuclear',
    'a0000004-0000-0000-0000-000000000004', ARRAY['kondratieff', 'ciclo-commodities']),
  ('b0000014-0000-0000-0000-000000000014', 'Desmatamento', 'desmatamento',
    'Amazônia, queimadas, política ambiental',
    'a0000004-0000-0000-0000-000000000004', ARRAY['el-nino']),

  -- Política Interna
  ('b0000015-0000-0000-0000-000000000015', 'Eleições 2026', 'eleicoes-2026',
    'Eleições presidenciais e legislativas no Brasil',
    'a0000005-0000-0000-0000-000000000005', ARRAY['ciclo-politico-br']),

  -- Conflitos
  ('b0000016-0000-0000-0000-000000000016', 'Gaza / Israel', 'gaza-israel',
    'Conflito Israel-Hamas, operação terrestre, reféns',
    'a0000007-0000-0000-0000-000000000007', ARRAY['ciclo-conflito']),

  -- Saúde
  ('b0000017-0000-0000-0000-000000000017', 'COVID-19', 'covid-19',
    'Pandemia de coronavirus, variantes, vacinas',
    'a0000006-0000-0000-0000-000000000006', ARRAY['ciclo-pandemias']),
  ('b0000018-0000-0000-0000-000000000018', 'Mpox', 'mpox',
    'Surto de mpox (varíola dos macacos)',
    'a0000006-0000-0000-0000-000000000006', ARRAY['ciclo-pandemias']);
