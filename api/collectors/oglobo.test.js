import { describe, it, expect } from 'vitest';
import { parseOGloboFeed, OGLOBO_SOURCE_ID } from './oglobo.js';
describe('O Globo Collector', () => {
    it('deve parsear feed RSS do O Globo', () => {
        const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>O Globo</title>
          <item>
            <title><![CDATA[Rio: Operação policial no Complexo da Maré]]></title>
            <link>https://oglobo.globo.com/rio/operacao-mare/</link>
            <pubDate>Tue, 14 Apr 2025 07:00:00 -0300</pubDate>
          </item>
          <item>
            <title><![CDATA[Brasil: Inflação oficial fica abaixo do esperado]]></title>
            <link>https://oglobo.globo.com/economia/inflacao-ipca/</link>
            <pubDate>Tue, 14 Apr 2025 06:30:00 -0300</pubDate>
          </item>
        </channel>
      </rss>
    `;
        const articles = parseOGloboFeed(xml);
        expect(articles).toHaveLength(2);
        expect(articles[0].source_id).toBe(OGLOBO_SOURCE_ID);
        expect(articles[0].url).toContain('oglobo.globo.com');
    });
});
