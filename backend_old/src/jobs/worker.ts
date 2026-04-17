import 'dotenv/config';
import { scrapWorker, analyzeWorker, cyclesWorker } from './queues.js';

console.log('🔧 Workers do Ciclo Notório iniciado');
console.log(`   Scrap worker:    ${scrapWorker.name}`);
console.log(`   Analyze worker:  ${analyzeWorker.name}`);
console.log(`   Cycles worker:   ${cyclesWorker.name}`);

// Graceful shutdown
const shutdown = async () => {
  console.log('\n⏸ Encerrando workers...');
  await scrapWorker.close();
  await analyzeWorker.close();
  await cyclesWorker.close();
  console.log('✅ Workers encerrados');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);