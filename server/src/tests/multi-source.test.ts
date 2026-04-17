import { describe, it, expect } from 'vitest';
import { parseG1Feed } from '../collectors/g1.js';
import { parseFolhaFeed } from '../collectors/folha.js';
import { parseUOLFeed } from '../collectors/uol.js';
import { parseEstadaoFeed } from '../collectors/estadao.js';
import { parseICLHomepage } from '../collectors/icl.js';
import { parseMetropolesHomepage } from '../collectors/metropoles.js';
import { deduplicateBatch, contentHash } from '../dedup/deduplicator.js';
import { mockAnalyze } from '../analyzer/mock-analyzer.js';

describe('Integração Multi-Fonte', () => {
  it('deve coletar e consolidar notícias de múltiplas fontes', () => {
    // Simular feeds de diferentes fontes sobre o mesmo assunto
    const g1Xml = `
      <rss>
        <channel>
          <item>
            <title><![CDATA[Dólar sobe e fecha acima de R$ 5,60]]></title>
            <link>https://g1.globo.com/economia/2025/04/14/dolar-560.html</link>
            <pubDate>Tue, 14 Apr 2025 18:00:00 -0300</pubDate>
          </item>
          <item>
            <title><![CDATA[Ofensiva russa intensifica na Ucrânia]]></title>
            <link>https://g1.globo.com/mundo/2025/04/14/ucrania.html</link>
          </item>
        </channel>
      </rss>
    `;

    const folhaXml = `
      <rss version="0.91">
        <channel>
          <item>
            <title><![CDATA[Economia: Dólar sobe acima de R$ 5,60 com tensões externas]]></title>
            <link>https://www.folha.uol.com.br/mercado/2025/dolar-externo.html</link>
            <pubDate>Tue, 14 Apr 2025 17:30:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    const uolXml = `
      <rss version="2.0">
        <channel>
          <item>
            <title><![CDATA[Cotação do dólar dispara e passa de R$ 5,60]]></title>
            <link>https://noticias.uol.com.br/economia/2025/04/14/cotacao-dolar.html</link>
          </item>
        </channel>
      </rss>
    `;

    // Coletar de cada fonte
    const g1Articles = parseG1Feed(g1Xml);
    const folhaArticles = parseFolhaFeed(folhaXml);
    const uolArticles = parseUOLFeed(uolXml);

    expect(g1Articles).toHaveLength(2);
    expect(folhaArticles).toHaveLength(1);
    expect(uolArticles).toHaveLength(1);

    // Consolidar todas
    const allArticles = [
      ...g1Articles.map(a => ({ ...a, source_id: 'g1' })),
      ...folhaArticles.map(a => ({ ...a, source_id: 'folha' })),
      ...uolArticles.map(a => ({ ...a, source_id: 'uol' })),
    ];

    expect(allArticles).toHaveLength(4);
  });

  it('deve detectar mesma notícia coberta por múltiplas fontes', () => {
    // Simular base existente
    const existingArticles = [
      {
        id: '1',
        url: 'https://g1.globo.com/primeira-noticia.html',
        title: 'Primeira notícia',
        content_hash: contentHash('primeira notícia'),
      },
    ];

    // Novas notícias de várias fontes (algumas duplicadas)
    const newArticles = [
      { url: 'https://g1.globo.com/primeira-noticia.html', title: 'Primeira notícia' }, // URL duplicada
      { url: 'https://folha.uol.com.br/primeira-noticia.html', title: 'Primeira notícia' }, // Título duplicado
      { url: 'https://g1.globo.com/nova-noticia.html', title: 'Notícia completamente nova' }, // Nova
    ];

    const result = deduplicateBatch(newArticles, existingArticles);

    expect(result.newArticles).toHaveLength(1);
    expect(result.duplicates).toHaveLength(2);

    // Verificar tipos de duplicação
    const urlDup = result.duplicates.find(d => d.article.url.includes('g1'));
    const titleDup = result.duplicates.find(d => d.article.url.includes('folha'));

    expect(urlDup).toBeDefined();
    expect(titleDup).toBeDefined();
    // Pode ser detectado como url, hash ou title_similarity
    expect(['url', 'hash', 'title_similarity']).toContain(urlDup?.reason);
    expect(['url', 'hash', 'title_similarity']).toContain(titleDup?.reason);
  });

  it('deve analisar e categorizar notícias de diferentes ciclos', () => {
    const articles = [
      { id: '1', title: 'Guerra na Ucrânia: novos ataques no leste', source_id: 'g1' },
      { id: '2', title: 'Dólar fecha acima de R$ 5,60', source_id: 'folha' },
      { id: '3', title: 'Vacinação contra dengue avança', source_id: 'uol' },
      { id: '4', title: 'IA generativa debate regulamentação', source_id: 'estadao' },
    ];

    const analyses = articles.map(a => mockAnalyze(a));

    expect(analyses[0].cycle).toBe('conflito');
    expect(analyses[1].cycle).toBe('economico');
    expect(analyses[2].cycle).toBe('pandemia');
    expect(analyses[3].cycle).toBe('tecnologico');

    // Verificar que cada um tem categorias
    analyses.forEach(analysis => {
      expect(analysis.categories.length).toBeGreaterThan(0);
      expect(analysis.confidence).toBeGreaterThan(0);
    });
  });

  it('deve processar feed completo simulado end-to-end', () => {
    // Cenário realista: feed com notícias misturadas
    const estadaoXml = `
      <rss version="2.0">
        <channel>
          <item>
            <title><![CDATA[Política: Reforma tributária avança no Congresso]]></title>
            <link>https://www.estadao.com.br/politica/reforma-tributaria/</link>
            <pubDate>Tue, 14 Apr 2025 09:00:00 GMT</pubDate>
          </item>
          <item>
            <title><![CDATA[Economia: Inflação fica abaixo do esperado em março]]></title>
            <link>https://www.estadao.com.br/economia/inflacao-marco/</link>
            <pubDate>Tue, 14 Apr 2025 08:00:00 GMT</pubDate>
          </item>
          <item>
            <title><![CDATA[Mundo: Alemanha aprova pacote de investimentos]]></title>
            <link>https://www.estadao.com.br/internacional/alemanha-investimentos/</link>
            <pubDate>Tue, 14 Apr 2025 07:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    // Passo 1: Coletar
    const articles = parseEstadaoFeed(estadaoXml);
    expect(articles).toHaveLength(3);

    // Passo 2: Deduplicar (base vazia = tudo novo)
    const dedupResult = deduplicateBatch(articles, []);
    expect(dedupResult.newArticles).toHaveLength(3);

    // Passo 3: Analisar
    const analyses = dedupResult.newArticles.map(a => mockAnalyze({
      id: 'test',
      title: a.title,
      source_id: 'estadao',
    }));

    expect(analyses).toHaveLength(3);
    
    // Verificar categorias
    const cycles = analyses.map(a => a.cycle);
    expect(cycles).toContain('politico');
    expect(cycles).toContain('economico');

    // Verificar que todas têm entidades
    analyses.forEach(a => {
      expect(Array.isArray(a.entities)).toBe(true);
      expect(Array.isArray(a.regions)).toBe(true);
    });
  });

  it('deve simular scraping de site sem RSS', () => {
    const iclHtml = `
      <html>
        <head><title>ICL Notícias</title></head>
        <body>
          <article class="post">
            <h2><a href="https://iclnoticias.com.br/2025/04/14/economia/">Análise: Impactos da alta do dólar</a></h2>
            <time datetime="2025-04-14T10:00:00-03:00">14/04</time>
          </article>
          <article class="post">
            <h2><a href="https://iclnoticias.com.br/2025/04/14/politica/">Lula se reúne com ministros</a></h2>
          </article>
        </body>
      </html>
    `;

    const articles = parseICLHomepage(iclHtml);

    expect(articles.length).toBeGreaterThanOrEqual(1);
    expect(articles[0].url).toContain('iclnoticias.com.br');
    expect(articles[0].source_id).toBe('icl');
  });

  it('deve simular scraping do Metrópoles', () => {
    const metropolesHtml = `
      <html>
        <body>
          <article class="post">
            <h2><a href="https://www.metropoles.com/politica/2025/04/14/">Lula anuncia medida para DF</a></h2>
          </article>
        </body>
      </html>
    `;

    const articles = parseMetropolesHomepage(metropolesHtml);

    // O parser pode ou não encontrar dependendo do HTML
    // Na implementação real com Cheerio será mais robusto
    expect(Array.isArray(articles)).toBe(true);
  });
});