import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jtyxsxyesliekbuhgkje.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ'
);

async function createManualStory() {
  console.log('🎬 CRIANDO STORY MANUALMENTE\n');
  console.log('='.repeat(70));
  console.log('Este script simula como o Prophet criaria um Story');
  console.log('='.repeat(70) + '\n');

  // 1. IDENTIFICAR NOTÍCIAS RELACIONADAS
  console.log('📍 ETAPA 1: Identificar notícias relacionadas');
  console.log('-'.repeat(70));
  
  const { data: articles } = await supabase
    .from('raw_articles')
    .select('id, title, url, source_id, summary, collected_at')
    .ilike('title', '%Tiago Iorc%')
    .eq('status', 'analyzed')
    .order('collected_at', { ascending: false });

  if (!articles || articles.length === 0) {
    console.log('❌ Nenhuma notícia encontrada');
    return;
  }

  console.log(`✅ ${articles.length} notícias encontradas sobre "Tiago Iorc"\n`);
  
  articles.forEach((a, i) => {
    console.log(`  ${i + 1}. "${a.title}"`);
    console.log(`     Fonte: ${a.source_id.substring(0, 8)}...`);
    console.log(`     URL: ${a.url?.substring(0, 60)}...`);
    console.log();
  });

  // 2. BUSCAR ANÁLISES
  console.log('📍 ETAPA 2: Coletar análises das notícias');
  console.log('-'.repeat(70));
  
  const articleIds = articles.map(a => a.id);
  const { data: analyses } = await supabase
    .from('analysis')
    .select('*')
    .in('article_id', articleIds);

  const analysisMap = new Map();
  analyses?.forEach(a => analysisMap.set(a.article_id, a));

  console.log(`✅ ${analyses?.length || 0} análises encontradas\n`);

  // 3. CRIAR O STORY
  console.log('📍 ETAPA 3: Criar Story agregado');
  console.log('-'.repeat(70));
  
  // Título do story = assunto principal
  const storyTitle = 'Tiago Iorc fala sobre hiato na carreira e entrevista no g1';
  const storySubject = 'Tiago Iorc carreira hiato entrevista';
  
  // Gerar resumo agregado
  const summaries = articles.map(a => analysisMap.get(a.id)?.summary || a.title).filter(Boolean);
  const storySummary = summaries.join(' ').substring(0, 200) + '...';
  
  // Ciclo predominante
  const cycles = analyses?.map(a => a.cycle).filter(Boolean) || [];
  const mainCycle = cycles.length > 0 
    ? cycles.sort((a, b) => cycles.filter(v => v === a).length - cycles.filter(v => v === b).length).pop()
    : 'cultural';

  console.log('Dados do Story:');
  console.log(`  📰 Título: "${storyTitle}"`);
  console.log(`  📝 Resumo: "${storySummary}"`);
  console.log(`  🎯 Assunto: "${storySubject}"`);
  console.log(`  🔄 Ciclo: ${mainCycle}`);
  console.log(`  📊 Notícias: ${articles.length}`);
  console.log();

  // 4. INSERIR NO BANCO
  console.log('📍 ETAPA 4: Persistir no banco');
  console.log('-'.repeat(70));
  
  const { data: newStory, error: insertError } = await supabase
    .from('stories')
    .insert({
      title: storyTitle,
      summary: storySummary,
      main_subject: storySubject,
      cycle: mainCycle,
      article_count: articles.length,
    })
    .select()
    .single();

  if (insertError) {
    console.log('❌ Erro ao criar story:', insertError.message);
    return;
  }

  console.log(`✅ Story criado com ID: ${newStory.id}`);
  console.log();

  // 5. VINCULAR ARTIGOS AO STORY
  console.log('📍 ETAPA 5: Vincular notícias ao Story');
  console.log('-'.repeat(70));
  
  for (const article of articles) {
    const { error: linkError } = await supabase
      .from('story_articles')
      .insert({
        story_id: newStory.id,
        article_id: article.id,
      });

    if (linkError) {
      console.log(`  ⚠️ Erro ao vincular ${article.id.substring(0, 8)}: ${linkError.message}`);
    } else {
      console.log(`  ✅ Vinculado: ${article.title.substring(0, 50)}...`);
    }
  }

  console.log();

  // 6. RESUMO FINAL
  console.log('='.repeat(70));
  console.log('📊 STORY CRIADO COM SUCESSO');
  console.log('='.repeat(70));
  console.log(`ID: ${newStory.id}`);
  console.log(`Título: ${newStory.title}`);
  console.log(`Assunto: ${newStory.main_subject}`);
  console.log(`Ciclo: ${newStory.cycle}`);
  console.log(`Notícias: ${articles.length}`);
  console.log(`Criado em: ${new Date(newStory.started_at).toLocaleString('pt-BR')}`);
  console.log('='.repeat(70));

  // 7. MOSTRAR COMO O APP EXIBIRIA
  console.log('\n📱 COMO O APP EXIBIRIA ESTE STORY:');
  console.log('-'.repeat(70));
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│  📰 Tiago Iorc fala sobre hiato na carreira...              │');
  console.log('│                                                             │');
  console.log('│  📝 Resumo: Tiago Iorc diz que pausa no auge...            │');
  console.log('│                                                             │');
  console.log('│  📊 2 notícias | 🔄 Ciclo: Cultural                        │');
  console.log('│                                                             │');
  console.log('│  📰 Fontes:                                                │');
  console.log('│     • G1 - "Tiago Iorc diz que pausa..."                   │');
  console.log('│     • G1 - "Tiago Iorc é entrevistado..."                  │');
  console.log('│                                                             │');
  console.log('│  🕐 Última atualização: 14/04/2026                         │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log();
}

createManualStory().catch(console.error);
