/**
 * Pipeline Worker — orquestra o fluxo completo de processamento
 *
 * Fluxo:
 * 1. Coleta notícias de todas as fontes
 * 2. Deduplica (URL + hash + similaridade)
 * 3. Insere no banco (status: pending)
 * 4. Analisa com LLM (status: analyzed)
 * 5. Agrupa em stories
 *
 * Executar via:
 * - API: POST /api/collect
 * - Cron: Vercel Cron (a cada 30 min)
 * - Manual: npx tsx src/pipeline/worker.ts
 */

import { createClient } from '@supabase/supabase-js';
import { fetchG1 } from '../collectors/g1.js';
import { fetchCNN } from '../collectors/cnn.js';
import { fetchBBC } from '../collectors/bbc.js';
import { fetchFolha } from '../collectors/folha.js';
import { fetchUOL } from '../collectors/uol.js';
import { fetchEstadao } from '../collectors/estadao.js';
import { parseMetropolesHomepage } from '../collectors/metropoles.js';
import { contentHash, checkDuplicate } from '../dedup/deduplicator.js';
import { mockAnalyze } from '../analyzer/mock-analyzer.js';
import { analyzeWithGroq } from '../analyzer/groq-analyzer.js';
import { analyzeWithOllamaCloud } from '../analyzer/ollama-cloud-analyzer.js';
import { filterByRelevance } from '../utils/content-filter.js';
import type { RawArticle } from '../collectors/rss.js';

const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface PipelineResult {
  runId: string;
  startedAt: string;
  finishedAt: string;
  summary: {
    totalCollected: number;
    totalInserted: number;
    totalAnalyzed: number;
    totalGrouped: number;
    errors: number;
  };
  details: {
    source: string;
    collected: number;
    inserted: number;
    errors: string[];
  }[];
}

/**
 * Executa o pipeline completo
 */
export async function runPipeline(): Promise<PipelineResult> {
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  
  console.log(`\n🚀 PIPELINE #${runId.substring(0, 8)} iniciado\n`);
  
  const result: PipelineResult = {
    runId,
    startedAt,
    finishedAt: '',
    summary: { totalCollected: 0, totalInserted: 0, totalAnalyzed: 0, totalGrouped: 0, errors: 0 },
    details: [],
  };
  
  // Buscar fontes ativas
  const { data: sources } = await supabase
    .from('sources')
    .select('id, slug, name, type')
    .eq('active', true);
  
  if (!sources || sources.length === 0) {
    throw new Error('Nenhuma fonte ativa encontrada');
  }
  
  // Mapear fetchers
  const fetchers: Record<string, () => Promise<RawArticle[]>> = {
    'g1': fetchG1,
    'cnn': fetchCNN,
    'bbc': fetchBBC,
    'folha': fetchFolha,
    'uol': fetchUOL,
    'estadao': fetchEstadao,
    'metropoles': async () => {
      try {
        const response = await fetch('https://www.metropoles.com', {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        const html = await response.text();
        return parseMetropolesHomepage(html);
      } catch (e: any) {
        console.log(`      ⚠️ Metrópoles: ${e.message}`);
        return [];
      }
    },
  };
  
  // Buscar artigos existentes para deduplicação
  const { data: existingArticles } = await supabase
    .from('raw_articles')
    .select('url, content_hash, title, id')
    .limit(1000);
  
  const existingMap = existingArticles?.map(a => ({
    url: a.url,
    content_hash: a.content_hash,
    title: a.title,
    id: a.id,
  })) || [];
  
  // ETAPA 1: Coleta
  console.log('📡 ETAPA 1: Coleta\n');
  
  for (const source of sources) {
    const detail = { source: source.name, collected: 0, inserted: 0, errors: [] as string[] };
    
    try {
      console.log(`   ${source.name}...`);
      const fetcher = fetchers[source.slug];
      
      if (!fetcher) {
        detail.errors.push(`Fetcher não implementado para ${source.slug}`);
        result.details.push(detail);
        continue;
      }
      
      const articles = await fetcher();
      
      // ETAPA 1.5: Filtrar por relevância histórica
      const relevantArticles = articles.filter(article => {
        const filterResult = filterByRelevance(article.title);
        if (!filterResult.isRelevant) {
          console.log(`      🗑️  Filtrada: ${article.title.substring(0, 50)}... (${filterResult.reason})`);
          return false;
        }
        return true;
      });
      
      detail.collected = relevantArticles.length;
      result.summary.totalCollected += relevantArticles.length;
      
      // ETAPA 2: Deduplicação e Inserção
      for (const article of relevantArticles) {
        const check = checkDuplicate(
          { title: article.title, url: article.url },
          existingMap
        );
        
        if (check.isDuplicate) {
          continue; // Pula duplicata
        }
        
        const hash = contentHash(article.title);
        const { data: inserted, error } = await supabase
          .from('raw_articles')
          .insert({
            source_id: source.id,
            title: article.title,
            url: article.url,
            content: article.content,
            published_at: article.published_at,
            content_hash: hash,
            status: 'pending',
          })
          .select('id')
          .single();
        
        if (error) {
          if (!error.message.includes('duplicate')) {
            detail.errors.push(error.message);
          }
        } else if (inserted) {
          detail.inserted++;
          result.summary.totalInserted++;
          
          // Adiciona ao mapa para evitar duplicatas na mesma rodada
          existingMap.push({
            url: article.url,
            content_hash: hash,
            title: article.title,
            id: inserted.id,
          });
        }
      }
      
      console.log(`      ✅ ${detail.collected} coletadas, ${detail.inserted} inseridas`);
      
    } catch (err: any) {
      detail.errors.push(err.message);
      console.log(`      ❌ ${err.message}`);
    }
    
    result.details.push(detail);
  }
  
  // ETAPA 3: Análise
  console.log('\n🧠 ETAPA 2: Análise\n');
  
  const { data: pendingArticles } = await supabase
    .from('raw_articles')
    .select('id, title, content, source_id')
    .eq('status', 'pending')
    .limit(20);
  
  if (pendingArticles && pendingArticles.length > 0) {
    console.log(`   Analisando ${pendingArticles.length} artigos...`);
    
    for (const article of pendingArticles) {
      try {
        // Prioridade: Ollama Cloud (kimi) → Groq → Mock
        let analysis: any;
        let modelUsed: string;

        if (process.env.OLLAMA_API_KEY) {
          console.log(`      🤖 Usando Ollama Cloud (kimi-k2.5)`);
          analysis = await analyzeWithOllamaCloud({
            id: article.id,
            title: article.title,
            content: article.content || undefined,
            source_id: article.source_id,
          });
          modelUsed = analysis.used_ollama_cloud
            ? 'ollama-cloud-kimi-k2.5'
            : 'mock-analyzer';
        } else if (process.env.GROQ_API_KEY) {
          console.log(`      ⚡ Usando Groq (llama-3.3-70b)`);
          analysis = await analyzeWithGroq({
            id: article.id,
            title: article.title,
            content: article.content || undefined,
            source_id: article.source_id,
          });
          modelUsed = analysis.used_groq ? 'groq-llama-3.3-70b' : 'mock-analyzer';
        } else {
          console.log(`      🎭 Usando mock analyzer (sem API key)`);
          analysis = await mockAnalyze({
            id: article.id,
            title: article.title,
            source_id: article.source_id,
          });
          modelUsed = 'mock-analyzer';
        }

        if (!analysis.used_ollama_cloud && !analysis.used_groq && analysis.error) {
          console.log(`      ⚠️  Analyzer indisponível: ${analysis.error}`);
        }
        
        // Salva análise
        const { error: analysisError } = await supabase
          .from('analysis')
          .insert({
            article_id: article.id,
            political_bias: analysis.political_bias,
            sentiment: analysis.sentiment,
            bias_score: analysis.bias_score,
            sentiment_score: analysis.sentiment_score,
            categories: analysis.categories,
            confidence: analysis.confidence,
            model_used: modelUsed,
          });
        
        if (analysisError) throw analysisError;
        
        // Atualiza status do artigo
        await supabase
          .from('raw_articles')
          .update({ status: 'analyzed', summary: analysis.summary })
          .eq('id', article.id);
        
        result.summary.totalAnalyzed++;
        
        // Pequeno delay para não sobrecarregar API
        if (analysis.used_ollama_cloud || analysis.used_groq) {
          await new Promise(r => setTimeout(r, 200));
        }
        
      } catch (err: any) {
        console.log(`      ❌ Erro ao analisar ${article.id}: ${err.message}`);
        result.summary.errors++;
      }
    }
    
    console.log(`   ✅ ${result.summary.totalAnalyzed} analisados`);
  } else {
    console.log('   Nenhum artigo pendente');
  }
  
  // ETAPA 4: Agrupamento em Stories
  console.log('\n📖 ETAPA 3: Agrupamento\n');
  
  const groupedCount = await groupArticlesIntoStories();
  result.summary.totalGrouped = groupedCount;
  console.log(`   ✅ ${groupedCount} artigos agrupados em stories`);
  
  // Finaliza
  result.finishedAt = new Date().toISOString();
  
  // Log
  await supabase.from('pipeline_log').insert({
    run_id: runId,
    step: 'pipeline',
    status: result.summary.errors > 0 ? 'warning' : 'success',
    count: result.summary.totalInserted,
    duration_ms: new Date(result.finishedAt).getTime() - new Date(startedAt).getTime(),
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DO PIPELINE');
  console.log('='.repeat(60));
  console.log(`Coletadas: ${result.summary.totalCollected}`);
  console.log(`Inseridas: ${result.summary.totalInserted}`);
  console.log(`Analisadas: ${result.summary.totalAnalyzed}`);
  console.log(`Agrupadas: ${result.summary.totalGrouped}`);
  console.log(`Erros: ${result.summary.errors}`);
  console.log(`Duração: ${new Date(result.finishedAt).getTime() - new Date(startedAt).getTime()}ms`);
  console.log('='.repeat(60) + '\n');
  
  return result;
}

/**
 * Agrupa artigos analisados em stories
 */
async function groupArticlesIntoStories(): Promise<number> {
  const { data: analyzedArticles } = await supabase
    .from('raw_articles')
    .select('id, title')
    .eq('status', 'analyzed');
  
  if (!analyzedArticles || analyzedArticles.length === 0) {
    return 0;
  }
  
  let grouped = 0;
  
  for (const article of analyzedArticles) {
    // Simplificação: extrai subject do título
    const subject = article.title.split(' ').slice(0, 3).join(' ');
    
    // Procura story existente
    const { data: existingStory } = await supabase
      .from('stories')
      .select('id')
      .ilike('main_subject', `%${subject}%`)
      .limit(1)
      .maybeSingle();
    
    if (existingStory) {
      // Vincula à story existente
      await supabase.from('story_articles').insert({
        story_id: existingStory.id,
        article_id: article.id,
      });
      
      // Incrementa contador
      await supabase.rpc('increment_story_article_count', { story_id: existingStory.id });
    } else {
      // Cria nova story
      const { data: newStory } = await supabase
        .from('stories')
        .insert({
          title: article.title,
          summary: article.summary,
          main_subject: subject,
        })
        .select('id')
        .single();
      
      if (newStory) {
        await supabase.from('story_articles').insert({
          story_id: newStory.id,
          article_id: article.id,
        });
      }
    }
    
    grouped++;
  }
  
  return grouped;
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runPipeline().catch(console.error);
}

export { groupArticlesIntoStories };
