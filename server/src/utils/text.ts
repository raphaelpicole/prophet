import { createHash } from 'crypto';

/**
 * Gera SHA-256 do conteúdo para deduplicação rápida (antes de embedding).
 * Ponto forte: O(1) — comparação de hash é instantânea vs. embedding.
 */
export function contentHash(text: string): string {
  return createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

/**
 * Normaliza texto: remove acentos, lowercase, collapse whitespace.
 * Usado para comparação de similaridade leve (pg_trgm).
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}