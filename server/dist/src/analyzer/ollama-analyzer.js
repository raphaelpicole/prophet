const DEFAULT_CONFIG = {
    baseURL: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2',
    timeoutMs: 60000, // Modelos locais podem ser mais lentos
};
const SYSTEM_PROMPT = `Você é um analisador de notícias. Analise o título e retorne APENAS um JSON válido.

Retorne EXATAMENTE neste formato:
{
  "summary": "resumo curto",
  "main_subject": "assunto principal",
  "cycle": "um de: conflito, pandemia, economico, politico, social, tecnologico, ambiental, cultural",
  "political_bias": "um de: esquerda, centro-esquerda, centro, centro-direita, direita, indefinido",
  "bias_score": -0.5,
  "sentiment": "um de: positivo, neutro, negativo",
  "sentiment_score": 0.3,
  "categories": ["tag1", "tag2"],
  "entities": [{"name": "Nome", "type": "person", "role": "protagonista"}],
  "regions": ["Brasil"],
  "confidence": 0.8
}

Regras:
- cycle: conflito(guerras), pandemia(saude), economico(dinheiro), politico(governo), social(sociedade), tecnologico(tech), ambiental(natureza), cultural(arte)
- political_bias: analise o viés implícito (esquerda=progressista, direita=conservador)
- sentiment: positivo(boas notícias), negativo(mortes, crises), neutro(fatos)
- Responda SEMPRE em português`;
/**
 * Verifica se Ollama está disponível
 */
export async function isOllamaAvailable(config) {
    const merged = { ...DEFAULT_CONFIG, ...config };
    try {
        const response = await fetch(`${merged.baseURL}/api/tags`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    }
    catch {
        return false;
    }
}
/**
 * Lista modelos disponíveis
 */
export async function listOllamaModels(config) {
    const merged = { ...DEFAULT_CONFIG, ...config };
    try {
        const response = await fetch(`${merged.baseURL}/api/tags`);
        if (!response.ok)
            return [];
        const data = await response.json();
        return data.models?.map((m) => m.name) || [];
    }
    catch {
        return [];
    }
}
/**
 * Análise com Ollama
 */
export async function analyzeWithOllama(article, config) {
    const merged = { ...DEFAULT_CONFIG, ...config };
    // Verificar disponibilidade
    const available = await isOllamaAvailable(config);
    if (!available) {
        // Fallback para mock
        const { mockAnalyze } = await import('./mock-analyzer.js');
        return { ...mockAnalyze(article), used_ollama: false, error: 'Ollama não disponível' };
    }
    const prompt = `Título: ${article.title}\n\nFonte: ${article.source_id}\n\nAnalise esta notícia e retorne o JSON:`;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), merged.timeoutMs);
        const response = await fetch(`${merged.baseURL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: merged.model,
                system: SYSTEM_PROMPT,
                prompt: prompt,
                stream: false,
                format: 'json', // Ollama pode forçar formato JSON
                options: {
                    temperature: 0.1,
                    num_predict: 500,
                },
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        const content = data.response;
        if (!content) {
            throw new Error('Resposta vazia');
        }
        // Parse JSON da resposta
        const parsed = parseOllamaResponse(content);
        return {
            ...parsed,
            used_ollama: true,
        };
    }
    catch (error) {
        console.warn(`Ollama falhou: ${error.message}, usando mock`);
        const { mockAnalyze } = await import('./mock-analyzer.js');
        return { ...mockAnalyze(article), used_ollama: false, error: error.message };
    }
}
/**
 * Parse da resposta do Ollama
 */
function parseOllamaResponse(raw) {
    try {
        // Tenta extrair JSON se vier com texto extra
        let jsonStr = raw.trim();
        // Procura JSON entre code blocks
        const codeBlockMatch = raw.match(/```json\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
        }
        // Procura objeto JSON
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }
        const parsed = JSON.parse(jsonStr);
        return {
            summary: parsed.summary || 'Resumo não disponível',
            main_subject: parsed.main_subject || 'Indefinido',
            cycle: validateCycle(parsed.cycle),
            political_bias: validateBias(parsed.political_bias),
            bias_score: clamp(parsed.bias_score, -1, 1),
            sentiment: validateSentiment(parsed.sentiment),
            sentiment_score: clamp(parsed.sentiment_score, -1, 1),
            categories: Array.isArray(parsed.categories) ? parsed.categories : [],
            entities: Array.isArray(parsed.entities) ? parsed.entities : [],
            regions: Array.isArray(parsed.regions) ? parsed.regions : [],
            confidence: clamp(parsed.confidence, 0, 1),
        };
    }
    catch (error) {
        console.error('Falha ao parsear resposta Ollama:', raw);
        throw new Error(`Parse error: ${error.message}`);
    }
}
// Validadores
function validateCycle(cycle) {
    const valid = ['conflito', 'pandemia', 'economico', 'politico', 'social', 'tecnologico', 'ambiental', 'cultural'];
    return valid.includes(cycle) ? cycle : 'politico';
}
function validateBias(bias) {
    const valid = ['esquerda', 'centro-esquerda', 'centro', 'centro-direita', 'direita', 'indefinido'];
    return valid.includes(bias) ? bias : 'indefinido';
}
function validateSentiment(sent) {
    const valid = ['positivo', 'neutro', 'negativo'];
    return valid.includes(sent) ? sent : 'neutro';
}
function clamp(val, min, max) {
    if (typeof val !== 'number' || isNaN(val))
        return 0;
    return Math.max(min, Math.min(max, val));
}
/**
 * Análise em batch com Ollama
 */
export async function analyzeBatchWithOllama(articles, config, concurrency = 2 // Ollama local funciona melhor com menos concorrência
) {
    const results = [];
    const errors = [];
    // Ollama local funciona melhor sequencial ou com pouca concorrência
    for (const article of articles) {
        try {
            const result = await analyzeWithOllama(article, config);
            results.push({ ...result, article_id: article.id });
        }
        catch (error) {
            errors.push({ article_id: article.id, error: error.message });
        }
        // Pequeno delay para não sobrecarregar
        await new Promise(r => setTimeout(r, 100));
    }
    return { results, errors };
}
