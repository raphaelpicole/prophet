import { describe, it, expect } from 'vitest';
import { parseEstadaoFeed, ESTADAO_SOURCE_ID } from './estadao.js';

describe('Estadão Collector', () => {
  it('deve parsear feed RSS do Estadão', () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Estadão</title>
          <item>
            <title><![CDATA[Justiça: STF retoma julgamento sobre tributação de heranças]]></title>
            <link>https://www.estadao.com.br/politica/stf-heranca-tributacao/</link>
            <pubDate>Tue, 14 Apr 2025 09:30:00 GMT</pubDate>
          </item>
          <item>
            <title><![CDATA[Internacional: Alemanha aprova pacote de investimentos]]></title>
            <link>https://www.estadao.com.br/internacional/alemanha-investimentos/</link>
            <pubDate>Tue, 14 Apr 2025 08:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseEstadaoFeed(xml);

    expect(articles).toHaveLength(2);
    expect(articles[0].source_id).toBe(ESTADAO_SOURCE_ID);
    expect(articles[1].title).toContain('Alemanha');
  });
});