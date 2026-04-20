const SUPABASE_URL = 'https://jtyxsxyesliekbuhgkje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const events = [
  // CONFLITO
  { id: 'a0000001-0000-0000-0000-000000000001', name: 'Anexação da Crimeia (2014)', description: 'Rússia anexou a Crimeia após referendum considerado ilegítimo pela comunidade internacional.', event_date: '2014-03-18T00:00:00Z', outcome: 'Sanções globais contra Rússia, tensão geopolítica duradoura entre Ocidente e Kremlin', significance: 5, cycle_type: 'conflito', region: 'RU' },
  { id: 'a0000001-0000-0000-0000-000000000002', name: 'Invasão do Iraque (2003)', description: 'Coalizão liderada pelos EUA invadiu o Iraque para derrubar Saddam Hussein.', event_date: '2003-03-20T00:00:00Z', outcome: 'Instabilidade regional prolongada, morte de Saddam, ascensão do extremismo', significance: 5, cycle_type: 'conflito', region: 'ME' },
  { id: 'a0000001-0000-0000-0000-000000000003', name: 'Guerra do Yom Kippur (1973)', description: 'Coalizão árabe atacou Israel no dia do Yom Kippur, causando conflito masivo.', event_date: '1973-10-06T00:00:00Z', outcome: 'Embargo petrolífero árabe, crise econômica global, acordo de paz posterior', significance: 4, cycle_type: 'conflito', region: 'ME' },
  { id: 'a0000001-0000-0000-0000-000000000004', name: 'Guerra na Síria (2011-presente)', description: 'Guerra civil na Síria entre regime de Assad e rebeldes, envolvendo múltiplas potências.', event_date: '2011-03-15T00:00:00Z', outcome: 'Mais de 500 mil mortos, crise migratória europeia, intervenção militar estrangeira', significance: 5, cycle_type: 'conflito', region: 'ME' },
  { id: 'a0000001-0000-0000-0000-000000000005', name: 'Desmembramento da Iugoslávia (1991-1999)', description: 'Separação violenta da Iugoslávia em múltiplos estados, incluindo limpeza étnica.', event_date: '1991-06-25T00:00:00Z', outcome: 'Criação de novos estados, genocídio em Kosovo, intervenção da NATO', significance: 5, cycle_type: 'conflito', region: 'EU' },
  { id: 'a0000001-0000-0000-0000-000000000006', name: 'Guerra Russo-Ucraniana (2022-presente)', description: 'Rússia invadiu a Ucrânia em fevereiro de 2022, conflito mais sério da Europa desde WWII.', event_date: '2022-02-24T00:00:00Z', outcome: 'Milhares de mortos, milhões de refugiados, sanções massivas à Russia', significance: 5, cycle_type: 'conflito', region: 'RU' },
  { id: 'a0000001-0000-0000-0000-000000000007', name: 'Attentados de 11 de Setembro (2001)', description: 'Ataques terroristas coordenados contra World Trade Center e Pentágono.', event_date: '2001-09-11T00:00:00Z', outcome: 'Guerra ao Terror, invasões no Afeganistão e Iraque, vigilância em massa', significance: 5, cycle_type: 'conflito', region: 'US' },

  // ECONOMICO
  { id: 'a0000002-0000-0000-0000-000000000001', name: 'Crise Financeira Global (2008)', description: 'Colapso do sistema financeiro global após crise imobiliária nos EUA.', event_date: '2008-09-15T00:00:00Z', outcome: 'Recessão global, pacote de estímulo governamental, reformas regulatórias', significance: 5, cycle_type: 'economico', region: 'US' },
  { id: 'a0000002-0000-0000-0000-000000000002', name: 'Plano Real (1994)', description: 'Brasil implementou plano de estabilização econômica coordenado por Fernando Henrique Cardoso.', event_date: '1994-07-01T00:00:00Z', outcome: 'Hiperinflação controlada, moeda estável, crescimento econômico sustentado', significance: 5, cycle_type: 'economico', region: 'BR' },
  { id: 'a0000002-0000-0000-0000-000000000003', name: 'Crise da Dívida Europeia (2010)', description: 'Países do Euro, especialmente Grécia, enfrentaram crise de dívida soberana.', event_date: '2010-04-27T00:00:00Z', outcome: 'Austeridade na Europa, crescimento do Eurocepticismo, rescates financeiros', significance: 4, cycle_type: 'economico', region: 'EU' },
  { id: 'a0000002-0000-0000-0000-000000000004', name: 'Crise Asiática (1997)', description: 'Colapso financeiro em países do Sudeste Asiático devido a especulação cambial.', event_date: '1997-07-02T00:00:00Z', outcome: 'Recessão regional, reformas econômicas, criação de mecanismos do FMI', significance: 4, cycle_type: 'economico', region: 'AS' },
  { id: 'a0000002-0000-0000-0000-000000000005', name: 'Black Monday (1987)', description: 'Queda de 22% na bolsa americana em um único dia, maior crash da história.', event_date: '1987-10-19T00:00:00Z', outcome: 'Circuit breakers criados, intervenção do Fed, volatilidade persistente', significance: 4, cycle_type: 'economico', region: 'US' },
  { id: 'a0000002-0000-0000-0000-000000000006', name: 'Crise do Petróleo (1973)', description: 'OPEP quadruplicou preços do petróleo, causando estagflação no Ocidente.', event_date: '1973-10-17T00:00:00Z', outcome: 'Estagflação, mudança para carros eficientes, energia nuclear', significance: 5, cycle_type: 'economico', region: 'GLOBAL' },
  { id: 'a0000002-0000-0000-0000-000000000007', name: 'Grande Depressão (1929)', description: 'Colapso econômico global após crash da bolsa de NY em 1929.', event_date: '1929-10-29T00:00:00Z', outcome: 'Desemprego em massa, New Deal, Segunda Guerra Mundial', significance: 5, cycle_type: 'economico', region: 'US' },

  // POLITICO
  { id: 'a0000003-0000-0000-0000-000000000001', name: 'Eleição de Trump (2016)', description: 'Donald Trump venceu Hillary Clinton na eleição presidencial americana surpreendente.', event_date: '2016-11-08T00:00:00Z', outcome: 'Polarização política nos EUA, políticas restritivas, tensão com aliados', significance: 5, cycle_type: 'politico', region: 'US' },
  { id: 'a0000003-0000-0000-0000-000000000002', name: 'Eleição de Bolsonaro (2018)', description: 'Jair Bolsonaro venceu eleição presidencial brasileira com plataforma de direita.', event_date: '2018-10-28T00:00:00Z', outcome: 'Polarização política, reformas econômicas, tensão diplomática', significance: 5, cycle_type: 'politico', region: 'BR' },
  { id: 'a0000003-0000-0000-0000-000000000003', name: 'Retorno de Lula (2022)', description: 'Lula venceu eleição presidencial brasileira, retornando ao poder após prisão.', event_date: '2022-10-30T00:00:00Z', outcome: 'Reequilíbrio político, volta do bolsa família, demanda por justiça social', significance: 5, cycle_type: 'politico', region: 'BR' },
  { id: 'a0000003-0000-0000-0000-000000000004', name: 'Brexit (2016)', description: 'Reino Unido votou para sair da União Europeia em referendo histórico.', event_date: '2016-06-23T00:00:00Z', outcome: 'Negociações complexas, impacto econômico inicial, reordenamento político', significance: 5, cycle_type: 'politico', region: 'EU' },
  { id: 'a0000003-0000-0000-0000-000000000005', name: 'Eleição de Macron (2017)', description: 'Emmanuel Macron venceu eleição francesa, partidos tradicionais colapsaram.', event_date: '2017-05-07T00:00:00Z', outcome: 'Macronismo, reformas trabalhistas, amarela', significance: 4, cycle_type: 'politico', region: 'EU' },
  { id: 'a0000003-0000-0000-0000-000000000006', name: 'Impeachment de Dilma (2016)', description: 'Dilma Rousseff foi afastada da presidência brasileira por crimes de responsabilidade.', event_date: '2016-08-31T00:00:00Z', outcome: 'Vice presidente Temer assumiu, austerity, Lava Jato prosseguiu', significance: 4, cycle_type: 'politico', region: 'BR' },

  // SOCIAL
  { id: 'a0000004-0000-0000-0000-000000000001', name: 'Pandemia COVID-19 (2020)', description: 'Coronavirus se espalhou globalmente, forçando lockdowns em todo o mundo.', event_date: '2020-03-11T00:00:00Z', outcome: 'Milhões de mortes, vacinas récord, transformação digital acelerada', significance: 5, cycle_type: 'social', region: 'GLOBAL' },
  { id: 'a0000004-0000-0000-0000-000000000002', name: 'Primavera Árabe (2011)', description: 'Onda de protestos e revoltas no mundo árabe contra regimes autoritários.', event_date: '2011-01-17T00:00:00Z', outcome: 'Guerra civil na Síria, Egito teve dois golpes, Tunísia transitionou', significance: 5, cycle_type: 'social', region: 'ME' },
  { id: 'a0000004-0000-0000-0000-000000000003', name: 'Movimento Black Lives Matter (2013)', description: 'Movimento contra violência policial e racismo sistemico nos EUA.', event_date: '2013-07-13T00:00:00Z', outcome: 'Debate nacional sobre raça, reformas policiais, estátuas removidas', significance: 4, cycle_type: 'social', region: 'US' },
  { id: 'a0000004-0000-0000-0000-000000000004', name: 'Gripe Espanhola (1918)', description: 'Pandemia de gripe matou dezenas de milhões em todo o mundo.', event_date: '1918-03-04T00:00:00Z', outcome: 'Mudanças em saúde pública, Organização da Saúde criada após 20 anos', significance: 5, cycle_type: 'social', region: 'GLOBAL' },
  { id: 'a0000004-0000-0000-0000-000000000005', name: 'Crise dos Refugiados (2015)', description: 'Milhões de sírios e outros fugiram para Europa, causando crise política.', event_date: '2015-09-02T00:00:00Z', outcome: 'Ascensão de partidos populistas na Europa, acordos com Turquía, muros', significance: 4, cycle_type: 'social', region: 'EU' },
  { id: 'a0000004-0000-0000-0000-000000000006', name: 'Movimento Occupy Wall Street (2011)', description: 'Protestos contra desigualdade econômica e sistema financeiro.', event_date: '2011-09-17T00:00:00Z', outcome: 'Debate sobre desigualdade, 1% vs 99%, impacto duradouro na política', significance: 4, cycle_type: 'social', region: 'US' },

  // TECNOLOGICO
  { id: 'a0000005-0000-0000-0000-000000000001', name: 'Lançamento do ChatGPT (2022)', description: 'OpenAI lançou ChatGPT, revolucionando o cenário de IA conversacional.', event_date: '2022-11-30T00:00:00Z', outcome: 'Corrida de IA, investimentos bilionários, debates sobre regulamentação', significance: 5, cycle_type: 'tecnologico', region: 'US' },
  { id: 'a0000005-0000-0000-0000-000000000002', name: 'Vazamentos da NSA (2013)', description: 'Edward Snowden revelou programas de vigilância massiva do governo americano.', event_date: '2013-06-05T00:00:00Z', outcome: 'Debate global sobre privacidade, reforms, asilo de Snowden na Russia', significance: 5, cycle_type: 'tecnologico', region: 'US' },
  { id: 'a0000005-0000-0000-0000-000000000003', name: 'Lançamento do iPhone (2007)', description: 'Apple lançou primeiro iPhone, iniciando era do smartphone moderno.', event_date: '2007-01-09T00:00:00Z', outcome: 'Revolução mobile, declínio de PCs, ecossistema de apps', significance: 5, cycle_type: 'tecnologico', region: 'US' },
  { id: 'a0000005-0000-0000-0000-000000000004', name: 'Embargo de Semicondutores (2022)', description: 'EUA restringiram exportação de chips avançados para China.', event_date: '2022-10-07T00:00:00Z', outcome: 'Corrida tecnológica China-EUA, investimentos em chips, reformulação de supply chain', significance: 5, cycle_type: 'tecnologico', region: 'CN' },
  { id: 'a0000005-0000-0000-0000-000000000005', name: 'Colapso do Silicon Valley Bank (2023)', description: 'Terceira maior falência bancária na história dos EUA, afetou setor de tecnologia.', event_date: '2023-03-10T00:00:00Z', outcome: 'Crise de confiança em bancos regionais, regulação aumentada', significance: 4, cycle_type: 'tecnologico', region: 'US' },
  { id: 'a0000005-0000-0000-0000-000000000006', name: 'Ataque SolarWinds (2020)', description: 'Ataque hacker sofisticado comprometendo agências governamentais dos EUA.', event_date: '2020-12-13T00:00:00Z', outcome: 'Reforço de cibersegurança, sanções à Russia, repensar supply chain', significance: 4, cycle_type: 'tecnologico', region: 'US' },

  // AMBIENTAL
  { id: 'a0000006-0000-0000-0000-000000000001', name: 'Acordo de Paris (2015)', description: '195 países concordaram em limitar aquecimento global a 1.5°C.', event_date: '2015-12-12T00:00:00Z', outcome: 'Compromissos nacionais, transição energética, financiamento climático', significance: 5, cycle_type: 'ambiental', region: 'GLOBAL' },
  { id: 'a0000006-0000-0000-0000-000000000002', name: 'Incêndios na Amazônia (2019)', description: 'Onda massiva de incêndios na floresta amazônica drew atenção global.', event_date: '2019-08-10T00:00:00Z', outcome: 'Crise diplomática Brasil-EU, pressão por proteção, conscientização', significance: 4, cycle_type: 'ambiental', region: 'BR' },
  { id: 'a0000006-0000-0000-0000-000000000003', name: 'Desastre de Fukushima (2011)', description: 'Tsunami causou meltdown nuclear em Fukushima, Japão.', event_date: '2011-03-11T00:00:00Z', outcome: 'Fim da energia nuclear em muitos países, segurança nuclear reforçada', significance: 5, cycle_type: 'ambiental', region: 'AS' },
  { id: 'a0000006-0000-0000-0000-000000000004', name: 'Movimento Greta Thunberg (2019)', description: 'Greve escolar climática de adolescentes se tornou movimento global.', event_date: '2019-08-20T00:00:00Z', outcome: 'Conscientização jovem, políticas climáticas aceleradas, ativismo mainstream', significance: 4, cycle_type: 'ambiental', region: 'EU' },
  { id: 'a0000006-0000-0000-0000-000000000005', name: 'Vazamento de óleo da BP (2010)', description: 'Explosão na plataforma Deepwater Horizon causando maior desastre ambiental marinho dos EUA.', event_date: '2010-04-20T00:00:00Z', outcome: 'Moratória em perfuração, regulação mais rígida, impacto em comunidades pesqueiras', significance: 4, cycle_type: 'ambiental', region: 'US' },
  { id: 'a0000006-0000-0000-0000-000000000006', name: 'Ondas de Calor na Europa (2022)', description: 'Verão extremo com temperaturas acima de 40°C em todo o continente.', event_date: '2022-07-19T00:00:00Z', outcome: 'Mortos, seca, incêndios florestais, rethink sobre infraestrutura', significance: 4, cycle_type: 'ambiental', region: 'EU' },

  // CULTURAL
  { id: 'a0000007-0000-0000-0000-000000000001', name: 'Revolução do Streaming (2013)', description: 'Netflix transformou-se de DVD por correio para streaming, disruptando Hollywood.', event_date: '2013-02-01T00:00:00Z', outcome: 'Colapso de Blockbuster, cord-cutting, produção original de streaming', significance: 4, cycle_type: 'cultural', region: 'US' },
  { id: 'a0000007-0000-0000-0000-000000000002', name: 'Cannes vs Netflix (2017)', description: 'Festival de Cannes proibiu filmes sem exibição teatral, conflito sobre cinema.', event_date: '2017-05-28T00:00:00Z', outcome: 'Debate sobre preservação cinematográfica, Netflix investiu em filmes autorais', significance: 3, cycle_type: 'cultural', region: 'EU' },
  { id: 'a0000007-0000-0000-0000-000000000003', name: 'Sucesso de Gangnam Style (2012)', description: 'Vídeo viral sul-coreano tornou-se primeiro no YouTube a atingir 1 bilhão de views.', event_date: '2012-07-15T00:00:00Z', outcome: 'K-pop como fenômeno global, soft power da Corea, BTS e outros', significance: 3, cycle_type: 'cultural', region: 'AS' },
  { id: 'a0000007-0000-0000-0000-000000000004', name: 'Escândalo Weinstein (2017)', description: 'Produtor de Hollywood Harvey Weinstein exposto por assédio e agressão sexual sistemática.', event_date: '2017-10-05T00:00:00Z', outcome: 'Movimento #MeToo, reformas em Hollywood, responsabilização de poderosos', significance: 5, cycle_type: 'cultural', region: 'US' },
  { id: 'a0000007-0000-0000-0000-000000000005', name: 'Copa do Mundo 2014 (Brasil)', description: 'Brasil sediou a Copa do Mundo, evento global de maior audiência.', event_date: '2014-06-12T00:00:00Z', outcome: 'Manifestações populares, investimento público vs social, humilhação 7-1', significance: 4, cycle_type: 'cultural', region: 'BR' },
];

async function seed() {
  console.log('Seeding historical events...');
  let inserted = 0;
  for (const event of events) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/historical_events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
      });
      if (r.ok) {
        inserted++;
        console.log(`  ✅ ${event.name}`);
      } else {
        const err = await r.text();
        console.log(`  ❌ ${event.name}: ${err.slice(0, 80)}`);
      }
    } catch (e) {
      console.log(`  ❌ ${event.name}: ${e.message}`);
    }
  }
  console.log(`\nTotal inserted: ${inserted}/${events.length}`);
}

seed();