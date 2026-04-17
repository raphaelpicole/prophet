/**
 * Teste do Pipeline Completo
 * 
 * Executar: npx tsx src/test-pipeline.ts
 */

import { runPipeline } from './pipeline/worker.js';

async function testPipeline() {
  console.log('\n🧪 TESTE DO PIPELINE COMPLETO\n');
  
  try {
    const result = await runPipeline();
    
    console.log('\n📋 Detalhes por fonte:');
    result.details.forEach(d => {
      console.log(`\n   ${d.source}:`);
      console.log(`      Coletadas: ${d.collected}`);
      console.log(`      Inseridas: ${d.inserted}`);
      if (d.errors.length > 0) {
        console.log(`      Erros: ${d.errors.length}`);
        d.errors.forEach(e => console.log(`         - ${e}`));
      }
    });
    
  } catch (err: any) {
    console.error('\n❌ Erro:', err.message);
  }
}

testPipeline().catch(console.error);
