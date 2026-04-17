/**
 * Content Filter - Filtra notícias por relevância histórica
 * 
 * REGRA: Manter apenas notícias que impactam a história da humanidade
 * REMOVER: Celebridades, entretenimento leve, fofocas, reality shows
 * MANTER: Política, economia, conflitos, ciência, saúde, clima, tecnologia disruptiva
 */

// Palavras-chave que indicam NOTÍCIAS IRRELEVANTES (celebridades/entretenimento)
const CELEBRITY_KEYWORDS = [
  // Pessoas específicas do entretenimento
  'Tiago Iorc', 'Anitta', 'Ludmilla', 'Ivete Sangalo', 'Xuxa', 'Silvio Santos',
  'Faustão', 'Luciano Huck', 'Angélica', 'Fátima Bernardes', 'William Bonner',
  'Globo', 'Galvão Bueno', 'Casagrande', 'Tiê', 'Adriana Calcanhotto',
  
  // Categorias de entretenimento
  'reality show', 'Big Brother', 'BBB', 'A Fazenda', 'De Férias com o Ex',
  'casamento de famosos', 'festa de famosos', 'look do dia', 'moda das celebridades',
  'barraco', 'treta', 'polêmica de famosos', 'separação de', 'namoro de',
  
  // Música/Arte leve (apenas quando não é sobre política cultural)
  'show de', 'turnê', 'álbum novo', 'lançamento do cantor',
];

// Palavras-chave que indicam NOTÍCIAS RELEVANTES (história da humanidade)
const RELEVANT_KEYWORDS = [
  // Política e Governança
  'governo', 'Lula', 'Bolsonaro', 'Congresso', 'Senado', 'Câmara', 'STF',
  'eleições', 'votação', 'impeachment', 'reforma', 'PEC', 'PL', 'decreto',
  'ministério', 'ministro', 'presidente', 'governador', 'prefeito',
  
  // Economia e Desenvolvimento
  'economia', 'inflação', 'juros', 'Selic', 'dólar', 'IBGE', 'PIB',
  'desemprego', 'emprego', 'trabalho', 'renda', 'salário mínimo',
  'bolsa', 'mercado', 'B3', 'Banco Central', 'fazenda', 'tributária',
  
  // Conflitos e Segurança Global
  'guerra', 'conflito', 'Israel', 'Palestina', 'Ucrânia', 'Rússia',
  'ataque', 'bombardeio', 'exército', 'militar', 'defesa', 'OTAN',
  'terrorismo', 'ataque terrorista', 'sequestro',
  
  // Ciência e Saúde
  'pandemia', 'COVID', 'vacina', 'doença', 'epidemia', 'Saúde',
  'OMS', 'hospital', 'SUS', 'pesquisa científica', 'descoberta',
  'mudanças climáticas', 'aquecimento global', 'Amazônia', 'desmatamento',
  'crise hídrica', 'secas', 'enchentes', 'desastres naturais',
  
  // Tecnologia Disruptiva
  'inteligência artificial', 'IA', 'ChatGPT', 'OpenAI', 'Google AI',
  'regulamentação de IA', 'privacidade digital', 'cibersegurança',
  'hacker', 'ataque cibernético', 'vazamento de dados',
  
  // Justiça e Direitos
  'condenação', 'processo', 'denúncia', 'corrupção', 'lava jato',
  'direitos humanos', 'desigualdade', 'racismo', 'violência',
  
  // Educação e Futuro
  'educação', 'universidade', 'ENEM', 'pesquisa', 'inovação',
  'energia renovável', 'petróleo', 'mineração',
];

/**
 * Verifica se uma notícia é relevante historicamente
 * @returns { isRelevant: boolean, reason: string }
 */
export function filterByRelevance(title: string): { isRelevant: boolean; reason: string } {
  const lowerTitle = title.toLowerCase();
  
  // CHECK 1: Verificar se é celebridade/entretenimento
  for (const keyword of CELEBRITY_KEYWORDS) {
    if (lowerTitle.includes(keyword.toLowerCase())) {
      return {
        isRelevant: false,
        reason: `Celebridade/Entretenimento: "${keyword}"`,
      };
    }
  }
  
  // CHECK 2: Verificar se tem relevância histórica
  for (const keyword of RELEVANT_KEYWORDS) {
    if (lowerTitle.includes(keyword.toLowerCase())) {
      return {
        isRelevant: true,
        reason: `Relevante: "${keyword}"`,
      };
    }
  }
  
  // CHECK 3: Caso não identificado → NEUTRO (deixa passar para análise manual)
  return {
    isRelevant: true,
    reason: 'Não classificado (neutro)',
  };
}

/**
 * Filtra um batch de notícias
 */
export function filterBatch(articles: { title: string; url: string }[]): {
  relevant: { title: string; url: string; reason: string }[];
  removed: { title: string; url: string; reason: string }[];
} {
  const relevant: { title: string; url: string; reason: string }[] = [];
  const removed: { title: string; url: string; reason: string }[] = [];
  
  for (const article of articles) {
    const result = filterByRelevance(article.title);
    
    if (result.isRelevant) {
      relevant.push({ ...article, reason: result.reason });
    } else {
      removed.push({ ...article, reason: result.reason });
    }
  }
  
  return { relevant, removed };
}

/**
 * Categoriza a importância histórica
 */
export function categorizeImpact(title: string): {
  category: 'ALTA' | 'MÉDIA' | 'BAIXA' | 'IRRELEVANTE';
  tags: string[];
} {
  const lowerTitle = title.toLowerCase();
  const tags: string[] = [];
  
  // ALTA: Eventos que mudam o mundo
  const altaKeywords = [
    'guerra', 'conflito armado', 'ataque nuclear', 'invasão',
    'pandemia mundial', 'crise econômica global', 'mudanças climáticas',
    'eleições presidenciais', 'impeachment', 'golpe',
  ];
  
  for (const kw of altaKeywords) {
    if (lowerTitle.includes(kw)) {
      tags.push(kw);
      return { category: 'ALTA', tags };
    }
  }
  
  // MÉDIA: Importante nacionalmente
  const mediaKeywords = [
    'economia', 'desemprego', 'inflação', 'reforma',
    'vacina', 'saúde pública', 'educação', 'violência',
    'desmatamento', 'meio ambiente',
  ];
  
  for (const kw of mediaKeywords) {
    if (lowerTitle.includes(kw)) {
      tags.push(kw);
      return { category: 'MÉDIA', tags };
    }
  }
  
  // BAIXA: Importante localmente
  if (lowerTitle.includes('acidente') || lowerTitle.includes('crime')) {
    return { category: 'BAIXA', tags: ['local'] };
  }
  
  // IRRELEVANTE: Celebridades
  for (const kw of CELEBRITY_KEYWORDS) {
    if (lowerTitle.includes(kw.toLowerCase())) {
      return { category: 'IRRELEVANTE', tags: ['celebridade'] };
    }
  }
  
  return { category: 'MÉDIA', tags: ['não classificado'] };
}
