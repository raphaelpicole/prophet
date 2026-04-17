import { describe, it, expect } from 'vitest';
import { parseReutersFeed, REUTERS_SOURCE_ID } from './reuters.js';

describe('Reuters Collector', () => {
  it('deve parsear feed RSS da Reuters', () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Reuters Top News</title>
          <item>
            <title><![CDATA[Oil prices rise on Middle East tensions]]></title>
            <link>https://www.reuters.com/business/energy/oil-prices-mideast-2025-04-14/</link>
            <pubDate>Tue, 14 Apr 2025 14:00:00 GMT</pubDate>
          </item>
          <item>
            <title><![CDATA[Tech giants report strong quarterly earnings]]></title>
            <link>https://www.reuters.com/technology/tech-earnings-q1-2025/</link>
            <pubDate>Tue, 14 Apr 2025 13:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseReutersFeed(xml);

    expect(articles).toHaveLength(2);
    expect(articles[0].source_id).toBe(REUTERS_SOURCE_ID);
    expect(articles[0].url).toContain('reuters.com');
  });
});