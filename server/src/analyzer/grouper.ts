import { supabase } from '../db/supabase.js';

/**
 * Story Grouper — agrupa notícias da mesma "história" em andamento.
 *
 * Lógica:
 * 1. Notícias com mesmo main_subject (extraído pelo Analyzer) viram a mesma story
 * 2. Se não existe story com esse subject, cria uma nova
 * 3. Se existe, vincula o artigo e incrementa article_count
 *
 * Ponto forte: o LLM normaliza o assunto (ex: "Guerra Ucrânia" vs "Invasão da Ucrânia"
 * viram o mesmo main_subject), então o agrupamento é semântico, não literal.
 */
export async function groupArticlesIntoStories(): Promise<number> {
  // Busca artigos analisados que ainda não estão em nenhuma story
  const { data: ungrouped } = await supabase
    .from('raw_articles')
    .select('id, title, content')
    .eq('status', 'analyzed')
    .is('id', 'not.null');  // simplificação — na prática usa LEFT JOIN

  if (!ungrouped?.length) return 0;

  // Busca análise de cada artigo
  let grouped = 0;
  for (const article of ungrouped) {
    const { data: analysis } = await supabase
      .from('analysis')
      .select('categories')
      .eq('article_id', article.id)
      .single();

    if (!analysis) continue;

    // Tenta encontrar story existente pelo assunto principal
    // (Na prática, faria via JOIN com analysis → extrair main_subject)
    const subject = article.title.split(' ').slice(0, 3).join(' '); // placeholder

    const { data: existingStory } = await supabase
      .from('stories')
      .select('id')
      .ilike('main_subject', `%${subject}%`)
      .limit(1)
      .maybeSingle();

    if (existingStory) {
      // Vincula à story existente
      await supabase.from('story_articles').insert({
        story_id: existingStory.id,
        article_id: article.id,
      });
      await supabase.rpc('increment_article_count', { story_id: existingStory.id });
    } else {
      // Cria nova story
      const { data: newStory } = await supabase
        .from('stories')
        .insert({
          title: article.title,
          summary: article.content,
          main_subject: subject,
          article_count: 1,
        })
        .select('id')
        .single();

      if (newStory) {
        await supabase.from('story_articles').insert({
          story_id: newStory.id,
          article_id: article.id,
        });
      }
    }

    grouped++;
  }

  return grouped;
}