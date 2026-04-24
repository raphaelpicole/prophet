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
export declare function groupArticlesIntoStories(): Promise<number>;
