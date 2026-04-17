-- ============================================================
-- Migration 005: Seed Sources (veículos de notícias)
-- ============================================================

INSERT INTO sources (id, name, domain, bias_historic, reliability_score, flags) VALUES
  -- Brasileiro
  ('d0000001-0000-0000-0000-000000000001', 'Folha de S.Paulo', 'folha.uol.com.br',
    '{"ideologico": 0.32, "economico": 0.40, "geopolitico": 0.45, "social": 0.28,
      "framing": 0.55, "emocional": 0.62, "temporal": 0.58, "authority": 0.48}',
    0.78,
    '{"blacklist": false, "paywall": true, "satire": false, "political_affiliation": "center-left"}'),

  ('d0000002-0000-0000-0000-000000000002', 'O Estado de S.Paulo', 'estadao.com.br',
    '{"ideologico": 0.64, "economico": 0.58, "geopolitico": 0.55, "social": 0.62,
      "framing": 0.52, "emocional": 0.48, "temporal": 0.45, "authority": 0.55}',
    0.76,
    '{"blacklist": false, "paywall": true, "satire": false, "political_affiliation": "center-right"}'),

  ('d0000003-0000-0000-0000-000000000003', 'Valor Econômico', 'valor.globo.com',
    '{"ideologico": 0.52, "economico": 0.62, "geopolitico": 0.50, "social": 0.48,
      "framing": 0.42, "emocional": 0.38, "temporal": 0.40, "authority": 0.60}',
    0.82,
    '{"blacklist": false, "paywall": true, "satire": false, "political_affiliation": "center"}'),

  ('d0000004-0000-0000-0000-000000000004', 'BBC News Brasil', 'bbc.com/portuguese',
    '{"ideologico": 0.50, "economico": 0.48, "geopolitico": 0.52, "social": 0.50,
      "framing": 0.45, "emocional": 0.42, "temporal": 0.38, "authority": 0.65}',
    0.88,
    '{"blacklist": false, "paywall": false, "satire": false, "political_affiliation": "center"}'),

  ('d0000005-0000-0000-0000-000000000005', 'CNN Brasil', 'cnnbrasil.com.br',
    '{"ideologico": 0.52, "economico": 0.50, "geopolitico": 0.48, "social": 0.50,
      "framing": 0.55, "emocional": 0.58, "temporal": 0.60, "authority": 0.52}',
    0.72,
    '{"blacklist": false, "paywall": false, "satire": false, "political_affiliation": "center"}'),

  -- Internacional
  ('e0000001-0000-0000-0000-000000000001', 'Reuters', 'reuters.com',
    '{"ideologico": 0.50, "economico": 0.50, "geopolitico": 0.52, "social": 0.50,
      "framing": 0.40, "emocional": 0.35, "temporal": 0.38, "authority": 0.70}',
    0.92,
    '{"blacklist": false, "paywall": false, "satire": false, "political_affiliation": "center"}'),

  ('e0000002-0000-0000-0000-000000000002', 'Associated Press', 'apnews.com',
    '{"ideologico": 0.50, "economico": 0.50, "geopolitico": 0.50, "social": 0.50,
      "framing": 0.38, "emocional": 0.32, "temporal": 0.35, "authority": 0.72}',
    0.93,
    '{"blacklist": false, "paywall": false, "satire": false, "political_affiliation": "center"}'),

  ('e0000003-0000-0000-0000-000000000003', 'The New York Times', 'nytimes.com',
    '{"ideologico": 0.35, "economico": 0.42, "geopolitico": 0.40, "social": 0.30,
      "framing": 0.55, "emocional": 0.58, "temporal": 0.52, "authority": 0.68}',
    0.85,
    '{"blacklist": false, "paywall": true, "satire": false, "political_affiliation": "center-left"}'),

  ('e0000004-0000-0000-0000-000000000004', 'The Wall Street Journal', 'wsj.com',
    '{"ideologico": 0.62, "economico": 0.70, "geopolitico": 0.55, "social": 0.55,
      "framing": 0.45, "emocional": 0.40, "temporal": 0.42, "authority": 0.65}',
    0.86,
    '{"blacklist": false, "paywall": true, "satire": false, "political_affiliation": "center-right"}'),

  ('e0000005-0000-0000-0000-000000000005', 'The Guardian', 'theguardian.com',
    '{"ideologico": 0.28, "economico": 0.35, "geopolitico": 0.38, "social": 0.25,
      "framing": 0.52, "emocional": 0.55, "temporal": 0.48, "authority": 0.60}',
    0.82,
    '{"blacklist": false, "paywall": true, "satire": false, "political_affiliation": "left"}'),

  ('e0000006-0000-0000-0000-000000000006', 'Al Jazeera', 'aljazeera.com',
    '{"ideologico": 0.45, "economico": 0.48, "geopolitico": 0.35, "social": 0.45,
      "framing": 0.50, "emocional": 0.52, "temporal": 0.45, "authority": 0.58}',
    0.75,
    '{"blacklist": false, "paywall": false, "satire": false, "political_affiliation": "non-aligned"}'),

  ('e0000007-0000-0000-0000-000000000007', 'RT (Russia Today)', 'rt.com',
    '{"ideologico": 0.70, "economico": 0.60, "geopolitico": 0.25, "social": 0.55,
      "framing": 0.65, "emocional": 0.68, "temporal": 0.55, "authority": 0.35}',
    0.35,
    '{"blacklist": false, "paywall": false, "satire": false, "political_affiliation": "state-propaganda"}'),

  ('e0000008-0000-0000-0000-000000000008', 'Sputnik', 'sputniknews.com',
    '{"ideologico": 0.72, "economico": 0.58, "geopolitico": 0.22, "social": 0.58,
      "framing": 0.68, "emocional": 0.70, "temporal": 0.58, "authority": 0.30}',
    0.28,
    '{"blacklist": false, "paywall": false, "satire": false, "political_affiliation": "state-propaganda"}'),

  ('e0000009-0000-0000-0000-000000000009', 'Deutsche Welle', 'dw.com',
    '{"ideologico": 0.48, "economico": 0.50, "geopolitico": 0.52, "social": 0.48,
      "framing": 0.42, "emocional": 0.40, "temporal": 0.38, "authority": 0.62}',
    0.80,
    '{"blacklist": false, "paywall": false, "satire": false, "political_affiliation": "center"}'),

  ('e0000010-0000-0000-0000-000000000010', 'France 24', 'france24.com',
    '{"ideologico": 0.48, "economico": 0.48, "geopolitico": 0.50, "social": 0.48,
      "framing": 0.45, "emocional": 0.45, "temporal": 0.42, "authority": 0.60}',
    0.78,
    '{"blacklist": false, "paywall": false, "satire": false, "political_affiliation": "center"}');
