import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple RSS parser
function parseRSS(xml, sourceId) {
  const items = xml.matchAll(/<item[\s\S]*?<\/item>/g);
  const articles = [];
  for (const item of items) {
    const raw = item[0];
    const title = raw.match(/<title>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/title>/)?.[1]
      ?? raw.match(/<title>(.*?)<\/title>/)?.[1]?.trim() ?? '';
    const link = raw.match(/<link>(.*?)<\/link>/)?.[1]?.trim() ?? '';
    const pubDate = raw.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
    if (title && link) {
      let published_at;
      if (pubDate) {
        const date = new Date(pubDate);
        if (!isNaN(date.getTime())) published_at = date.toISOString();
      }
      articles.push({ title: title.replace(/&amp;/g, '&'), url: link, source_id: sourceId, published_at });
    }
  }
  return articles;
}

async function fetchRSS(url, sourceId) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'ProphetBot/0.1' } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, sourceId);
  } catch (e) {
    console.error(`RSS error ${sourceId}:`, e.message);
    return [];
  }
}

// Análise e agrupamento com regras simples
const TOPIC_KEYWORDS = {
  'política': ['bolsonaro', 'lula', 'governo', 'congresso', 'senado', 'camara', 'eleição', 'pt', 'psdb', 'direita', 'esquerda', 'ministro', 'presidente', 'político'],
  'economia': ['economia', 'inflação', 'dólar', 'juros', 'pib', 'mercado', 'bolsa', 'ibovespa', 'fed', 'bce', 'bc', 'banco central'],
  'tecnologia': ['tech', 'tecnologia', 'ia', 'inteligência artificial', 'chatgpt', 'apple', 'google', 'microsoft', 'meta', 'startup', 'app'],
  'saúde': ['covid', 'vacina', 'saúde', 'hospital', 'médico', 'doença', 'sus', 'oms'],
  'guerra': ['guerra', 'ucrânia', 'rússia', 'putin', 'zelensky', 'conflito', 'militar', 'ataque', 'bomba', 'otan'],
  'crime': ['crime', 'polícia', 'prisão', 'assalto', 'homicídio', 'tráfico', 'pf', 'pc'],
  'clima': ['clima', 'aquecimento', 'temperatura', 'chuva', 'secas', 'enchente', 'meio ambiente', 'amazônia', 'desmatamento'],
  'esporte': ['futebol', 'copa', 'brasileirão', 'libertadores', 'flamengo', 'palmeiras', 'jogo', 'seleção'],
  'entretenimento': ['filme', 'série', 'netflix', 'oscar', 'grammy', 'celebridade', 'famoso', 'música'],
};

function analyzeArticle(title) {
  const lower = title.toLowerCase();
  let topic = 'geral';
  let sentiment = 'neutro';
  let confidence = 0.5;
  
  for (const [t, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        topic = t;
        confidence = 0.7;
        break;
      }
    }
    if (topic !== 'geral') break;
  }
  
  const negative = ['crise', 'queda', 'problema', 'guerra', 'ataque', 'morte', 'acidente', 'prisão'];
  const positive = ['crescimento', 'alta', 'vitória', 'sucesso', 'avanço', 'recuperação'];
  
  if (negative.some(w => lower.includes(w))) sentiment = 'negativo';
  else if (positive.some(w => lower.includes(w))) sentiment = 'positivo';
  
  return { topic, sentiment, confidence, keywords: [] };
}

function similarTitles(t1, t2) {
  const words1 = t1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const words2 = t2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const common = words1.filter(w => words2.includes(w));
  return common.length >= 2;
}

// HTML scraping para fontes sem RSS ou com RSS quebrado
const SCRAPER_CONFIGS = {
  'g1': {
    url: 'https://g1.globo.com',
    selector: /href="(https:\/\/g1\.globo\.com\/[^"]*\/noticia\/\d{4}\/\d{2}\/\d{2}\/[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi,
    baseUrl: ''
  },
  'estadao': {
    url: 'https://www.estadao.com.br',
    selector: /href="(https:\/\/www\.estadao\.com\.br\/[^"]*\/)"[^>]*class="headline"[^>]*>([^<]{20,120})/gi,
    baseUrl: ''
  },
  'oglobo': {
    url: 'https://oglobo.globo.com',
    selector: /href="(https:\/\/oglobo\.globo\.com\/[^"]*\.ghtml)"[^>]*class="franja-colunistas__link"[^>]*>([^<]{20,120})/gi,
    baseUrl: ''
  },
  'metropoles': {
    url: 'https://www.metropoles.com',
    selector: /href="(\/[^"]*\d{4}\/[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi,
    baseUrl: 'https://www.metropoles.com'
  },
  'icl': {
    url: 'https://www.iclinic.com.br/noticias',
    selector: /href="(\/[^"]*\d{4}\/[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi,
    baseUrl: 'https://www.iclinic.com.br'
  },
  'reuters': {
    url: 'https://www.reuters.com/world/',
    selector: /href="(\/world\/[^"]*\d{4}[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi,
    baseUrl: 'https://www.reuters.com'
  },
  'cnn': {
    url: 'https://edition.cnn.com/world',
    selector: /href="(\/\d{4}\/[^"]*?\.html)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi,
    baseUrl: 'https://edition.cnn.com'
  },
  'ap': {
    url: 'https://apnews.com',
    selector: /href="(\/article\/[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi,
    baseUrl: 'https://apnews.com'
  },
  'aljazeera': {
    url: 'https://www.aljazeera.com/news/',
    selector: /href="(\/news\/\d{4}\/[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi,
    baseUrl: 'https://www.aljazeera.com'
  },
  'france24': {
    url: 'https://www.france24.com/en/',
    selector: /href="(\/en\/[^"]*\d{4}[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi,
    baseUrl: 'https://www.france24.com'
  },
  'dw': {
    url: 'https://www.dw.com/en/top-stories/s-9097',
    selector: /href="(\/en\/[^"]*[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi,
    baseUrl: 'https://www.dw.com'
  },
  'rte': {
    url: 'https://www.rte.ie/news/',
    selector: /href="(\/news\/[^"]*\d{4}[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi,
    baseUrl: 'https://www.rte.ie'
  },
  'nbc': {
    url: 'https://www.nbcnews.com/world',
    selector: /href="(\/[^"]*\/[^"]*\d{4}[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi,
    baseUrl: 'https://www.nbcnews.com'
  },
};

async function scrapeHTML(sourceId) {
  try {
    const config = SCRAPER_CONFIGS[sourceId];
    if (!config) return [];

    const res = await fetch(config.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProphetBot/0.1)'
      }
    });
    if (!res.ok) return [];

    const html = await res.text();
    const articles = [];
    const seen = new Set();

    let match;
    while ((match = config.selector.exec(html)) !== null) {
      const [, href, rawTitle] = match;
      const url = href.startsWith('http') ? href : config.baseUrl + href;
      const title = rawTitle.replace(/<[^>]+>/g, '').trim();

      if (title.length > 20 && !seen.has(url)) {
        seen.add(url);
        articles.push({ title, url, source_id: sourceId, published_at: new Date().toISOString() });
      }
    }

    return articles.slice(0, 15); // limita a 15 artigos por fonte
  } catch (e) {
    console.error(`HTML scrape error ${sourceId}:`, e.message);
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = req.url.split('?')[0];

  try {
    if (path === '/api/sources' || path === '/api/sources/') {
      const { data, error } = await supabase.from('sources').select('*').eq('active', true);
      if (error) throw error;
      return res.status(200).json({ sources: data || [] });
    }

    if (path === '/api/stories' || path === '/api/stories/') {
      const { limit = '50', offset = '0' } = req.query;
      
      // Fallback: se a view não existir, busca stories direto + contagem de artigos
      try {
        const { data, error } = await supabase
          .from('v_story_indicators')
          .select('*')
          .eq('archived', false)
          .order('updated_at', { ascending: false })
          .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        
        if (!error && data) {
          return res.status(200).json({ stories: data, pagination: { limit: parseInt(limit), offset: parseInt(offset) } });
        }
      } catch (e) {
        console.log('v_story_indicators não disponível, usando fallback');
      }
      
      // Fallback: buscar stories e contar artigos manualmente
      const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .eq('archived', false)
        .order('updated_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      
      if (error) throw error;
      
      // Busca artigos relacionados
      if (stories && stories.length > 0) {
        const storyIds = stories.map(s => s.id);
        const { data: relations } = await supabase
          .from('story_articles')
          .select('story_id')
          .in('story_id', storyIds);
        
        const articleCounts = {};
        for (const r of (relations || [])) {
          articleCounts[r.story_id] = (articleCounts[r.story_id] || 0) + 1;
        }
        
        stories.forEach(s => s.article_count = articleCounts[s.id] || 0);
      }
      
      return res.status(200).json({ stories: stories || [], pagination: { limit: parseInt(limit), offset: parseInt(offset) } });
    }

    if (path === '/api/story' || path === '/api/story/') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const { data, error } = await supabase.from('stories').select('*').eq('id', id).single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (path === '/api/indicators' || path === '/api/indicators/') {
      const today = new Date().toISOString().split('T')[0];
      const { data: stories } = await supabase.from('stories').select('*').gte('updated_at', today + 'T00:00:00').eq('archived', false);
      const { data: articles } = await supabase.from('raw_articles').select('*').gte('published_at', today + 'T00:00:00');
      return res.status(200).json({
        stories_today: stories?.length || 0,
        articles_today: articles?.length || 0,
        predictions: 0,
        hot_stories: (stories || []).filter(s => (s.article_count || 0) >= 2).slice(0, 5),
      });
    }

    if (path === '/api/collect' || path === '/api/collect/' || path === '/api/cron/collect') {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Coleta do banco de fontes
      const { data: dbSources, error: dbError } = await supabase.from('sources').select('*').eq('active', true);
      if (dbError) throw dbError;

      const log = [];
      let totalCollected = 0;

      for (const src of (dbSources || [])) {
        let allArticles = [];
        const seenUrls = new Set();
        
        // Tenta RSS primeiro (se disponível)
        if (src.rss_url) {
          const rssArticles = await fetchRSS(src.rss_url, src.slug);
          for (const a of rssArticles) {
            if (!seenUrls.has(a.url)) {
              seenUrls.add(a.url);
              allArticles.push(a);
            }
          }
        }
        
        // Tenta HTML também (se configurado)
        if (SCRAPER_CONFIGS[src.slug]) {
          const htmlArticles = await scrapeHTML(src.slug);
          for (const a of htmlArticles) {
            if (!seenUrls.has(a.url)) {
              seenUrls.add(a.url);
              allArticles.push(a);
            }
          }
        }
        
        totalCollected += allArticles.length;
        log.push(`${src.slug}: ${allArticles.length} artigos (RSS:${src.rss_url ? 'sim' : 'não'} + HTML:${SCRAPER_CONFIGS[src.slug] ? 'sim' : 'não'})`);

        if (allArticles.length > 0) {
          let inserted = 0;
          let errors = 0;
          let errorMsgs = [];
          for (const article of allArticles) {
            const { data, error } = await supabase.from('raw_articles').upsert({
              source_id: article.source_id,
              title: article.title,
              url: article.url,
              published_at: article.published_at,
              status: 'pending',
            }, { onConflict: 'url' });
            if (error) {
              errors++;
              if (errorMsgs.length < 3) errorMsgs.push(error.message);
            } else {
              inserted++;
            }
          }
          log.push(`${src.slug}: inseridos ${inserted}, erros ${errors}${errorMsgs.length > 0 ? ' (' + errorMsgs.join(', ') + ')' : ' (provavelmente duplicatas)'}`);
        }
      }

      // ===== ANÁLISE E AGRUPAMENTO AUTOMÁTICO =====
      try {
        const { data: pendingArticles } = await supabase
          .from('raw_articles')
          .select('*')
          .eq('status', 'pending')
          .order('published_at', { ascending: false })
          .limit(100);

        if (pendingArticles && pendingArticles.length > 0) {
          const analyzed = pendingArticles.map(a => ({
            ...a,
            analysis: analyzeArticle(a.title)
          }));

          const groups = [];
          const used = new Set();
          
          for (let i = 0; i < analyzed.length; i++) {
            if (used.has(i)) continue;
            const group = [analyzed[i]];
            used.add(i);
            
            for (let j = i + 1; j < analyzed.length; j++) {
              if (used.has(j)) continue;
              if (analyzed[i].analysis.topic === analyzed[j].analysis.topic &&
                  similarTitles(analyzed[i].title, analyzed[j].title)) {
                group.push(analyzed[j]);
                used.add(j);
              }
            }
            
            if (group.length >= 2) groups.push(group);
          }

          for (const group of groups.slice(0, 20)) {
            const main = group[0];
            const { data: newStory } = await supabase
              .from('stories')
              .insert({
                title: main.title,
                summary: `Tópico: ${main.analysis.topic}. ${group.length} artigos.`,
                topic: main.analysis.topic,
                status: 'active',
                article_count: group.length,
              })
              .select()
              .single();
            
            if (!newStory) continue;
            
            for (const article of group) {
              await supabase.from('story_articles').upsert({
                story_id: newStory.id,
                article_id: article.id,
              }, { onConflict: 'story_id,article_id' });
              
              await supabase.from('raw_articles').update({
                status: 'analyzed',
                analysis: article.analysis,
              }).eq('id', article.id);
            }

            await supabase.from('predictions').insert({
              story_id: newStory.id,
              prediction: main.analysis.topic === 'guerra' ? 'Tensões devem continuar' :
                           main.analysis.topic === 'economia' ? 'Mercado deve reagir' :
                           main.analysis.topic === 'política' ? 'Debate deve intensificar' :
                           'Monitorar desenvolvimentos',
              confidence: main.analysis.confidence,
              timeframe: '48h',
              status: 'pending',
            });
          }

          log.push(`análise: ${analyzed.length} artigos, ${groups.length} stories`);
        }
      } catch (e) {
        console.error('Erro análise:', e.message);
        log.push(`erro análise: ${e.message}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Coleta e análise concluídas',
        total: totalCollected,
        log,
      });
    }

    return res.status(404).json({ error: 'Not found', path });
  } catch (err) {
    console.error('API Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
