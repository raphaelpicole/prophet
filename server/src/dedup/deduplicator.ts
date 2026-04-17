import { createHash } from 'crypto';

export interface ArticleInput {
  title: string;
  url: string;
  content?: string;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  reason: 'url' | 'hash' | 'title_similarity' | 'new';
  existingId?: string;
}

/**
 * Deduplicação em 3 camadas (versão sem DB — para testes locais).
 * 
 * Camada 1: URL exata — mesma URL = mesma notícia
 * Camada 2: SHA-256 do conteúdo — mesmo texto, URLs diferentes
 * Camada 3: Similaridade de título — comparação simples (levenshtein-like)
 */
export function checkDuplicate(
  article: ArticleInput,
  existingArticles: { url: string; content_hash: string; title: string; id: string }[]
): DeduplicationResult {
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
export function deduplicateBatch(
  articles: ArticleInput[],
  existingArticles: { url: string; content_hash: string; title: string; id: string }[]
): { newArticles: (ArticleInput & { content_hash: string })[]; duplicates: { article: ArticleInput; reason: string; existingId: string }[] } {
  const newArticles: (ArticleInput & { content_hash: string })[] = [];
  const duplicates: { article: ArticleInput; reason: string; existingId: string }[] = [];

  for (const article of articles) {
    const result = checkDuplicate(article, existingArticles);
    
    if (result.isDuplicate) {
      duplicates.push({
        article,
        reason: result.reason,
        existingId: result.existingId!,
      });
    } else {
      newArticles.push({
        ...article,
        content_hash: contentHash(article.title + (article.content ?? '')),
      });
    }
  }

  return { newArticles, duplicates };
}

export function contentHash(text: string): string {
  return createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
