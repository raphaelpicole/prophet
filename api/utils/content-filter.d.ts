/**
 * Content Filter - Filtra notícias por relevância histórica
 *
 * REGRA: Manter apenas notícias que impactam a história da humanidade
 * REMOVER: Celebridades, entretenimento leve, fofocas, reality shows
 * MANTER: Política, economia, conflitos, ciência, saúde, clima, tecnologia disruptiva
 */
/**
 * Verifica se uma notícia é relevante historicamente
 * @returns { isRelevant: boolean, reason: string }
 */
export declare function filterByRelevance(title: string): {
    isRelevant: boolean;
    reason: string;
};
/**
 * Filtra um batch de notícias
 */
export declare function filterBatch(articles: {
    title: string;
    url: string;
}[]): {
    relevant: {
        title: string;
        url: string;
        reason: string;
    }[];
    removed: {
        title: string;
        url: string;
        reason: string;
    }[];
};
/**
 * Categoriza a importância histórica
 */
export declare function categorizeImpact(title: string): {
    category: 'ALTA' | 'MÉDIA' | 'BAIXA' | 'IRRELEVANTE';
    tags: string[];
};
