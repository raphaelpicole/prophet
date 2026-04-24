/**
 * Teste REAL — coleta notícias de fontes reais
 *
 * Executar: npx tsx src/test-real.ts
 *
 * Este script faz fetch real dos feeds RSS e mostra:
 * - Quantas notícias foram coletadas por fonte
 * - Exemplos de títulos
 * - Deduplicação entre fontes
 * - Análise de categoria (mock)
 */
declare function testRealCollection(): Promise<void>;
export { testRealCollection };
