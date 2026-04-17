import { describe, it, expect } from 'vitest';
import { checkDuplicate, deduplicateBatch, contentHash } from './deduplicator.js';
import type { ArticleInput } from './deduplicator.js';

describe('checkDuplicate', () => {
  const existingArticles = [
    { id: '1', url: 'https://example.com/noticia-1', title: 'Título Original', content_hash: contentHash('título original') },
    { id: '2', url: 'https://example.com/noticia-2', title: 'Outra Notícia', content_hash: contentHash('outra notícia') },
  ];

  it('deve detectar duplicata por URL', () => {
    const article: ArticleInput = {
      url: 'https://example.com/noticia-1',
      title: 'Título Diferente',
    };

    const result = checkDuplicate(article, existingArticles);

    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toBe('url');
    expect(result.existingId).toBe('1');
  });

  it('deve detectar duplicata por hash de conteúdo', () => {
    const article: ArticleInput = {
      url: 'https://example.com/noticia-3',
      title: 'Título Original',
    };

    const result = checkDuplicate(article, existingArticles);

    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toBe('hash');
    expect(result.existingId).toBe('1');
  });

  it('deve detectar duplicata por título similar (normalizado)', () => {
    // Criar artigo existente COM conteúdo para não bater no hash
    const existingWithContent = [
      { id: '1', url: 'https://example.com/noticia-1', title: 'Título Original', content_hash: contentHash('conteúdo original diferente') },
      { id: '2', url: 'https://example.com/noticia-2', title: 'Outra Notícia', content_hash: contentHash('outra notícia') },
    ];
    
    const article: ArticleInput = {
      url: 'https://example.com/noticia-4',
      title: 'TÍTULO ORIGINAL', // maiúsculo
      content: 'conteúdo novo diferente', // conteúdo diferente
    };

    const result = checkDuplicate(article, existingWithContent);

    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toBe('title_similarity');
    expect(result.existingId).toBe('1');
  });

  it('deve aceitar notícia nova', () => {
    const article: ArticleInput = {
      url: 'https://example.com/novidade',
      title: 'Título Completamente Novo',
    };

    const result = checkDuplicate(article, existingArticles);

    expect(result.isDuplicate).toBe(false);
    expect(result.reason).toBe('new');
    expect(result.existingId).toBeUndefined();
  });
});

describe('deduplicateBatch', () => {
  const existingArticles = [
    { id: '1', url: 'https://example.com/existente', title: 'Existente', content_hash: contentHash('existente') },
  ];

  it('deve separar novas e duplicatas corretamente', () => {
    const articles: ArticleInput[] = [
      { url: 'https://example.com/nova-1', title: 'Nova Notícia 1' },
      { url: 'https://example.com/existente', title: 'Título Diferente' }, // duplicata
      { url: 'https://example.com/nova-2', title: 'Nova Notícia 2' },
    ];

    const result = deduplicateBatch(articles, existingArticles);

    expect(result.newArticles).toHaveLength(2);
    expect(result.duplicates).toHaveLength(1);
    
    expect(result.newArticles[0].title).toBe('Nova Notícia 1');
    expect(result.newArticles[1].title).toBe('Nova Notícia 2');
    expect(result.duplicates[0].article.title).toBe('Título Diferente');
    expect(result.duplicates[0].reason).toBe('url');
  });

  it('deve gerar content_hash para novas artigos', () => {
    const articles: ArticleInput[] = [
      { url: 'https://example.com/nova', title: 'Teste' },
    ];

    const result = deduplicateBatch(articles, existingArticles);

    expect(result.newArticles[0].content_hash).toBeDefined();
    expect(result.newArticles[0].content_hash).toHaveLength(64); // SHA-256 hex
  });
});

describe('contentHash', () => {
  it('deve gerar hash consistente para mesmo texto', () => {
    const hash1 = contentHash('Teste');
    const hash2 = contentHash('Teste');
    
    expect(hash1).toBe(hash2);
  });

  it('deve ser case-insensitive', () => {
    const hash1 = contentHash('TESTE');
    const hash2 = contentHash('teste');
    
    expect(hash1).toBe(hash2);
  });

  it('deve gerar hashes diferentes para textos diferentes', () => {
    const hash1 = contentHash('Texto A');
    const hash2 = contentHash('Texto B');
    
    expect(hash1).not.toBe(hash2);
  });
});
