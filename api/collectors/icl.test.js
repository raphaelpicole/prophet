import { describe, it, expect } from 'vitest';
import { parseICLHomepage, parseICLArticle, ICL_SOURCE_ID } from './icl.js';
describe('ICL Notícias Collector', () => {
    it('deve extrair artigos da homepage do ICL', () => {
        const mockHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>ICL Notícias</title></head>
      <body>
        <article class="post">
          <h2><a href="https://iclnoticias.com.br/2025/04/14/economia-dolar-sobe/">Dólar sobe com tensões externas</a></h2>
          <time datetime="2025-04-14T10:00:00-03:00">14/04/2025</time>
        </article>
        <article class="post">
          <h2><a href="https://iclnoticias.com.br/2025/04/14/politica-lula-reuniao/">Lula se reúne com ministros</a></h2>
          <time datetime="2025-04-14T09:30:00-03:00">14/04/2025</time>
        </article>
        <article class="post">
          <h2><a href="https://iclnoticias.com.br/2025/04/13/mundo-guerra-ucrania/">Guerra na Ucrânia entra em nova fase</a></h2>
          <time datetime="2025-04-13T15:00:00-03:00">13/04/2025</time>
        </article>
      </body>
      </html>
    `;
        const articles = parseICLHomepage(mockHtml);
        expect(articles.length).toBeGreaterThanOrEqual(2);
        expect(articles[0]).toMatchObject({
            title: 'Dólar sobe com tensões externas',
            url: 'https://iclnoticias.com.br/2025/04/14/economia-dolar-sobe/',
            source_id: ICL_SOURCE_ID,
        });
    });
    it('deve parsear artigo individual do ICL', () => {
        const mockArticleHtml = `
      <article>
        <h1 class="entry-title">Análise: Os impactos da alta do dólar na economia brasileira</h1>
        <time datetime="2025-04-14T10:00:00-03:00">14 de abril de 2025</time>
        <div class="entry-content">
          <p>O dólar fechou nesta segunda-feira acima de R$ 5,60...</p>
          <p>Economistas alertam para os impactos...</p>
        </div>
      </article>
    `;
        const result = parseICLArticle(mockArticleHtml);
        expect(result).not.toBeNull();
        expect(result?.title).toBe('Análise: Os impactos da alta do dólar na economia brasileira');
        expect(result?.content).toContain('dólar fechou');
        expect(result?.published_at).toBeDefined();
    });
    it('deve retornar vazio para HTML inválido', () => {
        const invalidHtml = '<html><body>Outro site</body></html>';
        const articles = parseICLHomepage(invalidHtml);
        expect(articles).toEqual([]);
    });
    it('deve lidar com diferentes formatos de data', () => {
        const mockHtml = `
      <article class="post">
        <h2><a href="https://iclnoticias.com.br/2025/04/14/noticia/">Notícia com data ISO</a></h2>
        <time datetime="2025-04-14T14:30:00Z">Publicado em 14 de abril</time>
      </article>
    `;
        const articles = parseICLHomepage(mockHtml);
        expect(articles).toHaveLength(1);
        expect(articles[0].url).toContain('/2025/04/14/');
    });
    it('deve retornar null para artigo sem título', () => {
        const badHtml = '<div class="entry-content"><p>Só conteúdo, sem título</p></div>';
        const result = parseICLArticle(badHtml);
        expect(result).toBeNull();
    });
    it('deve limitar a 20 artigos da homepage', () => {
        let mockHtml = '<html><body>';
        for (let i = 0; i < 30; i++) {
            mockHtml += `
        <article class="post">
          <h2><a href="https://iclnoticias.com.br/2025/04/14/noticia-${i}/">Notícia ${i}</a></h2>
        </article>
      `;
        }
        mockHtml += '</body></html>';
        const articles = parseICLHomepage(mockHtml);
        expect(articles.length).toBeLessThanOrEqual(20);
    });
});
