const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const HISTORICAL_PROMPT = `Voce eh um analist preditivo do sistema Prophet. Analise a noticia e, usando eventos historicos analogues, gere uma previsao.

Noticia: {story_title}
Resumo: {story_summary}
Categoria: {cycle}
Regiao: {region}

Eventos historicos semelhantes:
{historical_events}

Retorne APENAS JSON valido com:
- probability: float de 0.0 a 1.0 (chance do evento/resultado ocorrer nos proximos 30-90 dias)
- historical_analogue: nome do evento historico mais semelhante (string)
- reasoning: explicacao curta de why this event resembles the historical case (max 200 chars)
- confidence: "high", "medium" ou "low"
- horizon_days: numero de dias estimado para o evento ocorrer (30-90)

 Seja preciso. Baseie a probabilidade no que aconteceu em eventos semelhantes.`;

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

// Region keywords for detection
const REGION_KEYWORDS = {
  'BR': ['brasil', 'brazil', 'brasília', 'são paulo', 'rio de janeiro', 'sul', 'sudeste', 'nordeste', 'norte', 'centro-oeste', 'cascavel', 'curitiba', 'porto alegre', 'recife', 'salvador', 'fortaleza', 'goiânia', 'mato Grosso', 'paraná', 'santa catarina', 'paraná', 'rp0'],
  'SAM': ['américa latina', 'latin america', 'argentina', 'chile', 'colombia', 'colômbia', 'venezuela', 'peru', 'equador', 'bolivia', 'uruguai', 'paraguai', 'guiana', 'suriname', 'mercado comum do sul', 'mercosul'],
  'US': ['estados unidos', 'united states', 'washington', 'new york', 'trump', 'biden', 'america first', 'american'],
  'EU': ['europa', 'european union', 'euro zone', 'alemanha', 'frança', 'french', 'germany', 'italy', 'spain', 'españa', 'portugal', 'união europeia', 'brexit'],
  'CN': ['china', 'chinese', 'beijing', 'xi jinping', 'shanghai', 'made in china'],
  'RU': ['russia', 'rússia', 'moscow', 'moscou', 'putin', 'ucrânia', 'ucrania', 'kremlin'],
  'ME': ['oriente médio', 'middle east', 'israel', 'palestina', 'gaza', 'iran', 'iraque', 'arábia', 'saudita', 'hézbollah', 'hamas'],
  'AF': ['áfrica', 'africa', 'south africa', 'egito', 'egito', 'nigéria', 'quênia', 'marrocos', 'argélia'],
  'AS': ['ásia', 'asia', 'índia', 'india', 'japão', 'japan', 'coreia', 'korea', 'indonésia', 'indonesia', 'vietnã', 'thailand', 'malásia'],
  'GLOBAL': ['onu', 'united nations', 'oms', 'who', 'bank', 'federal reserve', 'bond', 'imf', 'world bank', 'global'],
};

// Cycle keywords for better detection
const CYCLE_KEYWORDS = {
  'conflito': ['guerra', 'war', 'conflict', 'military', 'military', 'exército', 'armas', 'weapons', 'ataque', 'attack', 'terrorismo', 'terrorism', 'bomb', 'invasion', 'invasão', 'combate', 'narcotráfico', 'tráfico', 'crime organizado', 'milícia', 'gang', 'shot', 'morte', 'death', 'killed', 'murder', 'assassination'],
  'economico': ['economia', 'economy', 'economic', 'inflação', 'inflation', 'juros', 'interest rate', 'banco central', 'central bank', 'bolsa', 'stock market', 'dólar', 'dollar', 'câmbio', 'exchange', 'gdp', 'pib', 'desemprego', 'unemployment', 'trabalho', 'jobs', 'balança comercial', 'trade', 'commodities', 'petróleo', 'oil', 'preço', 'price'],
  'politico': ['eleição', 'election', 'voting', 'congresso', 'congress', 'senado', 'senate', 'câmara', 'house', 'deputado', 'governor', 'prefeito', 'mayor', 'partido', 'party', 'coalition', 'oposição', 'opposition', 'governo', 'government', 'palácio', 'presidency', 'candidate', 'candidato', 'voto', 'vote', 'lula', 'bolsonaro', 'maduro', 'trump', 'biden'],
  'social': ['saúde', 'health', 'education', 'educação', 'housing', 'moradia', 'vacina', 'vaccine', 'covid', 'pandemia', 'hunger', 'fome', 'homeless', 'sem teto', 'pobreza', 'poverty', 'desigualdade', 'inequality', 'protesto', 'protest', 'manifestação', 'demonstração', 'greve', 'strike', 'salário', 'wage', 'minimum wage'],
  'tecnologico': ['tecnologia', 'technology', 'tech', 'ai', 'inteligência artificial', 'artificial intelligence', 'startup', 'innovation', 'inovação', 'software', 'apple', 'google', 'meta', 'amazon', 'microsoft', 'tesla', 'nvidia', 'chip', 'semiconductor', 'cybersecurity', 'cibersegurança', 'hacker', 'data', 'privacy', 'privacidade'],
  'ambiental': ['meio ambiente', 'environment', 'climate', 'clima', 'amazonia', 'amazônia', 'floresta', 'forest', 'desmatamento', 'deforestation', 'emissão', 'emission', 'carbono', 'carbon', 'energias renováveis', 'renewable energy', 'sustentabilidade', 'sustainability', 'poluição', 'pollution', 'aquecimento global', 'global warming'],
  'cultural': ['cultura', 'culture', 'arts', 'arte', 'music', 'música', 'movie', 'filme', 'cinema', 'netflix', 'hollywood', 'entretenimento', 'entertainment', 'esporte', 'sports', 'futebol', 'football', 'olimpíadas', 'olympics', 'copa', 'world cup', 'festival', 'carnaval', 'literatura', 'literature', 'book'],
};

const SYSTEM_PROMPT = `Você é um analisador de notícias brasileiro do sistema Prophet. Analise a notícia e retorne APENAS JSON válido com:
- summary: frase resumida do evento (max 150 chars)
- main_subject: tema central em 3-5 palavras
- cycle: CATEGORIA PRINCIPAL - escolha APENAS UMA:
  * conflito: guerras, violência, crimes, narcóticos, terrorismo, mortes
  * economico: inflação, juros, mercados, câmbio, commodities, empregos
  * politico: eleições, governo, congresso, partidos, políticas públicas
  * social: saúde, educação, moradia, protestos, desigualdade social
  * tecnologico: IA, startups, big tech, inovação digital, cibersegurança
  * ambiental: clima, desmatamento, energia renovável, sustentabilidade
  * cultural: arte, música, filmes, esportes, entretenimento, literatura
- region: código de região (BR=Brasil, SAM=América do Sul, US=Estados Unidos, EU=Europa, CN=China, RU=Rússia, ME=Oriente Médio, AF=África, AS=Ásia, GLOBAL=global)
- sentiment: positivo, neutro ou negativo
- confidence: sua confiança de 0.0 a 1.0

Importante: seja específico na categoria. Se for sobre Lula ou Bolsonaro → politico. Se for sobre economia → economico. Se for sobre Amazônia ou clima → ambiental.`;

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

function detectRegion(text) {
  const t = (text || '').toLowerCase();
  // Check each region
  for (const [code, keywords] of Object.entries(REGION_KEYWORDS)) {
    for (const kw of keywords) {
      if (t.includes(kw.toLowerCase())) return code;
    }
  }
  // Default based on source
  return 'BR';
}

function detectCycleFromText(text) {
  const t = (text || '').toLowerCase();
  const scores = {};
  for (const [cycle, keywords] of Object.entries(CYCLE_KEYWORDS)) {
    scores[cycle] = 0;
    for (const kw of keywords) {
      if (t.includes(kw.toLowerCase())) scores[cycle]++;
    }
  }
  const max = Math.max(...Object.values(scores));
  if (max > 0) {
    return Object.entries(scores).find(([, v]) => v === max)[0];
  }
  return 'politico'; // fallback
}

async function analyzeWithOllama(title, content, log) {
  if (!OLLAMA_API_KEY) { log.push('   ⚠️ Sem Ollama key'); return null; }

  const combinedText = `${title} ${(content || '').slice(0, 300)}`;
  const detectedCycle = detectCycleFromText(combinedText);
  const detectedRegion = detectRegion(combinedText);
  
  log.push(`   🔍 Ciclo detectado: ${detectedCycle} | Região: ${detectedRegion}`);

  try {
    log.push(`   🤖 Analisando: "${title.slice(0, 30)}..."`);
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 25000); // Increased to 25s

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
          { role: 'user', content: `Título: ${title}\nConteúdo: ${(content || '').slice(0, 300)}\n\nRetorne APENAS JSON válido.` }
        ],
        format: 'json',
        options: { temperature: 0.2, num_predict: 200 },
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    log.push(`   📡 Ollama status: ${response.status}`);
    if (!response.ok) {
      const err = await response.text();
      log.push(`   ❌ Ollama error: ${err.slice(0, 100)}`);
      return null;
    }
    const data = await response.json();
    const content_str = (data.message?.content || '{}').replace(/```json\n?|\n?```/g, '').trim();
    log.push(`   📝 Response: ${content_str.slice(0, 80)}`);
    
    let parsed;
    try {
      parsed = JSON.parse(content_str);
    } catch (e) {
      log.push(`   ❌ JSON parse error`);
      return null;
    }
    
    // Override with detected values if Ollama returned generic
    if (!parsed.region || parsed.region === 'BR' || parsed.region === 'SAM') {
      parsed.region = detectedRegion;
    }
    
    return parsed;
  } catch (e) {
    log.push(`   ❌ Erro: ${e.name}: ${e.message}`);
    
    // Fallback: return basic analysis based on text detection
    log.push(`   🔄 Fallback: usando detecção por palavras-chave`);
    return {
      summary: title.slice(0, 120),
      main_subject: title.split(' ').slice(0, 4).join(' '),
      cycle: detectedCycle,
      region: detectedRegion,
      sentiment: 'neutro',
      confidence: 0.4,
    };
  }
}

function normalizeCycle(cycle) {
  const map = {
    'conflito': 'conflito', 'conflitos': 'conflito',
    'economico': 'economico', 'econômico': 'economico', 'economia': 'economico',
    'politico': 'politico', 'político': 'politico', 'política': 'politico',
    'social': 'social',
    'tecnologico': 'tecnologico', 'tecnológico': 'tecnologico', 'tecnologia': 'tecnologico',
    'ambiental': 'ambiental', 'meio ambiente': 'ambiental',
    'cultural': 'cultural', 'cultura': 'cultural',
    'geopolítica': 'conflito', 'geopolitico': 'conflito',
  };
  const c = (cycle || '').toLowerCase();
  return map[c] || 'politico';
}

async function upsertStory(article, analysis, log) {
  const subject = analysis.main_subject || article.title.slice(0, 50);
  const cycle = normalizeCycle(analysis.cycle);
  const region = analysis.region || detectRegion(article.title + ' ' + (article.content || ''));
  
  const sentimentMap = { 'positivo': 'up', 'negativo': 'down', 'neutro': 'stable' };
  const sentiment_trend = sentimentMap[analysis.sentiment] || 'stable';
  
  // Find existing story by similar subject
  const searchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/stories?select=id,main_subject,article_count,cycle,region&order=updated_at.desc&limit=20`,
    { headers }
  );
  let existingStories = [];
  try { existingStories = await searchRes.json(); } catch { existingStories = []; }
  if (!Array.isArray(existingStories)) existingStories = [];
  
  // Find similar story (simple substring match)
  let existingStory = null;
  for (const s of existingStories) {
    const sSubject = (s.main_subject || '').toLowerCase();
    const aSubject = subject.toLowerCase();
    if (sSubject.includes(aSubject.slice(0, 20)) || aSubject.includes(sSubject.slice(0, 20))) {
      existingStory = s;
      break;
    }
    // Also match by cycle + region combination
    if (s.cycle === cycle && s.region === region) {
      // Check first 3 words of subject
      const sWords = sSubject.split(' ').slice(0, 3).join(' ');
      const aWords = aSubject.split(' ').slice(0, 3).join(' ');
      if (sWords.length > 5 && aWords.includes(sWords.slice(0, 10))) {
        existingStory = s;
        break;
      }
    }
  }
  
  const storyData = {
    title: article.title.slice(0, 500),
    main_subject: subject.slice(0, 100),
    cycle,
    region,
    summary: analysis.summary || null,
    sentiment_trend,
    updated_at: new Date().toISOString(),
  };
  
  let storyId = null;
  if (existingStory) {
    // Update existing story
    storyId = existingStory.id;
    await fetch(`${SUPABASE_URL}/rest/v1/stories?id=eq.${storyId}`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({
        ...storyData,
        article_count: (existingStory.article_count || 1) + 1,
      }),
    });
    log.push(`   📖 Story #${storyId} atualizada: "${subject.slice(0, 25)}" [${cycle}/${region}]`);
  } else {
    // Create new story
    const newStoryRes = await fetch(`${SUPABASE_URL}/rest/v1/stories`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({
        ...storyData,
        started_at: new Date().toISOString(),
      }),
    });
    let newStory = null;
    try { newStory = await newStoryRes.json(); } catch { newStory = null; }
    storyId = newStory?.[0]?.id || newStory?.id || null;
    log.push(`   🆕 Story criada: "${subject.slice(0, 25)}" [${cycle}/${region}]`);
  }

  // Insert into story_articles junction
  if (storyId && article.id) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/story_articles`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ story_id: storyId, article_id: article.id }),
      });
    } catch (_) {}
  }

  return storyId;
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

    // 5. Analyze with Ollama
    let storiesCreated = 0;
    let articlesAnalyzed = 0;
    if (OLLAMA_API_KEY) {
      log.push('🧠 Analisando com Ollama...');
      
      // Get pending articles with content, randomized order
      const pendingRes = await fetch(
        `${SUPABASE_URL}/rest/v1/raw_articles?status=eq.pending&content=not.is.null&content=neq.%22%22&select=id,title,content,url,source_id&limit=5`,
        { headers }
      );
      let pending = [];
      try { pending = await pendingRes.json(); } catch { pending = []; }
      if (!Array.isArray(pending)) pending = [];
      
      log.push(`   📊 Artigos pendentes com conteúdo: ${pending.length}`);

      for (const article of pending) {
        const elapsed = Date.now() - startTime;
        if (elapsed > 55000) { log.push('   ⏱️ Timeout de tempo total (55s), parando'); break; }

        const analysis = await analyzeWithOllama(article.title, article.content, log);
        
        if (analysis) {
          articlesAnalyzed++;
          
          // Update article
          await fetch(`${SUPABASE_URL}/rest/v1/raw_articles?id=eq.${article.id}`, {
            method: 'PATCH',
            headers: { ...headers, Prefer: 'return=representation' },
            body: JSON.stringify({
              status: 'analyzed',
              summary: analysis.summary,
            }),
          });
          
          // Create/update story
          const storyId = await upsertStory(article, analysis, log);
          if (storyId) {
            // Link article to story
            await fetch(`${SUPABASE_URL}/rest/v1/raw_articles?id=eq.${article.id}`, {
              method: 'PATCH',
              headers: { ...headers },
              body: JSON.stringify({ story_id: storyId }),
            });
            storiesCreated++;
          }
          
          log.push(`   ✅ [${analysis.cycle}/${analysis.region}] "${article.title.slice(0, 30)}..."`);
        }
        
        // Small delay between requests to avoid rate limit
        await new Promise(r => setTimeout(r, 1000));
      }
      log.push(`   📖 Stories criadas/atualizadas: ${storiesCreated}`);
      log.push(`   📝 Artigos analisados: ${articlesAnalyzed}`);
    }

    // 6. Stats
    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/raw_articles?select=id`, { headers }).then(r => r.json()).catch(() => []);
    const storiesRes = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=id,cycle,region,main_subject,summary`, { headers }).then(r => r.json()).catch(() => []);
    const analyzedRes = await fetch(`${SUPABASE_URL}/rest/v1/raw_articles?status=eq.analyzed&select=id`, { headers }).then(r => r.json()).catch(() => []);
    
    log.push(`📊 Artigos: ${Array.isArray(countRes) ? countRes.length : '?'} total | ${Array.isArray(analyzedRes) ? analyzedRes.length : '?'} analisados`);
    log.push(`📊 Stories: ${Array.isArray(storiesRes) ? storiesRes.length : '?'}`);
    
    if (Array.isArray(storiesRes) && storiesRes.length > 0) {
      const cycles = {};
      const regions = {};
      for (const s of storiesRes) {
        cycles[s.cycle] = (cycles[s.cycle] || 0) + 1;
        regions[s.region] = (regions[s.region] || 0) + 1;
      }
      log.push(`   Ciclos: ${JSON.stringify(cycles)}`);
      log.push(`   Regiões: ${JSON.stringify(regions)}`);
    }
    
    // 7. Generate historical predictions
    const storiesForPred = Array.isArray(storiesRes) ? storiesRes : [];
    if (OLLAMA_API_KEY && storiesForPred.length > 0) {
      const predCount = await generateHistoricalPredictions(storiesForPred.slice(0, 5), startTime, log);
      log.push(`🔮 Previsoes historicas geradas: ${predCount}`);
    }

    log.push(`⏱️ Tempo total: ${Date.now() - startTime}ms`);

    return res.status(200).json({ success: true, log, articlesCollected: allItems.length, storiesCreated, articlesAnalyzed });
  } catch (e) {
    log.push(`❌ Erro fatal: ${e.message}`);
    return res.status(500).json({ success: false, log, error: e.message });
  }

async function fetchHistoricalEvents(cycle, region, limit = 5) {
  const cycleParam = cycle ? `&cycle_type=eq.${cycle}` : '';
  const regionParam = region ? `&region=eq.${region}` : '';
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/historical_events?significance=gte.3${cycleParam}${regionParam}&select=*&order=significance.desc&limit=${limit}`,
    { headers }
  );
  const events = await r.json();
  return Array.isArray(events) ? events : [];
}

async function generateHistoricalPredictions(stories, startTime, log) {
  let count = 0;
  for (const story of stories) {
    const elapsed = Date.now() - startTime;
    if (elapsed > 55000) { log.push('   ⏱️ Timeout, parando previsoes'); break; }

    const existing = await fetch(
      `${SUPABASE_URL}/rest/v1/predictions?story_id=eq.${story.id}&select=id`,
      { headers }
    ).then(r => r.json()).catch(() => []);
    if (Array.isArray(existing) && existing.length > 0) {
      log.push(`   ⏭️ Story ja tem previsao: ${(story.main_subject || '').slice(0, 20)}`);
      continue;
    }

    const events = await fetchHistoricalEvents(story.cycle, story.region, 4);
    if (events.length === 0) { log.push(`   ⚠️ Sem eventos historicos para ${story.cycle}/${story.region}`); continue; }

    const eventsText = events.map(e =>
      `- ${e.name} (${e.event_date}): ${e.description || ''} Outcome: ${e.outcome || 'N/A'}`
    ).join('\n');

    const prompt = HISTORICAL_PROMPT
      .replace('{story_title}', story.main_subject || story.title || '')
      .replace('{story_summary}', story.summary || '')
      .replace('{cycle}', story.cycle || 'politico')
      .replace('{region}', story.region || 'BR')
      .replace('{historical_events}', eventsText);

    log.push(`   🔮 Gerando previsao historica para: "${(story.main_subject || '').slice(0, 25)}..."`);

    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 25000);
      const response = await fetch('https://ollama.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OLLAMA_API_KEY}`,
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [{ role: 'user', content: prompt }],
          format: 'json',
          options: { temperature: 0.3, num_predict: 150 },
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (!response.ok) { log.push(`   ❌ Ollama error: ${response.status}`); continue; }

      const data = await response.json();
      const raw = (data.message?.content || '{}').replace(/```json\n?|\n?```/g, '').trim();
      let pred;
      try { pred = JSON.parse(raw); } catch { log.push(`   ❌ JSON parse: ${raw.slice(0, 60)}`); continue; }

      const prob = typeof pred.probability === 'number' ? pred.probability : 0.5;
      const brier = Math.round((1 - prob) ** 2 * 100) / 100;

      await fetch(`${SUPABASE_URL}/rest/v1/predictions`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({
          story_id: story.id,
          title: `Historico: ${story.main_subject || story.title}`.slice(0, 300),
          description: pred.reasoning || null,
          cycle: story.cycle,
          probability: prob,
          historical_analogue: pred.historical_analogue || null,
          reasoning: pred.reasoning || null,
          confidence: pred.confidence || 'medium',
          horizon_days: pred.horizon_days || 60,
          source: 'prophet-historical',
          brier_score: brier,
        }),
      });
      count++;
      log.push(`   ✅ Previsao: ${pred.historical_analogue} (${(prob * 100).toInt()}%)`);
    } catch (e) {
      log.push(`   ❌ Erro: ${e.name}: ${e.message}`);
    }

    await new Promise(r => setTimeout(r, 1500));
  }
  return count;
}

}
