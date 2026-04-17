import { createHash } from 'crypto';
/**
 * Deduplicação em 3 camadas (versão sem DB — para testes locais).
 *
 * Camada 1: URL exata — mesma URL = mesma notícia
 * Camada 2: SHA-256 do conteúdo — mesmo texto, URLs diferentes
 * Camada 3: Similaridade de título — comparação simples (levenshtein-like)
 */
export function checkDuplicate(article, existingArticles) {
    // Camada 1: URL
    const urlMatch = existingArticles.find(e => e.url === article.url);
    if (urlMatch) {
        return { isDuplicate: true, reason: 'url', existingId: urlMatch.id };
    }
    // Camada 2: Hash do conteúdo
    const hash = contentHash(article.title + (article.content ?? ''));
    const hashMatch = existingArticles.find(e => e.content_hash === hash);
    if (hashMatch) {
        return { isDuplicate: true, reason: 'hash', existingId: hashMatch.id };
    }
    // Camada 3: Título similar (simplified: normalized equality)
    const normTitle = normalize(article.title);
    const titleMatch = existingArticles.find(e => normalize(e.title) === normTitle);
    if (titleMatch) {
        return { isDuplicate: true, reason: 'title_similarity', existingId: titleMatch.id };
    }
    return { isDuplicate: false, reason: 'new' };
}
/**
 * Processa batch de artigos contra base existente.
 * Retorna separado: novas vs duplicadas.
 */
export function deduplicateBatch(articles, existingArticles) {
    const newArticles = [];
    const duplicates = [];
    for (const article of articles) {
        const result = checkDuplicate(article, existingArticles);
        if (result.isDuplicate) {
            duplicates.push({
                article,
                reason: result.reason,
                existingId: result.existingId,
            });
        }
        else {
            newArticles.push({
                ...article,
                content_hash: contentHash(article.title + (article.content ?? '')),
            });
        }
    }
    return { newArticles, duplicates };
}
export function contentHash(text) {
    return createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}
function normalize(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}
