import OpenAI from 'openai';
import { supabase } from '../db/supabase.js';
/**
 * Analyzer — usa LLM para extrair insights de cada notícia.
 *
 * Ponto forte: UM prompt bem estruturado extrai TUDO de uma vez
 * (personagens, viés, sentimento, categorias, ciclo, região).
 * Isso evita múltiplas chamadas de API = custo menor e velocidade maior.
 */
const client = new OpenAI({
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
});
const SYSTEM_PROMPT = `Você é um analista de notícias do Prophet. Dado o título e resumo de uma notícia, extraia:

Responda em JSON válido (sem markdown):
{
  "summary": "resumo em 1-2 frases",
  "main_subject": "assunto principal (ex: Guerra na Ucrânia, Eleições 2026, COVID-19)",
  "cycle": "ciclo da humanidade (Conflito | Pandemia | Econômico | Político | Social | Tecnológico | Ambiental)",
  "political_bias": "esquerda | centro-esquerda | centro | centro-direita | direita | indefinido",
  "bias_score": -1.0 a 1.0 (negativo=esquerda, 0=centro, positivo=direita),
  "sentiment": "positivo | neutro | negativo",
  "sentiment_score": -1.0 a 1.0,
  "categories": ["economia", "política", "guerra", "saúde", "tecnologia", ...],
  "entities": [{"name": "Lula", "type": "person", "role": "protagonista"}],
  "regions": ["América do Sul", "Global"],
  "confidence": 0.0 a 1.0
}`;
export async function analyzeArticle(articleId, title, content) {
    const userPrompt = `Título: ${title}\n\nConteúdo: ${(content ?? '').slice(0, 3000)}`;
    const response = await client.chat.completions.create({
        model: process.env.LLM_MODEL || 'glm-4-flash',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0.1, // baixa = mais consistente na categorização
        response_format: { type: 'json_object' },
    });
    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    // Salva análise no Supabase
    const analysis = {
        article_id: articleId,
        political_bias: parsed.political_bias ?? 'indefinido',
        sentiment: parsed.sentiment ?? 'neutro',
        bias_score: parsed.bias_score ?? 0,
        sentiment_score: parsed.sentiment_score ?? 0,
        categories: parsed.categories ?? [],
        confidence: parsed.confidence ?? 0.5,
        model_used: process.env.LLM_MODEL || 'glm-4-flash',
    };
    const { error } = await supabase.from('analysis').insert(analysis);
    if (error)
        console.error('Erro salvando análise:', error);
    // Upsert entidades
    if (parsed.entities?.length) {
        await upsertEntities(articleId, parsed.entities);
    }
    // Upsert regiões
    if (parsed.regions?.length) {
        await linkRegions(articleId, parsed.regions);
    }
    // Marca artigo como analisado
    await supabase
        .from('raw_articles')
        .update({
        status: 'analyzed',
        content: parsed.summary ?? content,
    })
        .eq('id', articleId);
    return analysis;
}
async function upsertEntities(articleId, entities) {
    for (const entity of entities) {
        // Upsert na tabela entities
        const { data, error } = await supabase
            .from('entities')
            .upsert({ name: entity.name, type: entity.type }, { onConflict: 'name,type' })
            .select('id')
            .single();
        if (data) {
            await supabase.from('article_entities').insert({
                article_id: articleId,
                entity_id: data.id,
                role: entity.role,
            });
        }
    }
}
async function linkRegions(articleId, regionNames) {
    const { data: regions } = await supabase
        .from('regions')
        .select('id, name')
        .in('name', regionNames);
    if (regions) {
        for (const region of regions) {
            await supabase.from('article_regions').insert({
                article_id: articleId,
                region_id: region.id,
            });
        }
    }
}
/**
 * Batch analysis — processa múltiplas notícias pendentes.
 * Ponto forte: processa em paralelo com limite de concorrência para não estourar API rate limit.
 */
export async function analyzePending(limit = 20) {
    const { data: pending } = await supabase
        .from('raw_articles')
        .select('id, title, content')
        .eq('status', 'pending')
        .order('collected_at', { ascending: true })
        .limit(limit);
    if (!pending?.length)
        return 0;
    let analyzed = 0;
    // Processa em batches de 5 para respeitar rate limits
    for (let i = 0; i < pending.length; i += 5) {
        const batch = pending.slice(i, i + 5);
        await Promise.allSettled(batch.map(async (article) => {
            try {
                await analyzeArticle(article.id, article.title, article.content ?? undefined);
                analyzed++;
            }
            catch (err) {
                console.error(`Falha ao analisar ${article.id}:`, err);
                await supabase.from('raw_articles').update({ status: 'failed' }).eq('id', article.id);
            }
        }));
    }
    return analyzed;
}
