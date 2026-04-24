const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const CONTENT_FILTER_KEYWORDS = [
  // Sports
  'futebol', 'football', 'soccer', 'brasileirão', 'campeonato', 'libertadores', 'champions league',
  'copa do mundo', 'world cup', 'olimpíadas', 'olympics', 'jogos olímpicos', 'atletismo',
  'nba', 'basquete', 'basketball', 'vôlei', 'volleyball', 'tênis', 'tennis', 'golfe', 'golf',
  'f1', 'fórmula 1', 'formula 1', 'moto gp', 'nascar', 'automobilismo',
  'lance', 'globoesporte', 'ge.globo', 'esporte', 'sport', 'sports',
  'paulistão', 'mineirão', 'copa do brasil', 'campeonato brasileiro',
  'real madrid', 'barcelona', 'messi', 'cr7', 'ronaldo', 'neymar',
  'transferência', 'mercado da bola', 'contrato', 'renovação',
  'corinthians', 'flamengo', 'palmeiras', 'são paulo', 'grêmio', 'internacional',
  'atlético', 'atlético-mg', 'botafogo', 'vasco', 'santos', 'cruzeiro', 'fluminense',
  'coritiba', 'athletico', 'paranaense', 'goias', 'ceará', 'sport',
  'série a', 'serie a', 'liga dos campeões', 'copa libertadores',
  'brasileirão', 'serie b', 'copa do brasil',
  'horário e onde assistir', 'ao vivo', 'transmissão', 'canal', 'tv',
  'escalação', 'escalacao', 'titular', 'reserva',
  // Celebrities / Reality shows / Entertainment fluff
  'bbb', 'big brother', 'reality show', 'a fazenda', 'casa dos famosos',
  'fofoca', 'famosos', 'celebridade', 'celebridades', 'famosa', 'famoso',
  'anitta', 'whindersson', 'lorena sonza', 'luísa sonza',
  'bbb 26', 'bbb 27', 'final do bbb', 'vencedor do bbb',
  'cinema', 'filme', 'série', 'netflix', 'globoplay', 'prime video', 'disney+',
  'ator', 'atriz', 'hollywood', 'première', 'estreia de filme',
  'show', 'turnê', 'festival', ' concerto',
  'rodrigo faro', 'faustão', 'simone', 'belo',
];

function isFilteredStory(story) {
  const text = `${story.main_subject || ''} ${story.title || ''} ${story.summary || ''}`.toLowerCase();
  return CONTENT_FILTER_KEYWORDS.some(kw => text.includes(kw));
}

function cleanHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&#8216;/g, "'").replace(/&#8217;/g, "'")
    .replace(/&#215;/g, '×').replace(/&#38;/g, '&')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]{1,4});/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]{1,5});/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

async function logError(level, source, message, context) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ level, source, message, context }),
    });
  } catch (_) {}
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { cycle, region, bias, sentiment, limit = '20', offset = '0', search } = req.query;

  let params = `select=*&archived=eq.false&order=updated_at.desc&limit=${limit}&offset=${offset}`;
  if (cycle) params += `&cycle=eq.${cycle}`;
  if (region) {
    if (region === 'SAM') {
      params += `&(region=eq.SAM,region=eq.BR)`;
    } else {
      params += `&region=eq.${region}`;
    }
  }
  if (search) params += `&main_subject=ilike.*${search}*`;

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/stories?${params}`, { headers });
    const stories = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: stories.message });

    // Batch fetch preview articles
    const storyIds = Array.isArray(stories) ? stories.map(s => s.id) : [];
    if (storyIds.length > 0) {
      try {
        const saRes = await fetch(
          `${SUPABASE_URL}/rest/v1/story_articles?story_id=in.(${storyIds.join(',')})&select=story_id,article_id&order=article_id.desc`,
          { headers }
        );
        const saData = await saRes.json();
        if (Array.isArray(saData) && saData.length > 0) {
          const byStory = {};
          for (const row of saData) {
            if (!byStory[row.story_id]) byStory[row.story_id] = [];
            if (byStory[row.story_id].length < 3) byStory[row.story_id].push(row.article_id);
          }
          const allArticleIds = [...new Set(saData.map(r => r.article_id))];
          const idsFilter = allArticleIds.join(',');
          const artsRes = await fetch(
            `${SUPABASE_URL}/rest/v1/raw_articles?id=in.(${idsFilter})&select=id,title,url,source_id,published_at,summary&order=published_at.desc`,
            { headers }
          );
          const articles = await artsRes.json();
          const artsById = Array.isArray(articles)
            ? Object.fromEntries(articles.map(a => [a.id, a]))
            : {};
          for (const story of stories) {
            const ids = byStory[story.id] || [];
            story.preview_articles = ids.map(id => artsById[id]).filter(Boolean);
          }
        }
      } catch (e) {
        // Skip articles on error
      }
    }

    // Filter sports stories
    const filteredStories = Array.isArray(stories) ? stories.filter(s => !isFilteredStory(s)) : [];

    return res.status(200).json({
      stories: filteredStories.map(s => ({
        ...s,
        title: cleanHtmlEntities(s.title || ''),
        main_subject: cleanHtmlEntities(s.main_subject || ''),
        summary: cleanHtmlEntities(s.summary || ''),
        preview_articles: s.preview_articles ? s.preview_articles.map(a => ({
          ...a,
          title: cleanHtmlEntities(a.title || ''),
          summary: cleanHtmlEntities(a.summary || ''),
        })) : [],
      })),
      pagination: { limit: parseInt(limit), offset: parseInt(offset) },
    });
  } catch (e) {
    await logError('error', 'api-stories', e.message, { query: req.query });
    return res.status(500).json({ error: e.message });
  }
}