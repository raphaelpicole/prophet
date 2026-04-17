import { describe, it, expect } from 'vitest';
import { parseBBCFeed, BBC_SOURCE_ID } from './bbc.js';

describe('BBC Brasil Collector', () => {
  it('deve parsear feed RSS da BBC Brasil', () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>BBC Brasil</title>
          <item>
            <title><![CDATA[Guerra na Ucrânia: Rússia intensifica ofensiva no leste]]></title>
            <link>https://www.bbc.com/portuguese/articles/russia-ucrania-ofensiva</link>
            <pubDate>Tue, 14 Apr 2025 12:00:00 GMT</pubDate>
          </item>
          <item>
            <title><![CDATA[Ciência: Nova descoberta sobre buracos negros]]></title>
            <link>https://www.bbc.com/portuguese/articles/buracos-negros-ciencia</link>
            <pubDate>Tue, 14 Apr 2025 10:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseBBCFeed(xml);

    expect(articles).toHaveLength(2);
    expect(articles[0].source_id).toBe(BBC_SOURCE_ID);
    expect(articles[0].url).toContain('bbc.com');
  });
});