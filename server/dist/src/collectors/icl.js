/**
 * ICL Notícias — Scraper (não tem RSS público fácil)
 * https://iclnoticias.com.br
 *
 * Padrão de URL: https://iclnoticias.com.br/[YYYY]/[MM]/[DD]/slug/
 * Estrutura: article com h1 título, time data, .entry-content conteúdo
 */
export const ICL_SOURCE_ID = 'icl';
export const ICL_NAME = 'ICL Notícias';
export const ICL_URL = 'https://iclnoticias.com.br';
/**
 * Extrai artigos da página principal do ICL.
 * Na prática, usaria Cheerio para parsear HTML.
 * Versão mockada para testes — simula resposta de scraping.
 */
export function parseICLHomepage(html) {
    // Simulação: na implementação real, usar cheerio para extrair cards de notícia
    // Exemplo de seletores esperados:
    // - container: article.post ou .news-card
    // - título: h1.entry-title ou h2 a
    // - link: a[rel="bookmark"] ou h2 a
    // - data: time.entry-date ou .post-date
    const articles = [];
    // Detectar estrutura básica do HTML
    if (!html.includes('iclnoticias') && !html.includes('ICL')) {
        return articles; // Página inválida ou bloqueada
    }
    // Regex simples para testes — produção usar Cheerio
    const titleMatches = html.matchAll(/<h[12][^>]*>(?:<a[^>]*>)?([^<]+)(?:<\/a>)?<\/h[12]>/gi);
    const linkMatches = html.matchAll(/<a[^>]*href="(https:\/\/iclnoticias\.com\.br\/[^"]+)"/gi);
    const titles = [...titleMatches].map(m => m[1].trim());
    const links = [...linkMatches].map(m => m[1]);
    for (let i = 0; i < Math.min(titles.length, links.length); i++) {
        if (titles[i] && links[i] && links[i].includes('/202')) { // Só URLs com data
            articles.push({
                title: titles[i].replace(/&nbsp;/g, ' '),
                url: links[i],
                source_id: ICL_SOURCE_ID,
            });
        }
    }
    return articles.slice(0, 20); // Limitar aos primeiros 20
}
/**
 * Extrai conteúdo de uma notícia individual do ICL.
 */
export function parseICLArticle(html) {
    const titleMatch = html.match(/<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([^<]+)<\/h1>/i);
    const contentMatch = html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const dateMatch = html.match(/<time[^>]*datetime="([^"]+)"/i);
    if (!titleMatch)
        return null;
    return {
        title: titleMatch[1].trim(),
        content: contentMatch ? cleanHTML(contentMatch[1]).slice(0, 3000) : '',
        published_at: dateMatch ? new Date(dateMatch[1]).toISOString() : undefined,
    };
}
function cleanHTML(html) {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
