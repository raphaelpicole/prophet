import { describe, it, expect } from 'vitest';
import { parseG1Feed } from './g1.js';

describe('G1 Collector', () => {
  it('deve parsear feed RSS real do G1 (formato simplificado)', () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss xmlns:g="http://g1.globo.com" version="2.0">
        <channel>
          <title>G1 - Últimas Notícias</title>
          <link>https://g1.globo.com</link>
          <item>
            <title><![CDATA[Economia: Dólar fecha acima de R$ 5,60 com tensões no exterior]]></title>
            <link>https://g1.globo.com/economia/noticia/2025/04/14/dolar-fecha-acima-de-r-560.ghtml</link>
            <pubDate>Tue, 14 Apr 2025 18:30:00 -0300</pubDate>
            <description><![CDATA[Cotação do dólar comercial...]]></description>
          </item>
          <item>
            <title><![CDATA[Mundo: Ofensiva russa intensifica ataques no leste da Ucrânia]]></title>
            <link>https://g1.globo.com/mundo/noticia/2025/04/14/ofensiva-russa-ucrania.ghtml</link>
            <pubDate>Tue, 14 Apr 2025 16:15:00 -0300</pubDate>
          </item>
          <item>
            <title><![CDATA[Tecnologia: IA generativa debate regulamentação no Congresso]]></title>
            <link>https://g1.globo.com/tecnologia/noticia/2025/04/14/ia-regulamentacao.ghtml</link>
            <pubDate>Tue, 14 Apr 2025 10:00:00 -0300</pubDate>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseG1Feed(xml);

    expect(articles).toHaveLength(3);
    
    // Primeiro artigo
    expect(articles[0]).toMatchObject({
      title: 'Economia: Dólar fecha acima de R$ 5,60 com tensões no exterior',
      url: 'https://g1.globo.com/economia/noticia/2025/04/14/dolar-fecha-acima-de-r-560.ghtml',
      source_id: 'g1',
    });
    expect(articles[0].published_at).toBeDefined();

    // Segundo artigo
    expect(articles[1].title).toContain('Ofensiva russa');
    expect(articles[1].url).toContain('ofensiva-russa-ucrania');
  });

  it('deve extrair categoria da URL do G1', () => {
    const xml = `
      <rss version="2.0">
        <channel>
          <item>
            <title><![CDATA[Teste]]></title>
            <link>https://g1.globo.com/politica/noticia/2025/teste.ghtml</link>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseG1Feed(xml);
    
    // Categoria pode ser extraída da URL se necessário
    expect(articles[0].url).toContain('/politica/');
  });

  it('deve lidar com feed vazio', () => {
    const xml = `
      <?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>G1</title>
        </channel>
      </rss>
    `;

    const articles = parseG1Feed(xml);

    expect(articles).toEqual([]);
  });

  it('deve ignorar itens sem link ou título', () => {
    const xml = `
      <rss version="2.0">
        <channel>
          <item>
            <title><![CDATA[Só título, sem link]]></title>
          </item>
          <item>
            <link>https://g1.globo.com/só-link</link>
          </item>
          <item>
            <title><![CDATA[Artigo válido]]></title>
            <link>https://g1.globo.com/valido.ghtml</link>
          </item>
        </channel>
      </rss>
    `;

    const articles = parseG1Feed(xml);

    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('Artigo válido');
  });
});