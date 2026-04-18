const MOCK_PREDICTIONS = [
  { id: '1', title: 'Conflito armado — Oriente Médio', cycle: 'conflito', probability: 78, confidence: 70, horizonDays: 90, delta: '+13%', positive: false, pattern: '"Escalada → Conflito" Etapa 3/4' },
  { id: '2', title: 'Crise econômica — Argentina', cycle: 'economico', probability: 62, confidence: 65, horizonDays: 180, delta: '+5%', positive: false, pattern: '"Resgate FMI → Estabilização parcial"' },
  { id: '3', title: 'Mudança de governo — Hungria', cycle: 'politico', probability: 85, confidence: 80, horizonDays: 365, delta: '-8%', positive: true, pattern: 'Resultado: ✅ CORRETO' },
  { id: '4', title: 'Avanço viral — IA generativa', cycle: 'tecnologico', probability: 91, confidence: 75, horizonDays: 30, delta: '+22%', positive: true, pattern: '"Adoção acelerada → Onda de conteúdo"' },
  { id: '5', title: 'Onda de calor — Europa', cycle: 'ambiental', probability: 73, confidence: 68, horizonDays: 60, delta: '+8%', positive: false, pattern: '"La Niña → Amplitude térmica"' },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { cycle } = req.query;
  let predictions = MOCK_PREDICTIONS;
  if (cycle) predictions = MOCK_PREDICTIONS.filter(p => p.cycle === cycle);

  return res.status(200).json({
    predictions,
    meta: { total: predictions.length, trackRecord: { total: 142, correct: 89, brier: 0.21 } },
  });
}