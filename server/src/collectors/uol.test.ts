import { describe, it, expect } from 'vitest';
import { parseUOLFeed, UOL_SOURCE_ID } from './uol.js';

describe('UOL Collector', () => {
  it('deve parsear feed RSS do UOL', () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>UOL - Últimas Notícias</title>
          <item>
            <title><![CDATA[Saúde: Vacinação contra dengue avança em capitais]]></title>
            <link>https://noticias.uol.com.br/saude/ultimas-noticias/2025/04/14/vacina-dengue.htm</link>
            <pubDate>Tue, 14 Apr 2025 11:00:00 -0300</pubDate>
          </item>
          <item>
            <title><![CDATA[Esporte: Corinthians anuncia novo técnico]]></title>
            <link>https://www.uol.com.br/esporte/futebol/ultimas-noticias/2025/04/14/corinthians-tecnico.htm</link>
            <pubDate>Tue, 14 Apr 2025 10:30:00 -0300</pubDate>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseUOLFeed(xml);

    expect(articles).toHaveLength(2);
    expect(articles[0].source_id).toBe(UOL_SOURCE_ID);
    expect(articles[0].url).toContain('uol.com.br');
  });
});