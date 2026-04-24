/**
 * Qwen Cloud Analyzer
 *
 * Modelo: qwen3.5:397b-cloud
 * API Key: fornecida pelo usuário
 */
const DEFAULT_CONFIG = {
    apiKey: process.env.QWEN_API_KEY || '',
    model: 'qwen3.5:397b-cloud',
    baseURL: 'https://api.siliconflow.cn/v1',
};
const SYSTEM_PROMPT = `Você é um analisador de notícias do Prophet. Analise o título e retorne APENAS um objeto JSON válido.

REGRAS:
1. Responda SEMPRE em português do Brasil
2. Retorne APENAS o JSON, sem markdown, sem explicações extras
3. Analise o conteúdo de forma objetiva

Campos obrigatórios:
- summary: resumo em 1-2 frases (máximo 200 caracteres)
- main_subject: assunto principal em 3-5 palavras
- cycle: um de [conflito, pandemia, economico, politico, social, tecnologico, ambiental, cultural]
- political_bias: um de [esquerda, centro-esquerda, centro, centro-direita, direita, indefinido]
- bias_score: número entre -1.0 (esquerda) a +1.0 (direita)
- sentiment: um de [positivo, neutro, negativo]
- sentiment_score: número entre -1.0 (negativo) a +1.0 (positivo)
- categories: array de 1-3 tags relacionadas ao assunto
- entities: array de objetos {name, type: person/org/place, role: protagonista/citado/afetado/opositor}
- regions: array de nomes de regiões geográficas
- confidence: número entre 0.0 e 1.0 indicando confiança da análise

Exemplo de resposta válida:
{
  "summary": "Dólar sobe acima de R$ 5,60 devido a tensões geopolíticas",
  "main_subject": "Alta do dólar",
  "cycle": "economico",
  "political_bias": "centro",
  "bias_score": 0.0,
  "sentiment": "negativo",
  "sentiment_score": -0.3,
  "categories": ["economia", "câmbio", "mercado financeiro"],
  "entities": [{"name": "Banco Central", "type": "org", "role": "citado"}],
  "regions": ["Brasil", "América do Sul"],
  "confidence": 0.85
}`;
export async function analyzeWithQwen(article, config) {
    const merged = { ...DEFAULT_CONFIG, ...config };
    const prompt = `Analise esta notícia:

TÍTULO: ${article.title}

CONTEÚDO: ${article.content?.slice(0, 3000) || 'Não disponível'}

FONTE: ${article.source_id}

Retorne o JSON com a análise:`;
    try {
        const response = await fetch(`${merged.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${merged.apiKey}`,
            },
            body: JSON.stringify({
                model: merged.model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.1,
                max_tokens: 1000,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('Resposta vazia da API');
        }
        const parsed = parseQwenResponse(content);
        return {
            ...parsed,
            used_qwen: true,
        };
    }
    catch (error) {
        console.warn(`Qwen falhou: ${error.message}`);
        const { mockAnalyze } = await import('./mock-analyzer.js');
        return { ...mockAnalyze(article), used_qwen: false, error: error.message };
    }
}
function parseQwenResponse(raw) {
    try {
        // Remove possíveis code blocks
        let jsonStr = raw.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.slice(7, -3).trim();
        }
        else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.slice(3, -3).trim();
        }
        // Procura por objeto JSON
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
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
        console.error('Falha ao parsear resposta:', raw.substring(0, 200));
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
async function testQwen() {
    console.log('\n🧪 TESTE DO QWEN ANALYZER\n');
    const { fetchG1 } = await import('../collectors/g1.js');
    console.log('📡 Coletando notícias do G1...');
    const articles = await fetchG1();
    console.log(`   ✅ ${articles.length} notícias\n`);
    console.log('='.repeat(70));
    console.log('🧠 ANALISANDO COM QWEN');
    console.log('='.repeat(70) + '\n');
    for (const article of articles.slice(0, 3)) {
        console.log(`📰 ${article.title.substring(0, 60)}...`);
        const start = Date.now();
        const result = await analyzeWithQwen({
            id: 'test',
            title: article.title,
            source_id: 'g1',
        });
        const duration = Date.now() - start;
        console.log(`   ⏱️  ${duration}ms | ${result.used_qwen ? '🤖 QWEN' : '🎭 Mock'}`);
        console.log(`   📋 ${result.summary.substring(0, 70)}...`);
        console.log(`   🏷️  Ciclo: ${result.cycle}`);
        console.log(`   ⚖️  Viés: ${result.political_bias} (${result.bias_score})`);
        console.log(`   😊 Sentimento: ${result.sentiment} (${result.sentiment_score})`);
        console.log(`   📂 Categorias: ${result.categories.join(', ')}`);
        console.log(`   🌍 Regiões: ${result.regions.join(', ') || 'N/A'}`);
        console.log(`   ✅ Confiança: ${(result.confidence * 100).toFixed(0)}%`);
        if (result.error) {
            console.log(`   ⚠️  Erro: ${result.error}`);
        }
        console.log();
    }
    console.log('✅ Teste concluído!\n');
}
if (import.meta.url === `file://${process.argv[1]}`) {
    testQwen().catch(console.error);
}
export { testQwen };
