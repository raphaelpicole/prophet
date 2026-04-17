import { describe, it, expect } from 'vitest';
import { parseRSS, type RawArticle } from './rss.js';

describe('parseRSS', () => {
  it('deve parsear feed G1 simples', () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss>
        <channel>
          <item>
            <title><![CDATA[Título da notícia]]></title>
            <link>https://g1.globo.com/noticia/1</link>
            <pubDate>Mon, 14 Apr 2025 10:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseRSS(xml, 'g1');

    expect(articles).toHaveLength(1);
    expect(articles[0]).toEqual({
      title: 'Título da notícia',
      url: 'https://g1.globo.com/noticia/1',
      published_at: '2025-04-14T10:00:00.000Z',
      source_id: 'g1',
    });
  });

  it('deve parsear múltiplos itens', () => {
    const xml = `
      <rss>
        <channel>
          <item>
            <title>Notícia 1</title>
            <link>https://example.com/1</link>
          </item>
          <item>
            <title>Notícia 2</title>
            <link>https://example.com/2</link>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseRSS(xml, 'test');

    expect(articles).toHaveLength(2);
    expect(articles[0].title).toBe('Notícia 1');
    expect(articles[1].title).toBe('Notícia 2');
  });

  it('deve ignorar itens sem título ou link', () => {
    const xml = `
      <rss>
        <channel>
          <item>
            <title>Só título</title>
          </item>
          <item>
            <link>só-link.html</link>
          </item>
          <item>
            <title>Válida</title>
            <link>https://example.com/valida</link>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseRSS(xml, 'test');

    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('Válida');
  });

  it('deve decodificar entidades HTML', () => {
    const xml = `
      <rss>
        <channel>
          <item>
            <title>Teste &amp; Exemplo &lt;tag&gt;</title>
            <link>https://example.com/test</link>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseRSS(xml, 'test');

    expect(articles[0].title).toBe('Teste & Exemplo <tag>');
  });

  it('deve retornar array vazio para XML sem itens', () => {
    const xml = `
      <rss>
        <channel>
          <title>Feed vazio</title>
        </channel>
      </rss>
    `;

    const articles = parseRSS(xml, 'test');

    expect(articles).toEqual([]);
  });
});
