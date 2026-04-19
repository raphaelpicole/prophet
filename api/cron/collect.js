const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const OLLAMA_MODEL = process.env.OLLAMA_CLOUD_MODEL || 'gemma4:31b';

const RSS_SOURCES = [
  { slug: 'g1', name: 'G1', feed: 'https://g1.globo.com/rss/g1/brasil/' },
  { slug: 'folha', name: 'Folha', feed: 'https://feeds.folha.uol.com.br/emcimahmais/rss091.xml' },
  { slug: 'uol', name: 'UOL', feed: 'https://rss.uol.com.br/mostrecent/index.xml' },
  { slug: 'estadao', name: 'Estadão', feed: 'https://www.estadao.com.br/rss/' },
  { slug: 'cnn', name: 'CNN Brasil', feed: 'https://www.cnnbrasil.com.br/feed/' },
  { slug: 'bbc', name: 'BBC Brasil', feed: 'https://www.bbc.com/portuguese/feed/rss.xml' },
  { slug: 'metropoles', name: 'Metropoles', feed: 'https://www.metropoles.com/arqs/rss.xml' },
];

const SYSTEM_PROMPT = `Você é um analisador de notícias do sistema Prophet. Analise e retorne apenas JSON com: summary (max 200 chars), main_subject (3-5 palavras), cycle (um de: conflito, economico, politico, social, tecnologico, ambiental, cultural), political_bias (um de: esquerda, centro-esquerda, centro, centro-direita, direita, indefinido), sentiment (um de: positivo, neutro, negativo), confidence (0 a 1). Responda apenas com JSON válido.`;

// Simple hash for deduplication
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
  if (!OLLAMA_API_KEY) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

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
          { role: 'user', content: `Título: ${title}\nConteúdo: ${(content || '').slice(0, 300)}` }
        ],
        format: 'json',
        options: { temperature: 0.3, num_predict: 250 },
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = await response.json();
    const content_str = data.message?.content || '{}';
    return JSON.parse(content_str);
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const log = [];
  const startTime = Date.now();

  try {
    // 1. Get sources
    log.push('📥 Carregando fontes...');
    const sourcesRes = await fetch(`${SUPABASE_URL}/rest/v1/sources?select=id,slug&active=eq.true&limit=20`, { headers });
    let sources = [];
    try { sources = await sourcesRes.json(); } catch { sources = []; }
    if (!Array.isArray(sources)) sources = [];
    log.push(`   ✅ Fontes ativas: ${sources.length}`);

    // 2. Fetch RSS
    log.push('🔄 Coletando RSS...');
    const results = await Promise.allSettled(RSS_SOURCES.map(s => fetchFeed(s)));
    const allItems = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    log.push(`   📰 Artigos RSS: ${allItems.length}`);

    if (allItems.length === 0) {
      return res.status(200).json({ success: true, log, articles: 0 });
    }

    // 3. Build slug→id map
    const slugToId = {};
    for (const s of sources) { slugToId[s.slug] = s.id; }

    // 4. Insert articles
    log.push('🔍 Inserindo...');
    let insertedCount = 0;
    for (const item of allItems) {
      const h = hash(item.title + item.url);
      const r = await fetch(`${SUPABASE_URL}/rest/v1/raw_articles`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({
          source_id: slugToId[item.sourceSlug] || null,
          title: item.title.slice(0, 500),
          url: item.url,
          content: item.content?.slice(0, 2000) || '',
          published_at: item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
          content_hash: h,
          status: 'pending',
        }),
      });
      if (r.ok) insertedCount++;
    }
    log.push(`   ✅ Inseridos: ${insertedCount}`);

    // 5. Analyze with Ollama (max 3 articles to avoid timeout)
    if (OLLAMA_API_KEY) {
      log.push('🧠 Analisando com Ollama...');
      
      const pendingRes = await fetch(
        `${SUPABASE_URL}/rest/v1/raw_articles?status=eq.pending&select=id,title,content&limit=3&order=published_at.desc`,
        { headers }
      );
      let pending = [];
      try { pending = await pendingRes.json(); } catch { pending = []; }
      
      log.push(`   📊 Pendentes: ${pending.length}`);

      let analyzedCount = 0;
      for (const article of pending) {
        const elapsed = Date.now() - startTime;
        if (elapsed > 7000) { log.push('   ⏱️ Timeout approaching, stopping analysis'); break; }

        const analysis = await analyzeWithOllama(article.title, article.content);
        if (analysis) {
          await fetch(`${SUPABASE_URL}/rest/v1/raw_articles?id=eq.${article.id}`, {
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
          });
          analyzedCount++;
          log.push(`   ✅ "${article.title.slice(0, 40)}..." → cycle=${analysis.cycle}`);
          await new Promise(r => setTimeout(r, 500));
        }
      }
      log.push(`   ✅ Analisados: ${analyzedCount}`);
    }

    // 6. Stats
    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/raw_articles?select=id`, { headers }).then(r => r.json()).catch(() => []);
    const storiesRes = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=id`, { headers }).then(r => r.json()).catch(() => []);
    log.push(`📊 Artigos: ${Array.isArray(countRes) ? countRes.length : '?'} | Stories: ${Array.isArray(storiesRes) ? storiesRes.length : '?'}`);
    log.push(`⏱️ Tempo: ${Date.now() - startTime}ms`);

    return res.status(200).json({ success: true, log, articlesCollected: allItems.length });
  } catch (e) {
    log.push(`❌ Erro: ${e.message}`);
    return res.status(500).json({ success: false, log, error: e.message });
  }
}