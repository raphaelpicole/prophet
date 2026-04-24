import { describe, it, expect } from 'vitest';
import { parseRSS } from '../collectors/rss.js';
import { deduplicateBatch } from '../dedup/deduplicator.js';
import { mockAnalyze } from '../analyzer/mock-analyzer.js';
/**
 * Teste de integração: simula o pipeline completo localmente.
 * Sem banco de dados, sem network externa.
 */
describe('Pipeline Completo (Mock)', () => {
    it('deve processar feed RSS completo: coleta → dedup → análise', () => {
        // 1. SIMULAR FEED RSS DO G1
        const rssXml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss xmlns:g="http://g1.globo.com" version="2.0">
        <channel>
          <item>
            <title><![CDATA[Dólar fecha acima de R$ 5,60 com tensões no exterior]]></title>
            <link>https://g1.globo.com/economia/noticia/2025/04/14/dolar-fecha-acima-de-r-560.ghtml</link>
            <pubDate>Tue, 14 Apr 2025 18:30:00 -0300</pubDate>
          </item>
          <item>
            <title><![CDATA[Ofensiva russa intensifica ataques no leste da Ucrânia]]></title>
            <link>https://g1.globo.com/mundo/noticia/2025/04/14/ofensiva-russa-ucrania.ghtml</link>
            <pubDate>Tue, 14 Apr 2025 16:15:00 -0300</pubDate>
          </item>
          <item>
            <title><![CDATA[Dólar fecha acima de R$ 5,60 com tensões no exterior]]></title>
            <link>https://g1.globo.com/economia/noticia/2025/04/14/dolar-outro-link.ghtml</link>
            <pubDate>Tue, 14 Apr 2025 18:45:00 -0300</pubDate>
          </item>
          <item>
            <title><![CDATA[Vacinação contra dengue avança em capitais do Sudeste]]></title>
            <link>https://g1.globo.com/saude/noticia/2025/04/14/vacina-dengue.ghtml</link>
            <pubDate>Tue, 14 Apr 2025 12:00:00 -0300</pubDate>
          </item>
        </channel>
      </rss>
    `;
        // 2. COLETAR
        const articles = parseRSS(rssXml, 'g1');
        expect(articles).toHaveLength(4);
        expect(articles[0].title).toBe('Dólar fecha acima de R$ 5,60 com tensões no exterior');
        // 3. DEDUPLICAR (contra base vazia inicialmente)
        let existingArticles = [];
        let result = deduplicateBatch(articles, existingArticles);
        // Primeira rodada: tudo é novo
        expect(result.newArticles).toHaveLength(4);
        expect(result.duplicates).toHaveLength(0);
        // Simular que esses artigos foram salvos no "banco"
        existingArticles = result.newArticles.map((a, i) => ({
            id: String(i + 1),
            url: a.url,
            title: a.title,
            content_hash: a.content_hash,
        }));
        // 4. SIMULAR NOVA COLETA COM DUPLICATA
        const rssXml2 = `
      <rss>
        <channel>
          <!-- MESMO TÍTULO, URL DIFERENTE (duplicata de conteúdo) -->
          <item>
            <title><![CDATA[Dólar fecha acima de R$ 5,60 com tensões no exterior]]></title>
            <link>https://g1.globo.com/economia/noticia/2025/04/14/dolar-agencia-estado.ghtml</link>
          </item>
          <!-- URL IDÊNTICA (duplicata óbvia) -->
          <item>
            <title><![CDATA[Título diferente]]></title>
            <link>https://g1.globo.com/mundo/noticia/2025/04/14/ofensiva-russa-ucrania.ghtml</link>
          </item>
          <!-- NOVO ARTIGO -->
          <item>
            <title><![CDATA[IA generativa debate regulamentação no Congresso]]></title>
            <link>https://g1.globo.com/tecnologia/noticia/2025/04/14/ia-regulamentacao.ghtml</link>
          </item>
        </channel>
      </rss>
    `;
        const newArticles = parseRSS(rssXml2, 'g1');
        result = deduplicateBatch(newArticles, existingArticles);
        expect(result.newArticles).toHaveLength(1); // só o IA é novo
        expect(result.duplicates).toHaveLength(2);
        expect(result.duplicates[0].reason).toBe('hash'); // mesmo conteúdo
        expect(result.duplicates[1].reason).toBe('url'); // mesma URL
        // 5. ANALISAR
        const toAnalyze = result.newArticles.map(a => ({
            id: '999',
            title: a.title,
            source_id: 'g1',
        }));
        const analysis = mockAnalyze(toAnalyze[0]);
        expect(analysis.cycle).toBe('tecnologico');
        expect(analysis.categories).toContain('tecnologico');
        expect(analysis.confidence).toBeGreaterThan(0);
    });
    it('deve categorizar corretamente diferentes tipos de notícias', () => {
        const testCases = [
            { title: 'Guerra na Ucrânia: novos ataques no leste', expectedCycle: 'conflito' },
            { title: 'Dengue avança e preocupa autoridades de saúde', expectedCycle: 'pandemia' },
            { title: 'Dólar cai e Bolsa sobe com dados econômicos', expectedCycle: 'economico' },
            { title: 'Lula sanciona projeto de lei importante', expectedCycle: 'politico' },
            { title: 'ChatGPT ganha novas funcionalidades de IA', expectedCycle: 'tecnologico' },
            { title: 'Crise no meio ambiente: desmatamento bate recorde', expectedCycle: 'ambiental' },
        ];
        for (const tc of testCases) {
            const analysis = mockAnalyze({ id: '1', title: tc.title, source_id: 'test' });
            expect(analysis.cycle).toBe(tc.expectedCycle);
        }
    });
    it('deve detectar sentimento positivo vs negativo', () => {
        const positive = mockAnalyze({ id: '1', title: 'Economia cresce e desemprego cai para mínima histórica', source_id: 'test' });
        expect(positive.sentiment).toBe('positivo');
        expect(positive.sentiment_score).toBeGreaterThan(0);
        const negative = mockAnalyze({ id: '2', title: 'Crise financeira traz preocupação ao mercado', source_id: 'test' });
        expect(negative.sentiment).toBe('negativo');
        expect(negative.sentiment_score).toBeLessThan(0);
        const neutral = mockAnalyze({ id: '3', title: 'Reunião ministerial discute agenda legislativa', source_id: 'test' });
        expect(neutral.sentiment).toBe('neutro');
        expect(neutral.sentiment_score).toBe(0);
    });
});
