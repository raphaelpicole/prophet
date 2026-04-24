/**
 * Teste de integração completa — API + Supabase
 *
 * Executar: npx tsx src/test-api-integration.ts
 *
 * Este teste:
 * 1. Verifica conexão com Supabase
 * 2. Coleta notícias
 * 3. Insere no banco
 * 4. Chama API localmente
 */
declare function testIntegration(): Promise<void>;
export { testIntegration };
