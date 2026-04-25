-- Criar tabela predictions se não existir
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id),
    prediction TEXT NOT NULL,
    confidence FLOAT,
    timeframe TEXT,
    status TEXT DEFAULT 'pending',
    accuracy FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_predictions_story_id ON predictions(story_id);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);

-- Inserir predições para stories existentes
INSERT INTO predictions (story_id, prediction, confidence, timeframe, status)
SELECT 
    s.id,
    CASE 
        WHEN s.cycle = 'economico' THEN 'Mercado deve reagir à notícia nas próximas 48h'
        WHEN s.cycle = 'politico' THEN 'Debate deve se intensificar nas próximas 72h'
        WHEN s.cycle = 'conflito' THEN 'Tensões devem continuar elevadas'
        WHEN s.cycle = 'ambiental' THEN 'Impacto ambiental deve ser monitorado'
        ELSE 'Monitorar desenvolvimentos'
    END,
    0.7,
    '48h',
    'pending'
FROM stories s
LEFT JOIN predictions p ON s.id = p.story_id
WHERE p.id IS NULL AND s.archived = false;

-- Retornar contagem
SELECT COUNT(*) as total_predictions FROM predictions;
