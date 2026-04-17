import { describe, it, expect } from 'vitest';
import { parseCNNFeed, CNN_SOURCE_ID } from './cnn.js';

describe('CNN Brasil Collector', () => {
  it('deve parsear feed RSS da CNN Brasil', () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>CNN Brasil</title>
          <item>
            <title><![CDATA[AO VIVO: Congresso analisa novas medidas econômicas]]></title>
            <link>https://www.cnnbrasil.com.br/politica/congresso-medidas-economicas/</link>
            <pubDate>Tue, 14 Apr 2025 15:00:00 -0300</pubDate>
          </item>
          <item>
            <title><![CDATA[Saúde: Novo tratamento para câncer mostra resultados promissores]]></title>
            <link>https://www.cnnbrasil.com.br/saude/novo-tratamento-cancer/</link>
            <pubDate>Tue, 14 Apr 2025 14:00:00 -0300</pubDate>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseCNNFeed(xml);

    expect(articles).toHaveLength(2);
    expect(articles[0].source_id).toBe(CNN_SOURCE_ID);
    expect(articles[0].url).toContain('cnnbrasil.com.br');
  });
});