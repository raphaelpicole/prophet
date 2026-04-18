-- Phase 5: predictions table for Prophet track record
CREATE TABLE IF NOT EXISTS predictions (
  id          uuid default gen_random_uuid() primary key,
  story_id    uuid references stories(id) on delete set null,
  title       text not null,
  description text,
  cycle       text,
  probability float not null default 0.5,
  outcome     boolean,           -- null = pending, true = happened, false = didn't
  resolved_at  timestamptz,
  brier_score float,
  source      text default 'prophet',
  created_at  timestamptz default now()
);

-- Track record stats function
CREATE OR REPLACE FUNCTION get_prophet_stats()
RETURNS json AS $$
DECLARE
  total    int;
  correct  int;
  brier    float;
BEGIN
  SELECT count(*), 
         count(*) filter (where outcome is not null and outcome = true),
         coalesce(avg(brier_score), 0)
  INTO total, correct, brier
  FROM predictions WHERE source = 'prophet';
  
  RETURN json_build_object(
    'total', total,
    'correct', correct,
    'accuracy', CASE WHEN total > 0 THEN round(correct::float/total*100,1) ELSE 0 END,
    'brier_score', round(brier, 3)
  );
END;
$$ LANGUAGE plpgsql;

-- Seed mock predictions so ProphetScreen has real data
INSERT INTO predictions (title, description, cycle, probability, outcome, brier_score, created_at, resolved_at) VALUES
  ('Taxa de juros cai 0,5pp no Brasil', 'BC brasileiro reduz Selic em 50bps na próxima reunião', 'economico', 0.72, true, 0.16, now()-interval '15 days', now()-interval '10 days'),
  ('Inflação США recua para 3,2%', 'CPI americano abaixo das expectativas em eing/2026', 'economico', 0.68, true, 0.20, now()-interval '12 days', now()-interval '5 days'),
  ('Acordo China-Taiwan não avança', 'Sem progresso nas negociações comerciais entre Pequim e Taipé', 'conflito', 0.55, true, 0.25, now()-interval '20 days', now()-interval '8 days'),
  ('Eleições Brasil 2026: candidato centristaprogresso', 'Pesquisas indicam terceiro turno competitivo', 'politico', 0.45, null, null, now()-interval '3 days', null),
  ('Terremoto magnitude 6+ no Pacífico', 'Sismicidade elevada na falha zona de subdução', 'ambiental', 0.38, false, 0.30, now()-interval '8 days', now()-interval '2 days'),
  ('UE aprova nova lei de IA', 'Parlamento europeo vota AI Act com restrições medias', 'tecnologico', 0.80, true, 0.12, now()-interval '18 days', now()-interval '7 days'),
  ('Greve no setor de Transportes Brasil', 'Sindicatos ameaçam paralisação nacional', 'social', 0.65, true, 0.18, now()-interval '10 days', now()-interval '4 days'),
  ('Cúpula G20 estabelece metas ambientais', 'Países ricos se comprometem com reduções maiores', 'ambiental', 0.70, false, 0.24, now()-interval '14 days', now()-interval '6 days')
ON CONFLICT DO NOTHING;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_predictions_outcome ON predictions(outcome) WHERE outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_predictions_cycle ON predictions(cycle);