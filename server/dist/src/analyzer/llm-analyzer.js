const DEFAULT_CONFIG = {
    apiKey: process.env.LLM_API_KEY || '',
    baseURL: process.env.LLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    model: process.env.LLM_MODEL || 'glm-4-flash',
    maxRetries: 3,
    timeoutMs: 30000,
};
/**
 * Prompt otimizado — extrai todas as informações em uma única chamada
 */
const SYSTEM_PROMPT = `Você é um analisador de notícias do Prophet. Analise o título e conteúdo fornecido e retorne APENAS um objeto JSON válido.

REGRAS:
1. Responda SEMPRE em português
2. Retorne APENAS o JSON, sem markdown, sem explicações
3. Os campos devem ser preenchidos com base no conteúdo da notícia

Campos obrigatórios:
- summary: resumo em 1-2 frases (máx 200 caracteres)
- main_subject: assunto principal em 3-5 palavras
- cycle: um de [conflito, pandemia, economico, politico, social, tecnologico, ambiental, cultural]
- political_bias: um de [esquerda, centro-esquerda, centro, centro-direita, direita, indefinido]
- bias_score: número entre -1.0 (esquerda) e +1.0 (direita)
- sentiment: um de [positivo, neutro, negativo]
- sentiment_score: número entre -1.0 (negativo) e +1.0 (positivo)
- categories: array de 1-3 strings (tags do assunto)
- entities: array de objetos {name, type: person/org/place, role: protagonista/citado/afetado/opositor}
- regions: array de strings com nomes de regiões
- confidence: número entre 0.0 e 1.0 indicando confiança da análise

Exemplo de resposta:
{
  "summary": "Dólar sobe acima de R$ 5,60 devido a tensões geopolíticas",
  "main_subject": "Alta do dólar",
  "cycle": "economico",
  "political_bias": "centro",
  "bias_score": 0.0,
  "sentiment": "negativo",
  "sentiment_score": -0.3,
  "categories": ["economia", "mercado financeiro", "câmbio"],
  "entities": [
    {"name": "Banco Central", "type": "org", "role": "citado"}
  ],
  "regions": ["Brasil", "América do Sul"],
  "confidence": 0.85
}`;
/**
 * Faz chamada à API do LLM com retry
 */
async function callLLM(prompt, config = DEFAULT_CONFIG) {
    const { apiKey, baseURL, model, maxRetries = 3, timeoutMs = 30000 } = config;
    if (!apiKey) {
        throw new Error('LLM_API_KEY não configurada');
    }
    let lastError = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const response = await fetch(`${baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.1, // Baixa = mais consistente
                    max_tokens: 1000,
                    response_format: { type: 'json_object' },
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('Resposta vazia do LLM');
            }
            return content;
        }
        catch (error) {
            lastError = error;
            // Se for erro de rate limit, espera mais
            const delay = error.message?.includes('429')
                ? 2000 * (attempt + 1)
                : 500 * (attempt + 1);
            console.warn(`Tentativa ${attempt + 1} falhou: ${error.message}. Retry em ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    throw lastError || new Error('Todas as tentativas falharam');
}
/**
 * Limpa e valida a resposta JSON do LLM
 */
function parseLLMResponse(raw) {
    try {
        // Remove possíveis markdown
        let cleaned = raw.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.slice(7, -3).trim();
        }
        else if (cleaned.startsWith('```')) {
            cleaned = cleaned.slice(3, -3).trim();
        }
        const parsed = JSON.parse(cleaned);
        // Validação básica
        return {
            summary: parsed.summary || '',
            main_subject: parsed.main_subject || 'Indefinido',
            cycle: validateCycle(parsed.cycle),
            political_bias: validateBias(parsed.political_bias),
            bias_score: clamp(parsed.bias_score, -1, 1) || 0,
            sentiment: validateSentiment(parsed.sentiment),
            sentiment_score: clamp(parsed.sentiment_score, -1, 1) || 0,
            categories: Array.isArray(parsed.categories) ? parsed.categories : [],
            entities: Array.isArray(parsed.entities) ? parsed.entities : [],
            regions: Array.isArray(parsed.regions) ? parsed.regions : [],
            confidence: clamp(parsed.confidence, 0, 1) || 0.5,
        };
    }
    catch (error) {
        throw new Error(`Falha ao parsear resposta do LLM: ${error.message}`);
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
 * Análise principal — com fallback para mock se LLM falhar
 */
export async function analyzeWithLLM(article, config) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    // Se não tem API key, usa mock
    if (!mergedConfig.apiKey) {
        const { mockAnalyze } = await import('./mock-analyzer.js');
        return { ...mockAnalyze(article), used_llm: false };
    }
    const prompt = `Título: ${article.title}\n\nConteúdo: ${article.content?.slice(0, 3000) || 'Não disponível'}\n\nFonte: ${article.source_id}`;
    try {
        const rawResponse = await callLLM(prompt, mergedConfig);
        const parsed = parseLLMResponse(rawResponse);
        return {
            summary: parsed.summary || '',
            main_subject: parsed.main_subject || 'Indefinido',
            cycle: parsed.cycle || 'politico',
            political_bias: parsed.political_bias || 'indefinido',
            bias_score: parsed.bias_score ?? 0,
            sentiment: parsed.sentiment || 'neutro',
            sentiment_score: parsed.sentiment_score ?? 0,
            categories: parsed.categories || [],
            entities: parsed.entities || [],
            regions: parsed.regions || [],
            confidence: parsed.confidence ?? 0.5,
            used_llm: true,
        };
    }
    catch (error) {
        // Fallback para mock em caso de erro
        console.warn(`LLM falhou, usando mock: ${error.message}`);
        const { mockAnalyze } = await import('./mock-analyzer.js');
        return { ...mockAnalyze(article), used_llm: false, error: error.message };
    }
}
/**
 * Análise em batch com controle de concorrência
 */
export async function analyzeBatchWithLLM(articles, config, concurrency = 3) {
    const results = [];
    const errors = [];
    // Processa em batches para não sobrecarregar a API
    for (let i = 0; i < articles.length; i += concurrency) {
        const batch = articles.slice(i, i + concurrency);
        const batchResults = await Promise.allSettled(batch.map(async (article) => {
            const result = await analyzeWithLLM(article, config);
            return { ...result, article_id: article.id };
        }));
        for (const result of batchResults) {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            }
            else {
                errors.push({ article_id: 'unknown', error: result.reason.message });
            }
        }
        // Pequeno delay entre batches
        if (i + concurrency < articles.length) {
            await new Promise(r => setTimeout(r, 500));
        }
    }
    return { results, errors };
}
