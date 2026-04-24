import { parseRSS } from './rss.js';
/**
 * O Globo — RSS Feed
 * https://oglobo.globo.com
 */
export const OGLOBO_SOURCE_ID = 'oglobo';
export const OGLOBO_NAME = 'O Globo';
export const OGLOBO_RSS_URL = 'https://oglobo.globo.com/rss.xml';
export function parseOGloboFeed(xml) {
    return parseRSS(xml, OGLOBO_SOURCE_ID);
}
export async function fetchOGlobo() {
    // Tenta com User-Agent para evitar bloqueio
    try {
        const response = await fetch(OGLOBO_RSS_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            },
        });
        if (!response.ok) {
            console.log(`      ⚠️ O Globo HTTP ${response.status}`);
            return [];
        }
        const xml = await response.text();
        return parseRSS(xml, OGLOBO_SOURCE_ID);
    }
    catch (e) {
        console.log(`      ❌ O Globo: ${e.message}`);
        return [];
    }
}
