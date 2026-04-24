import { filterRealNews } from './content-filter.js';
// RSS sources
import { parseG1Feed, fetchG1, G1_SOURCE_ID, G1_NAME, G1_RSS_URL } from './g1.js';
import { parseFolhaFeed, fetchFolha, FOLHA_SOURCE_ID, FOLHA_NAME, FOLHA_RSS_URL } from './folha.js';
import { parseUOLFeed, fetchUOL, UOL_SOURCE_ID, UOL_NAME, UOL_RSS_URL } from './uol.js';
import { parseEstadaoFeed, fetchEstadao, ESTADAO_SOURCE_ID, ESTADAO_NAME, ESTADAO_RSS_URL } from './estadao.js';
import { parseOGloboFeed, fetchOGlobo, OGLOBO_SOURCE_ID, OGLOBO_NAME, OGLOBO_RSS_URL } from './oglobo.js';
import { parseBBCFeed, fetchBBC, BBC_SOURCE_ID, BBC_NAME, BBC_RSS_URL } from './bbc.js';
import { parseReutersFeed, fetchReuters, REUTERS_SOURCE_ID, REUTERS_NAME, REUTERS_RSS_URL } from './reuters.js';
import { parseCNNFeed, fetchCNN, CNN_SOURCE_ID, CNN_NAME, CNN_RSS_URL } from './cnn.js';
// Scraper sources
import { parseICLHomepage, ICL_SOURCE_ID, ICL_NAME, ICL_URL } from './icl.js';
import { parseMetropolesHomepage, METROPOLES_SOURCE_ID, METROPOLES_NAME, METROPOLES_URL } from './metropoles.js';
// Foreign scrapers (sem RSS)
import { fetchAPHTML, AP_SOURCE_ID, fetchAlJazeeraHTML, ALJAZEERA_SOURCE_ID, fetchDWHTML, DW_SOURCE_ID, fetchFrance24HTML, FRANCE24_SOURCE_ID, fetchRTEHTML, RTE_SOURCE_ID, fetchNBCHTML, NBC_SOURCE_ID, } from './foreign-scraper.js';
/**
 * Coleta artigos de TODAS as fontes em paralelo.
 * Retorna array combinado de todos os artigos coletados.
 */
export async function collectAllSources() {
    const results = await Promise.allSettled(Object.entries(FETCHERS).map(async ([sourceId, fetcher]) => {
        try {
            const articles = await fetcher();
            return articles;
        }
        catch (err) {
            console.error(`❌ Erro coletando ${sourceId}:`, err.message);
            return [];
        }
    }));
    const allArticles = [];
    for (const result of results) {
        if (result.status === 'fulfilled') {
            allArticles.push(...result.value);
        }
    }
    // Filtra lifestyle/entretenimento — mantém apenas notícias reais
    return filterRealNews(allArticles);
}
// Source registry
export const SOURCES = [
    { id: G1_SOURCE_ID, name: G1_NAME, type: 'rss', url: G1_RSS_URL },
    { id: FOLHA_SOURCE_ID, name: FOLHA_NAME, type: 'rss', url: FOLHA_RSS_URL },
    { id: UOL_SOURCE_ID, name: UOL_NAME, type: 'rss', url: UOL_RSS_URL },
    { id: ESTADAO_SOURCE_ID, name: ESTADAO_NAME, type: 'rss', url: ESTADAO_RSS_URL },
    { id: OGLOBO_SOURCE_ID, name: OGLOBO_NAME, type: 'rss', url: OGLOBO_RSS_URL },
    { id: BBC_SOURCE_ID, name: BBC_NAME, type: 'rss', url: BBC_RSS_URL },
    { id: REUTERS_SOURCE_ID, name: REUTERS_NAME, type: 'rss', url: REUTERS_RSS_URL },
    { id: CNN_SOURCE_ID, name: CNN_NAME, type: 'rss', url: CNN_RSS_URL },
    { id: ICL_SOURCE_ID, name: ICL_NAME, type: 'scrape', url: ICL_URL },
    { id: METROPOLES_SOURCE_ID, name: METROPOLES_NAME, type: 'scrape', url: METROPOLES_URL },
];
// Parser map for testing
export const PARSERS = {
    [G1_SOURCE_ID]: parseG1Feed,
    [FOLHA_SOURCE_ID]: parseFolhaFeed,
    [UOL_SOURCE_ID]: parseUOLFeed,
    [ESTADAO_SOURCE_ID]: parseEstadaoFeed,
    [OGLOBO_SOURCE_ID]: parseOGloboFeed,
    [BBC_SOURCE_ID]: parseBBCFeed,
    [REUTERS_SOURCE_ID]: parseReutersFeed,
    [CNN_SOURCE_ID]: parseCNNFeed,
    [ICL_SOURCE_ID]: parseICLHomepage,
    [METROPOLES_SOURCE_ID]: parseMetropolesHomepage,
};
// Fetchers for production (network)
export const FETCHERS = {
    [G1_SOURCE_ID]: fetchG1,
    [FOLHA_SOURCE_ID]: fetchFolha,
    [UOL_SOURCE_ID]: fetchUOL,
    [ESTADAO_SOURCE_ID]: fetchEstadao,
    [OGLOBO_SOURCE_ID]: fetchOGlobo,
    [BBC_SOURCE_ID]: fetchBBC,
    [REUTERS_SOURCE_ID]: fetchReuters,
    [CNN_SOURCE_ID]: fetchCNN,
    // Scrapers — implementação básica com fetch + parse
    [ICL_SOURCE_ID]: async () => {
        try {
            const res = await fetch(ICL_URL);
            if (!res.ok)
                return [];
            const html = await res.text();
            return parseICLHomepage(html);
        }
        catch {
            return [];
        }
    },
    [METROPOLES_SOURCE_ID]: async () => {
        try {
            const res = await fetch(METROPOLES_URL);
            if (!res.ok)
                return [];
            const html = await res.text();
            return parseMetropolesHomepage(html);
        }
        catch {
            return [];
        }
    },
    // Foreign scrapers (HTML — sem RSS)
    [AP_SOURCE_ID]: fetchAPHTML,
    [ALJAZEERA_SOURCE_ID]: fetchAlJazeeraHTML,
    [DW_SOURCE_ID]: fetchDWHTML,
    [FRANCE24_SOURCE_ID]: fetchFrance24HTML,
    [RTE_SOURCE_ID]: fetchRTEHTML,
    [NBC_SOURCE_ID]: fetchNBCHTML,
};
// Re-exports individuais
export { 
// G1
parseG1Feed, fetchG1, G1_SOURCE_ID, G1_NAME, G1_RSS_URL, 
// Folha
parseFolhaFeed, fetchFolha, FOLHA_SOURCE_ID, FOLHA_NAME, FOLHA_RSS_URL, 
// UOL
parseUOLFeed, fetchUOL, UOL_SOURCE_ID, UOL_NAME, UOL_RSS_URL, 
// Estadão
parseEstadaoFeed, fetchEstadao, ESTADAO_SOURCE_ID, ESTADAO_NAME, ESTADAO_RSS_URL, 
// O Globo
parseOGloboFeed, fetchOGlobo, OGLOBO_SOURCE_ID, OGLOBO_NAME, OGLOBO_RSS_URL, 
// BBC
parseBBCFeed, fetchBBC, BBC_SOURCE_ID, BBC_NAME, BBC_RSS_URL, 
// Reuters
parseReutersFeed, fetchReuters, REUTERS_SOURCE_ID, REUTERS_NAME, REUTERS_RSS_URL, 
// CNN
parseCNNFeed, fetchCNN, CNN_SOURCE_ID, CNN_NAME, CNN_RSS_URL, 
// ICL
parseICLHomepage, ICL_SOURCE_ID, ICL_NAME, ICL_URL, 
// Metrópoles
parseMetropolesHomepage, METROPOLES_SOURCE_ID, METROPOLES_NAME, METROPOLES_URL, };
