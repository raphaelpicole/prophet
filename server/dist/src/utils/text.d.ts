/**
 * Gera SHA-256 do conteúdo para deduplicação rápida (antes de embedding).
 * Ponto forte: O(1) — comparação de hash é instantânea vs. embedding.
 */
export declare function contentHash(text: string): string;
/**
 * Normaliza texto: remove acentos, lowercase, collapse whitespace.
 * Usado para comparação de similaridade leve (pg_trgm).
 */
export declare function normalize(text: string): string;
