/**
 * Teste do Analyzer com Ollama
 *
 * Requisitos:
 * 1. Instalar Ollama: https://ollama.com
 * 2. Baixar modelo: ollama pull llama3.2
 * 3. Garantir que está rodando: ollama serve
 *
 * Executar: npx tsx src/test-ollama.ts
 */
declare function testOllama(): Promise<void>;
export { testOllama };
