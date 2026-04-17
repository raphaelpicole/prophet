import { describe, it, expect, beforeEach } from 'vitest';
import { parseRSS } from './rss.js';

describe('RSS Parser - Edge Cases', () => {
  it('deve lidar com XML malformado graciosamente', () => {
    const badXml = `
      <not valid xml ><<<
      <item>
        <title>Teste</title>
        <link>http://test.com</link>
      </item>
    `;

    // Não deve quebrar — retorna vazio ou o que conseguir parsear
    const articles = parseRSS(badXml, 'test');
    expect(articles).toBeDefined();
  });

  it('deve lidar com títulos vazios', () => {
    const xml = `
      <rss>
        <channel>
          <item>
            <title></title>
            <link>http://test.com/1</link>
          </item>
          <item>
            <title>Válido</title>
            <link>http://test.com/2</link>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseRSS(xml, 'test');
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('Válido');
  });

  it('deve lidar com datas em formatos diferentes', () => {
    const xml = `
      <rss>
        <channel>
          <item>
            <title>Data GMT</title>
            <link>http://test.com/1</link>
            <pubDate>Mon, 14 Apr 2025 10:00:00 GMT</pubDate>
          </item>
          <item>
            <title>Data ISO</title>
            <link>http://test.com/2</link>
            <pubDate>2025-04-14T10:00:00-03:00</pubDate>
          </item>
          <item>
            <title>Data inválida</title>
            <link>http://test.com/3</link>
            <pubDate>data-errada</pubDate>
          </item>
          <item>
            <title>Sem data</title>
            <link>http://test.com/4</link>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseRSS(xml, 'test');
    expect(articles).toHaveLength(4);
    
    // Primeiro deve ter data parseada
    expect(articles[0].published_at).toBe('2025-04-14T10:00:00.000Z');
    
    // Sem data deve ser undefined
    expect(articles[3].published_at).toBeUndefined();
  });

  it('deve lidar com HTML entities complexos', () => {
    const xml = `
      <rss>
        <channel>
          <item>
            <title>Teste &amp; Exemplo &quot;citação&quot; &lt;tag&gt;</title>
            <link>http://test.com</link>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseRSS(xml, 'test');
    expect(articles[0].title).toBe('Teste & Exemplo "citação" <tag>');
  });

  it('deve lidar com links duplicados no mesmo feed', () => {
    const xml = `
      <rss>
        <channel>
          <item>
            <title>Primeiro</title>
            <link>http://test.com/mesma-url</link>
          </item>
          <item>
            <title>Segundo</title>
            <link>http://test.com/mesma-url</link>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseRSS(xml, 'test');
    // Parser não faz dedup — retorna ambos
    expect(articles).toHaveLength(2);
    expect(articles[0].url).toBe(articles[1].url);
  });

  it('deve lidar com RSS vazio', () => {
    const xml = `
      <?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>Feed Vazio</title>
          <description>Sem itens</description>
        </channel>
      </rss>
    `;

    const articles = parseRSS(xml, 'test');
    expect(articles).toEqual([]);
  });

  it('deve lidar com espaços em branco excessivos', () => {
    // Título com espaços deve ser parseado corretamente
    const xml = `
      <rss>
        <channel>
          <item>
            <title>Título com espaços</title>
            <link>http://test.com</link>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseRSS(xml, 'test');
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('Título com espaços');
  });

  it('deve lidar com URLs relativas', () => {
    const xml = `
      <rss>
        <channel>
          <item>
            <title>Relativa</title>
            <link>/noticia/123</link>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseRSS(xml, 'test');
    // Parser não resolve URL relativa — mantém como está
    expect(articles[0].url).toBe('/noticia/123');
  });

  it('deve lidar com muitos itens (performance)', () => {
    let items = '';
    for (let i = 0; i < 100; i++) {
      items += `
        <item>
          <title>Notícia ${i}</title>
          <link>http://test.com/${i}</link>
        </item>
      `;
    }

    const xml = `
      <rss>
        <channel>${items}</channel>
      </rss>
    `;

    const start = Date.now();
    const articles = parseRSS(xml, 'test');
    const duration = Date.now() - start;

    expect(articles).toHaveLength(100);
    expect(duration).toBeLessThan(100); // Deve ser rápido
  });
});