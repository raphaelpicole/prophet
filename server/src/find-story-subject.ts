import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jtyxsxyesliekbuhgkje.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ'
);

async function findStorySubject() {
  // Lista de palavras para buscar agrupamentos
  const subjects = [
    'Tiago Iorc',
    'Disney', 
    'emprego',
    'preso',
    'acidente',
    'casamento',
    'universidade',
    'morte'
  ];
  
  console.log('🔍 Buscando assuntos com múltiplas notícias...\n');
  
  for (const subject of subjects) {
    const { data: articles, error } = await supabase
      .from('raw_articles')
      .select('id, title, url, source_id, status, summary, collected_at')
      .ilike('title', '%' + subject + '%')
      .eq('status', 'analyzed')
      .order('collected_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log(`Erro em "${subject}":`, error.message);
      continue;
    }
    
    if (articles && articles.length >= 2) {
      console.log('='.repeat(70));
      console.log(`📰 ASSUNTO: "${subject}"`);
      console.log(`📝 ${articles.length} notícias relacionadas`);
      console.log('='.repeat(70) + '\n');
      
      // Buscar análises de todas as notícias
      const articleIds = articles.map(a => a.id);
      const { data: analyses } = await supabase
        .from('analysis')
        .select('*')
        .in('article_id', articleIds);
      
      // Criar mapa de análises
      const analysisMap = new Map();
      analyses?.forEach(a => analysisMap.set(a.article_id, a));
      
      // Mostrar cada notícia com sua análise
      articles.forEach((a, i) => {
        const analysis = analysisMap.get(a.id);
        
        console.log(`${i + 1}. ${a.title}`);
        console.log(`   Fonte: ${a.source_id.substring(0, 8)}... | Data: ${new Date(a.collected_at).toLocaleDateString('pt-BR')}`);
        console.log(`   URL: ${a.url}`);
        
        if (analysis) {
          console.log(`   🧠 Ciclo: ${analysis.cycle || 'N/A'}`);
          console.log(`   ⚖️  Viés: ${analysis.political_bias} (${analysis.bias_score})`);
          console.log(`   😊 Sentimento: ${analysis.sentiment} (${analysis.sentiment_score})`);
          console.log(`   🏷️  Categorias: ${analysis.categories || 'N/A'}`);
          console.log(`   ✅ Confiança: ${(analysis.confidence * 100).toFixed(0)}%`);
        } else {
          console.log('   ⚠️  Sem análise');
        }
        console.log();
      });
      
      // Resumo do Story
      console.log('='.repeat(70));
      console.log('📊 RESUMO DO STORY (simulação manual)');
      console.log('='.repeat(70));
      console.log(`Assunto: ${subject}`);
      console.log(`Notícias: ${articles.length}`);
      console.log(`Fontes: ${[...new Set(articles.map(a => a.source_id))].length} diferentes`);
      
      if (analyses && analyses.length > 0) {
        const cycles = [...new Set(analyses.map(a => a.cycle).filter(Boolean))];
        const sentiments = analyses.map(a => a.sentiment);
        const avgBias = analyses.reduce((sum, a) => sum + (a.bias_score || 0), 0) / analyses.length;
        const avgSentiment = analyses.reduce((sum, a) => sum + (a.sentiment_score || 0), 0) / analyses.length;
        
        console.log(`Ciclos: ${cycles.join(', ') || 'N/A'}`);
        console.log(`Viés médio: ${avgBias.toFixed(2)}`);
        console.log(`Sentimento médio: ${avgSentiment.toFixed(2)}`);
        console.log(`Sentimentos: ${sentiments.join(', ')}`);
      }
      
      console.log('='.repeat(70) + '\n');
      
      // Retorna o primeiro assunto encontrado com 2+ notícias
      return { subject, articles, analyses };
    }
  }
  
  console.log('Nenhum assunto com múltiplas notícias encontrado');
}

findStorySubject().catch(console.error);
