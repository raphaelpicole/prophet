import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkDuplicate, deduplicateBatch, contentHash } from './deduplicator.js';
import type { ArticleInput } from './deduplicator.js';

describe('Deduplicator - Edge Cases', () => {
  it('deve lidar com títulos muito similares mas não idênticos', () => {
    const existingArticles = [
      { id: '1', url: 'https://test.com/a', title: 'Dólar sobe forte', content_hash: 'hash1' },
    ];

    // Mesma notícia com pequena variação
    const article1: ArticleInput = {
      url: 'https://test.com/b',
      title: 'Dolar sobe forte', // sem acento
    };

    // Notícia diferente
    const article2: ArticleInput = {
      url: 'https://test.com/c',
      title: 'Dólar cai hoje', // assunto diferente
    };

    const result1 = checkDuplicate(article1, existingArticles);
    const result2 = checkDuplicate(article2, existingArticles);

    // Primeiro: detecta similaridade (normalização remove acento)
    expect(result1.isDuplicate).toBe(true);
    expect(result1.reason).toBe('title_similarity');

    // Segundo: é nova
    expect(result2.isDuplicate).toBe(false);
    expect(result2.reason).toBe('new');
  });

  it('deve lidar com base de dados vazia', () => {
    const article: ArticleInput = {
      url: 'https://test.com/novo',
      title: 'Qualquer coisa',
    };

    const result = checkDuplicate(article, []);

    expect(result.isDuplicate).toBe(false);
    expect(result.reason).toBe('new');
  });

  it('deve gerar hash consistente independente de maiúsculas/minúsculas', () => {
    const hash1 = contentHash('Texto Teste');
    const hash2 = contentHash('TEXTO TESTE');
    const hash3 = contentHash('texto teste');

    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  it('deve gerar hash consistente independente de espaços', () => {
    // contentHash já faz trim() e normalize de espaços
    const hash1 = contentHash('  Texto Teste  ');
    const hash2 = contentHash('texto teste');

    expect(hash1).toBe(hash2);
  });

  it('deve processar batch grande eficientemente', () => {
    const existing: { url: string; content_hash: string; title: string; id: string }[] = [];
    for (let i = 0; i < 100; i++) {
      existing.push({
        id: String(i),
        url: `https://test.com/existente-${i}`,
        title: `Título ${i}`,
        content_hash: contentHash(`conteudo ${i}`),
      });
    }

    const articles: ArticleInput[] = [
      { url: 'https://test.com/nova', title: 'Título novo' },
      { url: 'https://test.com/existente-5', title: 'Qualquer' }, // duplicada por URL
      { url: 'https://test.com/outra', title: 'Título 10' }, // duplicada por título
    ];

    const start = Date.now();
    const result = deduplicateBatch(articles, existing);
    const duration = Date.now() - start;

    expect(result.newArticles).toHaveLength(1);
    expect(result.duplicates).toHaveLength(2);
    expect(duration).toBeLessThan(50); // rápido mesmo com muitos existentes
  });

  it('deve lidar com títulos em diferentes idiomas', () => {
    const existingArticles = [
      { id: '1', url: 'https://test.com/en', title: 'Breaking News', content_hash: 'hash1' },
    ];

    const articles: ArticleInput[] = [
      { url: 'https://test.com/es', title: 'Últimas Noticias' },
      { url: 'https://test.com/fr', title: 'Dernières Nouvelles' },
    ];

    const results = deduplicateBatch(articles, existingArticles);

    // Todos devem ser considerados novos (títulos diferentes)
    expect(results.newArticles).toHaveLength(2);
    expect(results.duplicates).toHaveLength(0);
  });

  it('deve lidar com conteúdo muito grande', () => {
    const bigContent = 'a'.repeat(100000); // 100KB de conteúdo
    
    const article: ArticleInput = {
      url: 'https://test.com/big',
      title: 'Big Article',
      content: bigContent,
    };

    const start = Date.now();
    const hash = contentHash(article.title + article.content);
    const duration = Date.now() - start;

    expect(hash).toHaveLength(64);
    expect(duration).toBeLessThan(10); // SHA-256 é rápido
  });

  it('deve priorizar URL > hash > título', () => {
    // Se URL bate, deve retornar 'url' mesmo se hash também bateria
    const existingArticles = [
      { 
        id: '1', 
        url: 'https://test.com/mesma-url', 
        title: 'Título Diferente', 
        content_hash: contentHash('conteudo diferente') 
      },
    ];

    const article: ArticleInput = {
      url: 'https://test.com/mesma-url',
      title: 'Título Teste',
      content: 'conteudo teste',
    };

    const result = checkDuplicate(article, existingArticles);

    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toBe('url'); // Primeira verificação
  });
});