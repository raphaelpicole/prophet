const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const HISTORICAL_PROMPT = `Voce eh um analist preditivo do sistema Prophet. Analise a noticia e, usando eventos historicos analogues, gere uma previsao racional.

Noticia: {story_title}
Resumo: {story_summary}
Categoria: {cycle}
Regiao: {region}

Eventos historicos semelhantes:
{historical_events}

Retorne APENAS JSON valido com esta estrutura EXATA:
{
  "probability": 0.0 a 1.0 (chance do evento/resultado ocorrer nos proximos 30-90 dias),
  "historical_analogue": "nome curto do evento historico mais semelhante (ex: Anexacao da Crimeia 2014)",
  "reasoning": "EXPLICACAO DETALHADA de como voce conectou a noticia atual ao evento historico. Explique QUAIS PADROES sao semelhantes (politicos, economicos, sociais) e POR QUE isso sugere que X acontecera. Minimo 100 caracteres. Este campo é OBRIGATORIO.",
  "confidence": "high", "medium" ou "low" (baseado em quao forte e a analogia historica),
  "horizon_days": numero de 30 a 90 (dias estimados para o evento ocorrer)
}

REGRAS CRITICAS:
1. reasoning DEVE explicar especificamente como a noticia atual se parece com o caso historico. Compare os elementos concretos: quem estava envolvido, quais eram as condicoes previas, como o evento se desenrolou.
2. A probabilidade deve ser baseada em dados reais do evento historico, nao em especulacao.
3. confidence alto = evento historico muito similar e padrao claro. confidence baixo = analogia fraca ou muitos fatores diferentes.
4. Seja honesto sobre a incerteza.`;

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const OLLAMA_MODEL = process.env.OLLAMA_CLOUD_MODEL || 'gemma4:31b';

// Sports keywords for exclusion (don't show sports news in Prophet)
const SPORTS_KEYWORDS = [
  'futebol', 'football', 'soccer', 'brasileirão', 'campeonato', 'libertadores', 'champions league',
  'copa do mundo', 'world cup', 'olimpíadas', 'olympics', 'jogos olímpicos', 'atletismo',
  'nba', 'basquete', 'basketball', 'vôlei', 'volleyball', 'tênis', 'tennis', 'golfe', 'golf',
  'f1', 'fórmula 1', 'formula 1', 'moto gp', 'nascar', 'automobilismo',
  'lance', 'globoesporte', 'ge.globo', 'esporte', 'sport', 'sports',
  'paulistão', 'mineirão', 'copa do brasil', 'campeonato brasileiro',
  'real madrid', 'barcelona', 'messi', 'cr7', 'ronaldo', 'neymar',
  'transferência', 'mercado da bola', 'contrato', 'renovação',
  'corinthians', 'flamengo', 'palmeiras', 'são paulo', 'atlético', 'grêmio', 'internacional',
  'série a', 'serie a', 'liga dos campeões',
];

function isSportsArticle(title, content) {
  const text = `${title} ${content || ''}`.toLowerCase();
  return SPORTS_KEYWORDS.some(kw => text.includes(kw));
}

const RSS_SOURCES = [
  { slug: 'g1', name: 'G1', feed: 'https://g1.globo.com/rss/g1/brasil/' },
  { slug: 'folha', name: 'Folha', feed: 'https://feeds.folha.uol.com.br/emcimahmais/rss091.xml' },
  { slug: 'uol', name: 'UOL', feed: 'https://rss.uol.com.br/mostrecent/index.xml' },
  { slug: 'estadao', name: 'Estadão', feed: 'https://www.estadao.com.br/rss/' },
  { slug: 'cnn', name: 'CNN Brasil', feed: 'https://www.cnnbrasil.com.br/feed/' },
  { slug: 'bbc', name: 'BBC Brasil', feed: 'https://www.bbc.com/portuguese/feed/rss.xml' },
  { slug: 'metropoles', name: 'Metropoles', feed: 'https://www.metropoles.com/arqs/rss.xml' },
  { slug: 'reuters', name: 'Reuters World', feed: 'https://feeds.reuters.com/reuters/world' },
  { slug: 'apnews', name: 'AP News', feed: 'https://rsshub.app/apnews/topics/apf-topnews' },
  { slug: 'bbcworld', name: 'BBC World', feed: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
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

// Stopwords for keyword extraction
const STOPWORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'para', 'com', 'em', 'no', 'na', 'nos', 'nas',
  'um', 'uma', 'uns', 'umas', 'o', 'a', 'e', 'é', 'que', 'os', 'as',
  'ao', 'aos', 'pelo', 'pela', 'pelos', 'pelas',
  'por', 'mais', 'ainda', 'já', 'muito', 'pouco',
  'esse', 'essa', 'este', 'esta', 'isso', 'isto',
  'entre', 'sobre', 'após', 'ante', 'sob', 'ante',
  'seu', 'sua', 'seus', 'suas', 'se', 'meu', 'minha',
  'foi', 'ser', 'são', 'está', 'estão', 'era', 'eram',
  'tem', 'tem', 'têm', 'há', 'tinha', 'tinham',
  'como', 'mas', 'ou', 'porque', 'quando', 'onde', 'quem', 'qual', 'quais',
  'não', 'nunca', 'sim', 'só', 'também',
  'até', 'desde', 'durante', 'sem',
]);

// Normalize title: lowercase, remove punctuation/numbers, extra spaces
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\sàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\-]/gi, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract 3-5 meaningful keywords from title (excluding stopwords)
function extractKeywords(title, maxKeywords = 5) {
  const normalized = normalizeTitle(title);
  const words = normalized.split(' ').filter(w => w.length > 2 && !STOPWORDS.has(w));
  // Prioritize first 5 words (usually more specific)
  const prioritized = words.slice(0, 5);
  const rest = words.slice(5).filter(w => !prioritized.includes(w));
  const selected = [...prioritized, ...rest].slice(0, maxKeywords);
  return new Set(selected);
}

// Calculate keyword overlap between two sets
function keywordOverlap(kw1, kw2) {
  let shared = 0;
  for (const w of kw1) {
    if (kw2.has(w)) shared++;
  }
  return shared;
}

// Check if 2 stories should be grouped based on multiple strategies
function shouldGroupWithStory(newSubject, newKeywords, cycle, region, existingStory) {
  const sSubject = (existingStory.main_subject || '').toLowerCase();
  const aSubject = newSubject.toLowerCase();
  const sNorm = normalizeTitle(existingStory.main_subject || '');
  const aNorm = normalizeTitle(newSubject);

  // Strategy 1: Same cycle + region AND 50%+ keyword overlap (min 2 shared)
  if (existingStory.cycle === cycle && existingStory.region === region) {
    const existingKeywords = existingStory._cachedKeywords || extractKeywords(existingStory.main_subject || '');
    const overlap = keywordOverlap(newKeywords, existingKeywords);
    if (overlap >= 2) {
      return { match: true, reason: `keywords(${overlap} shared)` };
    }
  }

  // Strategy 2: Normalized titles are very similar (>70% words in common)
  const sWords = sNorm.split(' ').filter(w => w.length > 2);
  const aWords = aNorm.split(' ').filter(w => w.length > 2);
  if (sWords.length > 0 && aWords.length > 0) {
    const common = sWords.filter(w => aWords.includes(w));
    const minLen = Math.min(sWords.length, aWords.length);
    if (minLen > 0 && common.length / minLen >= 0.5) {
      return { match: true, reason: `title similarity(${common.length}/${minLen})` };
    }
  }

  // Strategy 3: 3+ identical words in first 5 words
  const sFirst5 = sNorm.split(' ').slice(0, 5);
  const aFirst5 = aNorm.split(' ').slice(0, 5);
  const first5Match = sFirst5.filter(w => aFirst5.includes(w) && w.length > 2);
  if (first5Match.length >= 3) {
    return { match: true, reason: `first5 match(${first5Match.length})` };
  }

  // Strategy 4: Substring match (original logic, as fallback)
  if (sNorm.includes(aNorm.slice(0, 15)) || aNorm.includes(sNorm.slice(0, 15))) {
    return { match: true, reason: 'substring' };
  }

  return { match: false, reason: null };
}

async function upsertStory(article, analysis, log) {
  const subject = analysis.main_subject || article.title.slice(0, 50);
  const cycle = normalizeCycle(analysis.cycle);
  const region = analysis.region || detectRegion(article.title + ' ' + (article.content || ''));
  
  const sentimentMap = { 'positivo': 'up', 'negativo': 'down', 'neutro': 'stable' };
  const sentiment_trend = sentimentMap[analysis.sentiment] || 'stable';
  
  // Extract keywords for new article
  const newKeywords = extractKeywords(subject);
  
  // Find existing story by similar subject
  const searchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/stories?select=id,main_subject,article_count,cycle,region&order=updated_at.desc&limit=30`,
    { headers }
  );
  let existingStories = [];
  try { existingStories = await searchRes.json(); } catch { existingStories = []; }
  if (!Array.isArray(existingStories)) existingStories = [];
  
  // Cache keywords for each existing story
  for (const s of existingStories) {
    s._cachedKeywords = extractKeywords(s.main_subject || '');
  }
  
  // Find similar story using improved matching
  let existingStory = null;
  let matchReason = null;
  
  // First pass: same cycle + region (higher priority)
  const sameCycleRegion = existingStories.filter(s => s.cycle === cycle && s.region === region);
  for (const s of sameCycleRegion) {
    const { match, reason } = shouldGroupWithStory(subject, newKeywords, cycle, region, s);
    if (match) {
      existingStory = s;
      matchReason = reason;
      break;
    }
  }
  
  // Second pass: any cycle/region if no match found
  if (!existingStory) {
    for (const s of existingStories) {
      const { match, reason } = shouldGroupWithStory(subject, newKeywords, cycle, region, s);
      if (match) {
        existingStory = s;
        matchReason = reason;
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
    log.push(`   📖 Story #${storyId} atualizada [${matchReason}]: "${subject.slice(0, 25)}" [${cycle}/${region}]`);
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
    let skippedSports = 0;
    for (const item of allItems) {
      // Skip sports articles
      if (isSportsArticle(item.title, item.content)) {
        skippedSports++;
        continue;
      }
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
    log.push(`   ✅ Inseridos: ${insertedCount} | Sports: ${skippedSports}`);

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
  // Busca eventos históricos da tabela predictions (onde seedamos com source='prophet-historical')
  const cycleParam = cycle ? `&cycle=eq.${cycle}` : '';
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/predictions?source=eq.prophet-historical${cycleParam}&order=probability.desc&limit=${limit}`,
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

    const eventsText = events.map(e => {
      // description é JSON: {evento, contexto, desfecho, significado, region}
      let descObj = {};
      try { descObj = JSON.parse(e.description || '{}'); } catch {}
      const name = e.title || descObj.evento || 'Evento desconhecido';
      const contexto = descObj.contexto || e.description || '';
      const desfecho = descObj.desfecho || '';
      const significance = descObj.significado || 3;
      return `- ${name} (Significância: ${significance}/5): ${contexto} | Desfecho: ${desfecho}`;
    }).join('\n');

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
          options: { temperature: 0.3, num_predict: 300 },
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (!response.ok) { log.push(`   ❌ Ollama error: ${response.status}`); continue; }

      const data = await response.json();
      let raw = (data.message?.content || '{}').replace(/```json\n?|\n?```/g, '').trim();
      let pred;
      try { pred = JSON.parse(raw); } catch {
        // Try to fix truncated JSON by finding complete object
        const lastBrace = raw.lastIndexOf('}');
        if (lastBrace > 50) {
          try { pred = JSON.parse(raw.substring(0, lastBrace + 1)); } catch {}
        }
        if (!pred) { log.push(`   ❌ JSON parse: ${raw.slice(0, 80)}`); continue; }
      }

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
