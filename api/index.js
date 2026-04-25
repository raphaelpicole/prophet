import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/node';

// ===================== SENTRY INIT (safe) =====================
const SENTRY_DSN = process.env.SENTRY_DSN;
if (SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment: process.env.VERCEL_ENV || 'development',
    });
  } catch (e) {
    console.warn('Sentry init failed:', e.message);
  }
}

// ===================== SUPABASE =====================
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} catch (e) {
  console.error('Supabase init failed:', e.message);
  supabase = null;
}

// ===================== CORS HELPERS =====================
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function corsError(res, status, payload) {
  setCors(res);
  return res.status(status).json(payload);
}

// ===================== ADMIN ACTIONS =====================
const AVAILABLE_ACTIONS = [
  { id: 'run_collect', label: 'Run Collect', description: 'Trigger article collection' },
  { id: 'cleanup_logs', label: 'Cleanup Logs', description: 'Remove old logs' },
  { id: 'analyze_pending', label: 'Analyze Pending', description: 'Analyze pending articles' },
  { id: 'archive_old', label: 'Archive Old Stories', description: 'Archive stories older than 7 days' },
  { id: 'refresh_stats', label: 'Refresh Stats', description: 'Refresh dashboard stats' },
];

async function runCollect() {
  const { data: dbSources, error: dbError } = await supabase.from('sources').select('*').eq('active', true);
  if (dbError) throw dbError;

  const log = [];
  let totalCollected = 0;

  for (const src of (dbSources || [])) {
    let allArticles = [];
    const seenUrls = new Set();
    if (src.rss_url) {
      const rssArticles = await fetchRSS(src.rss_url, src.slug);
      for (const a of rssArticles) {
        if (!seenUrls.has(a.url)) { seenUrls.add(a.url); allArticles.push(a); }
      }
    }
    if (SCRAPER_CONFIGS[src.slug]) {
      const htmlArticles = await scrapeHTML(src.slug);
      for (const a of htmlArticles) {
        if (!seenUrls.has(a.url)) { seenUrls.add(a.url); allArticles.push(a); }
      }
    }
    totalCollected += allArticles.length;
    log.push(`${src.slug}: ${allArticles.length} artigos`);
    if (allArticles.length > 0) {
      let inserted = 0;
      for (const article of allArticles) {
        const { data, error } = await supabase.from('raw_articles').upsert({
          source_id: src.id,
          title: article.title,
          url: article.url,
          published_at: article.published_at,
          status: 'pending',
        }, { onConflict: 'url' });
        if (!error) inserted++;
      }
      log.push(`${src.slug}: inseridos ${inserted}`);
    }
  }
  return { success: true, total: totalCollected, log };
}

async function cleanupLogs() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('system_logs').delete().lt('created_at', cutoff);
  if (error) throw error;
  return { success: true, message: 'Old logs cleaned up' };
}

async function analyzePending() {
  const { data: pendingArticles } = await supabase
    .from('raw_articles')
    .select('*')
    .eq('status', 'pending')
    .order('published_at', { ascending: false })
    .limit(100);
  if (!pendingArticles || pendingArticles.length === 0) return { success: true, analyzed: 0 };

  const analyzed = pendingArticles.map(a => ({ ...a, analysis: analyzeArticle(a.title) }));
  const groups = [];
  const used = new Set();
  for (let i = 0; i < analyzed.length; i++) {
    if (used.has(i)) continue;
    const group = [analyzed[i]];
    used.add(i);
    for (let j = i + 1; j < analyzed.length; j++) {
      if (used.has(j)) continue;
      if (analyzed[i].analysis.topic === analyzed[j].analysis.topic && similarTitles(analyzed[i].title, analyzed[j].title)) {
        group.push(analyzed[j]); used.add(j);
      }
    }
    if (group.length >= 2) groups.push(group);
  }

  for (const group of groups.slice(0, 20)) {
    const main = group[0];
    const { data: newStory } = await supabase.from('stories').insert({
      title: main.title,
      summary: `Tópico: ${main.analysis.topic}. ${group.length} artigos.`,
      topic: main.analysis.topic,
      status: 'active',
      article_count: group.length,
    }).select().single();
    if (!newStory) continue;
    for (const article of group) {
      await supabase.from('story_articles').upsert({
        story_id: newStory.id, article_id: article.id,
      }, { onConflict: 'story_id,article_id' });
      await supabase.from('raw_articles').update({
        status: 'analyzed', analysis: article.analysis,
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
  return { success: true, analyzed: analyzed.length, groups: groups.length };
}

async function archiveOldStories() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('stories').update({ archived: true }).lt('updated_at', cutoff);
  if (error) throw error;
  return { success: true, message: 'Old stories archived' };
}

async function refreshStats() {
  const today = new Date().toISOString().split('T')[0];
  const { data: stories } = await supabase.from('stories').select('*').gte('updated_at', today + 'T00:00:00').eq('archived', false);
  const { data: articles } = await supabase.from('raw_articles').select('*').gte('published_at', today + 'T00:00:00');
  return { success: true, stories_today: stories?.length || 0, articles_today: articles?.length || 0 };
}

// ===================== RSS & SCRAPER (unchanged logic) =====================
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
      if (pubDate) { const d = new Date(pubDate); if (!isNaN(d.getTime())) published_at = d.toISOString(); }
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
  let topic = 'geral'; let sentiment = 'neutro'; let confidence = 0.5;
  for (const [t, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const kw of keywords) { if (lower.includes(kw)) { topic = t; confidence = 0.7; break; } }
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

const SCRAPER_CONFIGS = {
  'g1': { url: 'https://g1.globo.com', selector: /href="(https:\/\/g1\.globo\.com\/[^"]*\/noticia\/\d{4}\/\d{2}\/\d{2}\/[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi, baseUrl: '' },
  'estadao': { url: 'https://www.estadao.com.br', selector: /href="(https:\/\/www\.estadao\.com\.br\/[^"]*\/)"[^>]*class="headline"[^>]*>([^<]{20,120})/gi, baseUrl: '' },
  'oglobo': { url: 'https://oglobo.globo.com', selector: /href="(https:\/\/oglobo\.globo\.com\/[^"]*\.ghtml)"[^>]*class="franja-colunistas__link"[^>]*>([^<]{20,120})/gi, baseUrl: '' },
  'metropoles': { url: 'https://www.metropoles.com', selector: /href="(\/[^"]*\d{4}\/[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi, baseUrl: 'https://www.metropoles.com' },
  'icl': { url: 'https://www.iclinic.com.br/noticias', selector: /href="(\/[^"]*\d{4}\/[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi, baseUrl: 'https://www.iclinic.com.br' },
  'reuters': { url: 'https://www.reuters.com/world/', selector: /href="(\/world\/[^"]*\d{4}[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi, baseUrl: 'https://www.reuters.com' },
  'cnn': { url: 'https://edition.cnn.com/world', selector: /href="(\/\d{4}\/[^"]*?\.html)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi, baseUrl: 'https://edition.cnn.com' },
  'ap': { url: 'https://apnews.com', selector: /href="(\/article\/[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi, baseUrl: 'https://apnews.com' },
  'aljazeera': { url: 'https://www.aljazeera.com/news/', selector: /href="(\/news\/\d{4}\/[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi, baseUrl: 'https://www.aljazeera.com' },
  'france24': { url: 'https://www.france24.com/en/', selector: /href="(\/en\/[^"]*\d{4}[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi, baseUrl: 'https://www.france24.com' },
  'dw': { url: 'https://www.dw.com/en/top-stories/s-9097', selector: /href="(\/en\/[^"]*[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi, baseUrl: 'https://www.dw.com' },
  'rte': { url: 'https://www.rte.ie/news/', selector: /href="(\/news\/[^"]*\d{4}[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi, baseUrl: 'https://www.rte.ie' },
  'nbc': { url: 'https://www.nbcnews.com/world', selector: /href="(\/[^"]*\/[^"]*\d{4}[^"]*)"[^>]*>(?:\s*<[^>]+>)*\s*([^<]{20,120})/gi, baseUrl: 'https://www.nbcnews.com' },
};

async function scrapeHTML(sourceId) {
  try {
    const config = SCRAPER_CONFIGS[sourceId];
    if (!config) return [];
    const res = await fetch(config.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProphetBot/0.1)' } });
    if (!res.ok) return [];
    const html = await res.text();
    const articles = []; const seen = new Set();
    let match;
    while ((match = config.selector.exec(html)) !== null) {
      const [, href, rawTitle] = match;
      const url = href.startsWith('http') ? href : config.baseUrl + href;
      const title = rawTitle.replace(/<[^>]+>/g, '').trim();
      if (title.length > 20 && !seen.has(url)) { seen.add(url); articles.push({ title, url, source_id: sourceId, published_at: new Date().toISOString() }); }
    }
    return articles.slice(0, 15);
  } catch (e) {
    console.error(`HTML scrape error ${sourceId}:`, e.message);
    return [];
  }
}

// ===================== MAIN HANDLER =====================
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!supabase) {
    return corsError(res, 503, { error: 'Database not configured' });
  }

  const path = (req.url.split('?')[0] || '').replace(/\/$/, '');

  try {
    // ===== ADMIN ROUTES =====
    if (path === '/api/admin') {
      const { data: stats } = await supabase.from('stories').select('count', { count: 'exact', head: true });
      const { data: articlesCount } = await supabase.from('raw_articles').select('count', { count: 'exact', head: true });
      return res.status(200).json({
        availableActions: AVAILABLE_ACTIONS,
        stats: {
          totalStories: stats?.length ?? 0,
          totalArticles: articlesCount?.length ?? 0,
        }
      });
    }

    if (path === '/api/admin/actions') {
      if (req.method !== 'POST') return corsError(res, 405, { error: 'Method not allowed' });
      const action = req.query?.action;
      if (!action) return corsError(res, 400, { error: 'Missing action query param' });

      let result;
      switch (action) {
        case 'run_collect': result = await runCollect(); break;
        case 'cleanup_logs': result = await cleanupLogs(); break;
        case 'analyze_pending': result = await analyzePending(); break;
        case 'archive_old': result = await archiveOldStories(); break;
        case 'refresh_stats': result = await refreshStats(); break;
        default: return corsError(res, 400, { error: 'Unknown action', availableActions: AVAILABLE_ACTIONS.map(a => a.id) });
      }
      return res.status(200).json({ success: true, action, result });
    }

    if (path === '/api/admin/tables') {
      if (req.method !== 'GET') return corsError(res, 405, { error: 'Method not allowed' });
      const table = req.query?.table;
      const page = Math.max(1, parseInt(req.query?.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit || '20', 10)));
      const offset = (page - 1) * limit;

      const ALLOWED_TABLES = ['sources', 'stories', 'raw_articles', 'story_articles', 'predictions', 'system_logs'];
      if (!table || !ALLOWED_TABLES.includes(table)) {
        return corsError(res, 400, { error: 'Invalid or missing table', allowedTables: ALLOWED_TABLES });
      }

      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('id', { ascending: false });

      if (error) throw error;
      return res.status(200).json({
        data: data || [],
        pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) }
      });
    }

    if (path === '/api/logs') {
      if (req.method !== 'GET') return corsError(res, 405, { error: 'Method not allowed' });
      const limit = Math.min(500, Math.max(1, parseInt(req.query?.limit || '50', 10)));
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return res.status(200).json({ logs: data || [] });
    }

    // ===== EXISTING ROUTES =====
    if (path === '/api/sources') {
      const { data, error } = await supabase.from('sources').select('*').eq('active', true);
      if (error) throw error;
      return res.status(200).json({ sources: data || [] });
    }

    if (path === '/api/stories') {
      const limit = parseInt(req.query?.limit || '50', 10);
      const offset = parseInt(req.query?.offset || '0', 10);
      try {
        const { data, error } = await supabase
          .from('v_story_indicators')
          .select('*')
          .eq('archived', false)
          .order('updated_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (!error && data) {
          return res.status(200).json({ stories: data, pagination: { limit, offset } });
        }
      } catch (e) {
        console.log('v_story_indicators não disponível, usando fallback');
      }
      const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .eq('archived', false)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      if (stories && stories.length > 0) {
        const storyIds = stories.map(s => s.id);
        const { data: relations } = await supabase.from('story_articles').select('story_id').in('story_id', storyIds);
        const articleCounts = {};
        for (const r of (relations || [])) articleCounts[r.story_id] = (articleCounts[r.story_id] || 0) + 1;
        stories.forEach(s => s.article_count = articleCounts[s.id] || 0);
      }
      return res.status(200).json({ stories: stories || [], pagination: { limit, offset } });
    }

    if (path === '/api/story') {
      const id = req.query?.id;
      if (!id) return corsError(res, 400, { error: 'Missing id' });
      const { data, error } = await supabase.from('stories').select('*').eq('id', id).single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (path === '/api/indicators') {
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

    if (path === '/api/collect' || path === '/api/cron/collect') {
      if (req.method !== 'GET' && req.method !== 'POST') return corsError(res, 405, { error: 'Method not allowed' });
      const result = await runCollect();
      // After collect, run analysis
      try { await analyzePending(); } catch (e) { console.error('Auto-analyze error:', e.message); }
      return res.status(200).json({ success: true, message: 'Coleta e análise concluídas', ...result });
    }

    return corsError(res, 404, { error: 'Not found', path });
  } catch (err) {
    console.error('API Error:', err.message);
    if (SENTRY_DSN) { Sentry.captureException(err); await Sentry.flush(2000).catch(() => {}); }
    return corsError(res, 500, { error: err.message });
  }
}
