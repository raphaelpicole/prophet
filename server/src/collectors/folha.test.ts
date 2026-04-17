import { describe, it, expect } from 'vitest';
import { parseFolhaFeed, FOLHA_SOURCE_ID } from './folha.js';

describe('Folha Collector', () => {
  it('deve parsear feed RSS da Folha', () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="0.91">
        <channel>
          <title>Folha de S.Paulo</title>
          <item>
            <title><![CDATA[Política: Reforma tributária avança no Congresso]]></title>
            <link>https://www.folha.uol.com.br/poder/2025/04/reforma-tributaria.shtml</link>
            <pubDate>Tue, 14 Apr 2025 09:00:00 GMT</pubDate>
          </item>
          <item>
            <title><![CDATA[Cultura: Novo filme brasileiro estreia em Cannes]]></title>
            <link>https://www.folha.uol.com.br/ilustrada/2025/04/cannes-brasil.shtml</link>
            <pubDate>Tue, 14 Apr 2025 08:30:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseFolhaFeed(xml);

    expect(articles).toHaveLength(2);
    expect(articles[0]).toMatchObject({
      title: 'Política: Reforma tributária avança no Congresso',
      url: 'https://www.folha.uol.com.br/poder/2025/04/reforma-tributaria.shtml',
      source_id: FOLHA_SOURCE_ID,
    });
  });

  it('deve extrair seção da URL', () => {
    const xml = `
      <rss version="0.91">
        <channel>
          <item>
            <title>Teste</title>
            <link>https://www.folha.uol.com.br/mercado/2025/economia.shtml</link>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseFolhaFeed(xml);

    expect(articles[0].url).toContain('/mercado/');
  });
});