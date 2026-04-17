/**
 * Teste rápido das novas fontes
 */

import { fetchOGlobo } from './collectors/oglobo.js';
import { parseICLHomepage } from './collectors/icl.js';

async function test() {
  console.log('=== Testando O Globo ===');
  try {
    const oglobo = await fetchOGlobo();
    console.log('O Globo:', oglobo.length, 'notícias');
    if (oglobo.length > 0) {
      console.log('Primeira:', oglobo[0].title.substring(0, 60));
    } else {
      console.log('⚠️ Nenhuma notícia retornada');
    }
  } catch (e: any) {
    console.log('❌ Erro O Globo:', e.message);
  }

  console.log('\n=== Testando ICL ===');
  try {
    const response = await fetch('https://iclnoticias.com.br', { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await response.text();
    console.log('HTML size:', html.length);
    console.log('Contains iclnoticias:', html.includes('iclnoticias'));
    
    const icl = parseICLHomepage(html);
    console.log('ICL:', icl.length, 'notícias');
    if (icl.length > 0) {
      console.log('Primeira:', icl[0].title.substring(0, 60));
    } else {
      console.log('⚠️ Nenhuma notícia parseada');
    }
  } catch (e: any) {
    console.log('❌ Erro ICL:', e.message);
  }
}

test();
