const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeXllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const OLLAMA_MODEL = process.env.OLLAMA_CLOUD_MODEL || 'gemma4:31b';

const RSS_SOURCES = [
  { slug: 'g1', name: 'G1', feed: 'https://g1.globo.com/rss/g1/brasil/', sourceId: null },
  { slug: 'folha', name: 'Folha', feed: 'https://feeds.folha.uol.com.br/emcimahmais/rss091.xml', sourceId: null },
  { slug: 'uol', name: 'UOL', feed: 'https://rss.uol.com.br/mostrecent/index.xml', sourceId: null },
  { slug: 'estadao', name: 'Estadão', feed: 'https://www.estadao.com.br/rss/', sourceId: null },
  { slug: 'cnn', name: 'CNN Brasil', feed: 'https://www.cnnbrasil.com.br/feed/', sourceId: null },
  { slug: 'bbc', name: 'BBC Brasil', feed: 'https://www.bbc.com/portuguese/feed/rss.xml', sourceId: null },
  { slug: 'metropoles', name: 'Metropoles', feed: 'https://www.metropoles.com/arqs/rss.xml', sourceId: null },
];

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
- sentiment: um de [positivo, neutro, negativo]
- confidence: número entre 0 e 1

Responda apenas com JSON válido.`;

function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

async function parseRSS(xml, sourceSlug) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/gi;
  const linkRegex = /<link>([\s\S]*?)<\/link>/gi;
  const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/gi;
  const descRegex = /<description[^>]*>([\s\S]*?)<\/description>/gi;

  let match;
  let idx = 0;
  while ((match = itemRegex.exec(xml)) !== null && idx < 20) {
    const block = match[1];
    const get = (re) => { const m = re.exec(block); re.lastIndex = 0; return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''; };
    const title = get(titleRegex);
    const link = get(linkRegex);
    const pubDate = get(pubDateRegex);
    const description = get(descRegex);
    if (title && link) {
      items.push({ title, url: link, content: description, publishedAt: pubDate, sourceSlug });
    }
    idx++;
  }
  return items;
}

async function fetchFeed(source) {
  try {
    const res = await fetch(source.feed, { timeout: 8000 });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, source.slug);
  } catch (e) {
    return [];
  }
}

async function analyzeWithOllama(title, content) {
  if (!OLLAMA_API_KEY) {
    return null;
  }

  try {
    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Título: ${title}\nConteúdo: ${(content || '').slice(0, 500)}` }
        ],
        format: 'json',
        options: {
          temperature: 0.3,
          num_predict: 350,
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error('Ollama API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content_str = data.message?.content || '{}';
    
    try {
      return JSON.parse(content_str);
    } catch {
      console.error('Failed to parse Ollama response:', content_str);
      return null;
    }
  } catch (e) {
    console.error('Ollama request failed:', e.message);
    return null;
  }
}

async function logError(level, source, message, context) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ level, source, message, context, resolved: false }),
    });
  } catch (_) {}
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const log = [];

  try {
    // 1. Busca sources do banco
    log.push('📥 Carregando fontes...');
    const sourcesRes = await fetch(`${SUPABASE_URL}/rest/v1/sources?select=id,slug,name,active&active=eq.true`, { headers });
    const sources = await sourcesRes.json();
    if (!Array.isArray(sources)) {
      log.push('   ⚠️ raw_articles não existe ainda — inserção de teste');
    } else {
      log.push(`   Fontes ativas: ${sources.length}`);
    }

    // 2. Coleta RSS em paralelo
    log.push('🔄 Coletando RSS de todas as fontes...');
    const results = await Promise.allSettled(RSS_SOURCES.map(s => fetchFeed(s)));
    const allItems = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

    log.push(`   Artigos RSS coletados: ${allItems.length}`);

    if (allItems.length === 0) {
      log.push('⚠️ Nenhum artigo coletado (verifique feeds RSS)');
      return res.status(200).json({ success: true, log, articles: 0 });
    }

    // 3. Dedup + insert em lote
    log.push('🔍 Deduplicando...');

    const slugToId = {};
    if (Array.isArray(sources)) {
      for (const s of sources) {
        slugToId[s.slug] = s.id;
      }
    }

    const toInsert = [];
    for (const item of allItems) {
      const h = hash(item.title + item.url);
      const sourceId = slugToId[item.sourceSlug] || null;
      toInsert.push({
        source_id: sourceId,
        title: item.title.slice(0, 500),
        url: item.url,
        content: item.content?.slice(0, 2000) || '',
        published_at: item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
        content_hash: h,
        status: 'pending',
      });
    }

    let insertedCount = 0;
    for (const article of toInsert) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/raw_articles`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify(article),
      });
      if (r.ok) insertedCount++;
    }
    log.push(`   ✅ Inseridos: ${insertedCount} artigos`);

    // 4. Análise LLM com Ollama Cloud
    if (OLLAMA_API_KEY) {
      log.push('🧠 Analisando artigos pendentes com Ollama Cloud...');
      
      // Busca artigos pendentes (máx 20 por execução)
      const pendingRes = await fetch(
        `${SUPABASE_URL}/rest/v1/raw_articles?status=eq.pending&analysis=is.null&select=id,title,content,url&limit=20&order=published_at.desc`,
        { headers }
      );
      const pending = await pendingRes.json();
      
      if (Array.isArray(pending) && pending.length > 0) {
        log.push(`   Artigos para analisar: ${pending.length}`);
        
        let analyzedCount = 0;
        for (const article of pending) {
          const analysis = await analyzeWithOllama(article.title, article.content);
          
          if (analysis) {
            // Atualiza artigo com análise
            const updateRes = await fetch(
              `${SUPABASE_URL}/rest/v1/raw_articles?id=eq.${article.id}`,
              {
                method: 'PATCH',
                headers: { ...headers, Prefer: 'return=representation' },
                body: JSON.stringify({
                  status: 'analyzed',
                  analysis: analysis,
                  main_subject: analysis.main_subject || null,
                  cycle: analysis.cycle || null,
                  summary: analysis.summary || null,
                  political_bias: analysis.political_bias || null,
                  sentiment: analysis.sentiment || null,
                  confidence: analysis.confidence || null,
                }),
              }
            );
            
            if (updateRes.ok) analyzedCount++;
            
            // Delay entre requests (1.5s)
            await new Promise(r => setTimeout(r, 1500));
          } else {
            log.push(`   ⚠️ Falha na análise: ${article.title.slice(0, 50)}...`);
          }
        }
        
        log.push(`   ✅ Analisados: ${analyzedCount} artigos`);
      } else {
        log.push('   Nenhum artigo pendente para analisar');
      }
    } else {
      log.push('🧠 Ollama API key não configurada — análise desabilitada');
    }

    // 5. Count final
    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/raw_articles?select=id`, { headers }).then(r => r.json()).catch(() => []);
    log.push(`📊 Total artigos no banco: ${Array.isArray(countRes) ? countRes.length : '?'}`);

    const storiesRes = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=id`, { headers }).then(r => r.json()).catch(() => []);
    log.push(`📖 Total stories: ${Array.isArray(storiesRes) ? storiesRes.length : '?'}`);

    log.push('✅ Pipeline completa!');
    return res.status(200).json({
      success: true, log,
      articlesCollected: allItems.length,
      timestamp: new Date().toISOString(),
    });

  } catch (e) {
    log.push(`❌ Erro: ${e.message}`);
    await logError('error', 'cron-collect', e.message, { stack: e.stack });
    return res.status(500).json({ success: false, log, error: e.message });
  }
}
