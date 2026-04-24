/**
 * Filtro de conteúdo — remove artigos que NÃO são notícias reais
 * (estilo de vida, entretenimento, fofoca, etc.)
 */
const BLOCKLIST_KEYWORDS = [
    // Entretenimento / Celebridades
    'celebridade', 'famoso', 'famosos', 'fofoca', 'bastidores',
    'ator', 'atriz', 'cantor', 'cantora', 'banda', 'show',
    'filme', 'série', 'netflix', 'hbo', 'disney',
    // Estilo de vida / Bem-estar
    'horóscopo', 'signo', 'signos', 'astrologia',
    'receita', 'receitas', 'culinária', 'gastronomia', 'cozinha',
    'moda', 'beleza', 'look', 'tendência', 'make',
    'emagrecer', 'dieta', 'fitness', 'academia',
    'decoração', 'casa', 'jardim', 'planta',
    'relacionamento', 'namoro', 'casamento', 'amor', 'sexo',
    'bem-estar', 'meditação', 'yoga', 'spa',
    // Turismo / Lazer
    'turismo', 'viagem', 'viagens', 'hotel', 'resort', 'praia',
    'passeio', 'lazer', 'feriado', 'férias',
    // Esportes (podem ser mantidos, mas vamos filtrar por padrão)
    'futebol', 'gol', 'campeonato', 'brasileirão', 'copa',
    'jogador', 'treinador', 'partida', 'jogo',
    // Outros
    'tutorial', 'dicas de', 'como fazer', 'diy',
    'resenha', 'review', 'unboxing',
    'quiz', 'teste', 'você sabia',
];
const ALLOWLIST_KEYWORDS = [
    // Política
    'política', 'político', 'governo', 'congresso', 'senado', 'câmara',
    'deputado', 'senador', 'presidente', 'ministro', 'ministério',
    'eleição', 'eleições', 'candidato', 'campanha', 'voto', 'urna',
    'partido', 'oposição', 'aliança', 'coalizão',
    'stf', 'supremo', 'judiciário', 'justiça', 'tribunal',
    'lei', 'projeto de lei', 'pec', 'emenda',
    // Economia
    'economia', 'econômico', 'mercado', 'bolsa', 'ibovespa',
    'dólar', 'inflação', 'juros', 'selic', 'bc', 'banco central',
    'pib', 'recessão', 'crise', 'crescimento', 'desemprego',
    'imposto', 'tributo', 'reforma tributária',
    'empresa', 'empresas', 'negócio', 'negócios', 'comércio',
    'indústria', 'agronegócio', 'exportação', 'importação',
    // Conflitos / Mundo
    'guerra', 'conflito', 'ataque', 'bomba', 'míssil',
    'militar', 'exército', 'forças armadas',
    'rússia', 'ucrânia', 'hamas', 'israel', 'gaza',
    'china', 'eua', 'estados unidos', 'união europeia',
    'onu', 'nato', 'otan',
    'terrorismo', 'terrorista', 'ataque terrorista',
    'refugiado', 'crise humanitária',
    // Brasil
    'brasil', 'brasileiro', 'brasileira',
    'região', 'estado', 'município', 'cidade',
    'norte', 'nordeste', 'centro-oeste', 'sudeste', 'sul',
    // Social
    'acidente', 'tragédia', 'desastre', 'enchente', 'incêndio',
    'crime', 'criminalidade', 'polícia', 'investigação',
    'protesto', 'manifestação', 'greve',
    'saúde', 'epidemia', 'pandemia', 'vacina',
    'educação', 'escola', 'universidade',
    'meio ambiente', 'clima', 'aquecimento global',
];
/**
 * Verifica se um artigo é sobre notícias REAIS
 * Retorna true se deve MANTER o artigo
 */
export function isRealNews(article) {
    const text = `${article.title} ${article.content || ''}`.toLowerCase();
    // Se tem palavra da allowlist → mantém (alta confiança)
    const hasAllowlist = ALLOWLIST_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
    if (hasAllowlist)
        return true;
    // Se tem palavra da blocklist → remove
    const hasBlocklist = BLOCKLIST_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
    if (hasBlocklist)
        return false;
    // Se não tem nenhuma das duas → mantém (melhor manter que remover)
    return true;
}
/**
 * Filtra uma lista de artigos, removendo lifestyle/entretenimento
 */
export function filterRealNews(articles) {
    const filtered = articles.filter(isRealNews);
    const removed = articles.length - filtered.length;
    if (removed > 0) {
        console.log(`🗑️  ${removed} artigos removidos (lifestyle/entretenimento)`);
    }
    return filtered;
}
