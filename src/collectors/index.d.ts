import { type RawArticle } from './rss.js';
import { parseG1Feed, fetchG1, G1_SOURCE_ID, G1_NAME, G1_RSS_URL } from './g1.js';
import { parseFolhaFeed, fetchFolha, FOLHA_SOURCE_ID, FOLHA_NAME, FOLHA_RSS_URL } from './folha.js';
import { parseUOLFeed, fetchUOL, UOL_SOURCE_ID, UOL_NAME, UOL_RSS_URL } from './uol.js';
import { parseEstadaoFeed, fetchEstadao, ESTADAO_SOURCE_ID, ESTADAO_NAME, ESTADAO_RSS_URL } from './estadao.js';
import { parseOGloboFeed, fetchOGlobo, OGLOBO_SOURCE_ID, OGLOBO_NAME, OGLOBO_RSS_URL } from './oglobo.js';
import { parseBBCFeed, fetchBBC, BBC_SOURCE_ID, BBC_NAME, BBC_RSS_URL } from './bbc.js';
import { parseReutersFeed, fetchReuters, REUTERS_SOURCE_ID, REUTERS_NAME, REUTERS_RSS_URL } from './reuters.js';
import { parseCNNFeed, fetchCNN, CNN_SOURCE_ID, CNN_NAME, CNN_RSS_URL } from './cnn.js';
import { parseICLHomepage, ICL_SOURCE_ID, ICL_NAME, ICL_URL } from './icl.js';
import { parseMetropolesHomepage, METROPOLES_SOURCE_ID, METROPOLES_NAME, METROPOLES_URL } from './metropoles.js';
export { type RawArticle };
/**
 * Coleta artigos de TODAS as fontes em paralelo.
 * Retorna array combinado de todos os artigos coletados.
 */
export declare function collectAllSources(): Promise<RawArticle[]>;
export declare const SOURCES: readonly [{
    readonly id: "g1";
    readonly name: "G1";
    readonly type: "rss";
    readonly url: "https://g1.globo.com/rss/g1/";
}, {
    readonly id: "folha";
    readonly name: "Folha de S.Paulo";
    readonly type: "rss";
    readonly url: "https://feeds.folha.uol.com.br/emais/rss091.xml";
}, {
    readonly id: "uol";
    readonly name: "UOL";
    readonly type: "rss";
    readonly url: "https://rss.uol.com.br/feed/noticias.xml";
}, {
    readonly id: "estadao";
    readonly name: "Estadão";
    readonly type: "rss";
    readonly url: "https://www.estadao.com.br/ultimas/rss";
}, {
    readonly id: "oglobo";
    readonly name: "O Globo";
    readonly type: "rss";
    readonly url: "https://oglobo.globo.com/rss.xml";
}, {
    readonly id: "bbc";
    readonly name: "BBC Brasil";
    readonly type: "rss";
    readonly url: "https://feeds.bbci.co.uk/portuguese/rss.xml";
}, {
    readonly id: "reuters";
    readonly name: "Reuters";
    readonly type: "rss";
    readonly url: "https://www.reutersagency.com/feed/?taxonomy=markets&post_type=reuters-best";
}, {
    readonly id: "cnn";
    readonly name: "CNN Brasil";
    readonly type: "rss";
    readonly url: "https://www.cnnbrasil.com.br/rss";
}, {
    readonly id: "icl";
    readonly name: "ICL Notícias";
    readonly type: "scrape";
    readonly url: "https://iclnoticias.com.br";
}, {
    readonly id: "metropoles";
    readonly name: "Metrópoles";
    readonly type: "scrape";
    readonly url: "https://www.metropoles.com";
}];
export declare const PARSERS: Record<string, (data: string) => RawArticle[]>;
export declare const FETCHERS: Record<string, () => Promise<RawArticle[]>>;
export { parseG1Feed, fetchG1, G1_SOURCE_ID, G1_NAME, G1_RSS_URL, parseFolhaFeed, fetchFolha, FOLHA_SOURCE_ID, FOLHA_NAME, FOLHA_RSS_URL, parseUOLFeed, fetchUOL, UOL_SOURCE_ID, UOL_NAME, UOL_RSS_URL, parseEstadaoFeed, fetchEstadao, ESTADAO_SOURCE_ID, ESTADAO_NAME, ESTADAO_RSS_URL, parseOGloboFeed, fetchOGlobo, OGLOBO_SOURCE_ID, OGLOBO_NAME, OGLOBO_RSS_URL, parseBBCFeed, fetchBBC, BBC_SOURCE_ID, BBC_NAME, BBC_RSS_URL, parseReutersFeed, fetchReuters, REUTERS_SOURCE_ID, REUTERS_NAME, REUTERS_RSS_URL, parseCNNFeed, fetchCNN, CNN_SOURCE_ID, CNN_NAME, CNN_RSS_URL, parseICLHomepage, ICL_SOURCE_ID, ICL_NAME, ICL_URL, parseMetropolesHomepage, METROPOLES_SOURCE_ID, METROPOLES_NAME, METROPOLES_URL, };
