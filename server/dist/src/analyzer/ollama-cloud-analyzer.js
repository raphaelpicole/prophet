/**
 * Ollama Cloud Analyzer — kimi-k2.5 via API
 *
 * Integra com Ollama Cloud (https://ollama.com) usando API key.
 * Não requer Ollama instalado localmente.
 *
 * Modelos cloud: https://ollama.com/search?c=cloud
 * API docs: https://docs.ollama.com/cloud
 *
 * Para usar:
 * 1. Crie conta em https://ollama.com
 * 2. Gere API key em https://ollama.com/settings/keys
 * 3. Configure OLLAMA_API_KEY no .env
 * 4. Use o modelo kimi-k2.5:cloud (ou outro cloud model)
 */
/**
 * Semaphore simples para controlar concorrência.
 * Apenas 1 request por vez + delay de 2s entre cada um.
 * Isso evita estourar o limite da sessão do Ollama Cloud.
 */
class SimpleSemaphore {
    queue = [];
    running = 0;
    async acquire() {
        if (this.running < 1) {
            this.running++;
            return;
        }
        return new Promise(resolve => {
            this.queue.push(resolve);
        });
    }
    release() {
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next)
                next();
        }
        else {
            this.running--;
        }
    }
}
const ollamaSemaphore = new SimpleSemaphore();
const DEFAULT_CONFIG = {
    apiKey: process.env.OLLAMA_API_KEY || '',
    model: process.env.OLLAMA_CLOUD_MODEL || 'gemma4:31b',
    baseURL: 'https://ollama.com',
    maxConcurrent: 1,
    delayBetweenMs: 1500, // 1.5s entre requests
    maxTokens: 350, // respostas curtas
    timeoutMs: 60000, // 60s timeout (mais generoso)
};
const SYSTEM_PROMPT = `Você é um analisador de notícias do sistema Prophet. Analise o título e conteúdo e retorne APENAS um objeto JSON válido.

REGRAS:
1. Responda SEMPRE em português do Brasil
2. Retorne APENAS o JSON, sem markdown, sem explicações extras
3. Seja objetivo e imparcial na análise

Campos obrigatórios:
- summary: resumo em 1-2 frases (máximo 200 caracteres)
- main_subject: assunto principal em 3-5 palavras
- cycle: um de [conflito, pandemia, economico, politico, social, tecnologico, ambiental, cultural]
- political_bias: um de [esquerda, centro-esquerda, centro, centro-direita, direita, indefinido]
- bias_score: número entre -1.0 (esquerda) a +1.0 (direita), 0 = neutro
- sentiment: um de [positivo, neutro, negativo]
- sentiment_score: número entre -1.0 (negativo) a +1.0 (positivo)
- categories: array de 1-3 strings (tags do assunto)
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
  "categories": ["economia", "câmbio"],
  "entities": [{"name": "Banco Central", "type": "org", "role": "citado"}],
  "regions": ["Brasil", "América do Sul"],
  "confidence": 0.85
}`;
/**
 * Analisa uma notícia com Ollama Cloud (kimi-k2.5)
 */
export async function analyzeWithOllamaCloud(article, config) {
    const merged = { ...DEFAULT_CONFIG, ...config };
    // Verifica API key
    if (!merged.apiKey) {
        const { mockAnalyze } = await import('./mock-analyzer.js');
        return {
            ...mockAnalyze(article),
            used_ollama_cloud: false,
            error: 'OLLAMA_API_KEY não configurada',
        };
    }
    const prompt = `Analise esta notícia:

TÍTULO: ${article.title}
FONTE: ${article.source_id}
CONTEÚDO: ${article.content?.slice(0, 3000) || 'Não disponível'}

Retorne o JSON com a análise:`;
    // Semaphore simples para controlar concorrência
    await ollamaSemaphore.acquire();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), merged.timeoutMs);
        const response = await fetch(`${merged.baseURL}/api/chat`, {
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
                stream: false,
                options: {
                    temperature: 0.1,
                    num_predict: merged.maxTokens,
                },
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData?.error?.message || response.statusText;
            throw new Error(`HTTP ${response.status}: ${errorMsg}`);
        }
        const data = await response.json();
        const content = data.message?.content;
        if (!content) {
            throw new Error('Resposta vazia da API Ollama Cloud');
        }
        const parsed = parseOllamaCloudResponse(content);
        return {
            ...parsed,
            used_ollama_cloud: true,
            model_used: merged.model,
        };
    }
    catch (error) {
        console.warn(`Ollama Cloud falhou: ${error.message}`);
        const { mockAnalyze } = await import('./mock-analyzer.js');
        return {
            ...mockAnalyze(article),
            used_ollama_cloud: false,
            error: error.message,
        };
    }
    finally {
        // Libera semaphore após delay configurado (controla uso da sessão)
        setTimeout(() => ollamaSemaphore.release(), merged.delayBetweenMs);
    }
}
/**
 * Versão async com retry automático
 */
export async function analyzeWithOllamaCloudWithRetry(article, config, maxRetries = 2) {
    let lastError = '';
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const result = await analyzeWithOllamaCloud(article, config);
        if (result.used_ollama_cloud) {
            return result;
        }
        // Se falhou por erro temporário, retry
        if (result.error && !result.error.includes('não configurada')) {
            lastError = result.error;
            console.log(`   🔄 Retry ${attempt + 1}/${maxRetries}...`);
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
        }
        return result;
    }
    // Todos os retries falharam
    const { mockAnalyze } = await import('./mock-analyzer.js');
    return {
        ...mockAnalyze(article),
        used_ollama_cloud: false,
        error: `Max retries exceeded. Last error: ${lastError}`,
    };
}
function parseOllamaCloudResponse(raw) {
    try {
        let jsonStr = raw.trim();
        // Remove code blocks
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.slice(7, -3).trim();
        }
        else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.slice(3, -3).trim();
        }
        // Extrai objeto JSON
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
        console.error('Falha ao parsear resposta Ollama Cloud:', raw.substring(0, 200));
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
 * Testa Ollama Cloud
 */
export async function testOllamaCloud() {
    console.log('\n🧪 TESTE DO OLLAMA CLOUD ANALYZER (kimi-k2.5)\n');
    if (!process.env.OLLAMA_API_KEY) {
        console.log('❌ OLLAMA_API_KEY não configurada');
        console.log('1. Crie conta em https://ollama.com');
        console.log('2. Gere API key em https://ollama.com/settings/keys');
        console.log('3. Execute: OLLAMA_API_KEY=sua-key npx tsx src/analyzer/ollama-cloud-analyzer.ts\n');
        return;
    }
    console.log(`✅ API Key configurada`);
    console.log(`📡 Model: ${process.env.OLLAMA_CLOUD_MODEL || 'kimi-k2.5:cloud'}\n`);
    const testArticles = [
        {
            id: 'test-1',
            title: 'Banco Central eleva taxa de juros para 14,25% ao ano amid alta do dólar',
            source_id: 'g1',
            content: 'O Banco Central elevou a taxa Selic em 0,5 ponto percentual, reaching 14,25% ao año. A decisão ocorreu em meio a pressão inflacionária e alta do dólar, que atingiu R$ 5,60. Analistas apontam que o aumento pode desacelerar a economia.',
        },
        {
            id: 'test-2',
            title: 'Governo federal announce pacote de medidas para atrair investimentos estrangeiros',
            source_id: 'uol',
            content: 'O Ministério da Fazenda anunciou um conjunto de medidas para facilitar a entrada de capital externo no país, incluindo redução de burocracia e incentivos fiscais para setores estratégicos.',
        },
        {
            id: 'test-3',
            title: 'Tempestade causa destruição em cidades do litoral brasileiro; 5 mortos',
            source_id: 'cnn',
            content: 'Uma forte tempestade atingiu o litoral sul do país causando enchentes, deslizamentos e deixando pelo menos 5 mortos e dezenas de desalojados. Equipes de emergência seguem nas buscas.',
        },
    ];
    for (const article of testArticles) {
        console.log('─'.repeat(70));
        console.log(`📰 ${article.title.substring(0, 65)}...`);
        console.log();
        const start = Date.now();
        const result = await analyzeWithOllamaCloud(article);
        const duration = Date.now() - start;
        console.log(`   ⏱️  ${duration}ms | ${result.used_ollama_cloud ? '⚡ Ollama Cloud (kimi-k2.5)' : '🎭 Mock fallback'}`);
        console.log(`   📋 ${result.summary}`);
        console.log(`   🏷️  Ciclo: ${result.cycle} | Viés: ${result.political_bias} (${result.bias_score})`);
        console.log(`   😊 Sentimento: ${result.sentiment} (${result.sentiment_score}) | Confiança: ${(result.confidence * 100).toFixed(0)}%`);
        console.log(`   🏷️  Categorias: ${result.categories.join(', ')}`);
        console.log(`   🌍 Regiões: ${result.regions.join(', ')}`);
        if (result.error) {
            console.log(`   ⚠️  Erro: ${result.error}`);
        }
        console.log();
        await new Promise(r => setTimeout(r, 500));
    }
    console.log('✅ Teste concluído!\n');
}
// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    testOllamaCloud().catch(console.error);
}
