-- ============================================================
-- Migration 007: Seed Historical Events
-- ============================================================

INSERT INTO historical_events (id, title, description, date_start, date_end, subject_ids, region_ids) VALUES

  -- GEOPOLÍTICA / CONFLITOS
  (
    'c0000001-0000-0000-0000-000000000001',
    'Anexação da Crimeia pela Rússia',
    'A Federação Russa anexou a Península da Crimeia após um referendum considerado ilegítimo pela comunidade internacional. A annexation veio após meses de tensão no Euromaidan e resultou em sanções ocidentais sem precedentes contra a Rússia.',
    '2014-02-20', '2014-03-18',
    ARRAY['b0000001-0000-0000-0000-000000000001'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid],
    ARRAY['a7b8c9d0-0008-0000-0000-000000000008'::uuid, 'a7b8c9d0-0007-0000-0000-000000000007'::uuid]
  ),
  (
    'c0000002-0000-0000-0000-000000000002',
    'Guerra Geórgia-Ossétia do Sul / Abkhazia',
    'Conflito armado entre Geórgia e Rússia pelo controle das regiões separatistas da Ossétia do Sul e Abkhazia. Rusia interviu militarmente e ocupou partes do território georgiano.',
    '2008-08-01', '2008-08-12',
    ARRAY['a0000001-0000-0000-0000-000000000001'::uuid],
    ARRAY['a7b8c9d0-0008-0000-0000-000000000008'::uuid]
  ),
  (
    'c0000003-0000-0000-0000-000000000003',
    'Crise dos Mísseis de Cuba',
    'Confrontação geopolítica entre EUA e URSS quando mísseis soviéticos foram instalados em Cuba. O mundo chegou perto de uma guerra nuclear. Concluiu com a remoção dos mísseis em troca de garantias dos EUA.',
    '1962-10-16', '1962-10-28',
    ARRAY['a0000001-0000-0000-0000-000000000001'::uuid],
    ARRAY['f6a7b8c9-0002-0000-0000-000000000002'::uuid]
  ),
  (
    'c0000004-0000-0000-0000-000000000004',
    'Invasão russa da Ukraine (2022)',
    'A Federação Russa launchou uma invasão em grande escala da Ukraine, a maior operação militar convencional na Europa desde a Segunda Guerra Mundial.',
    '2022-02-24', NULL,
    ARRAY['b0000001-0000-0000-0000-000000000001'::uuid, 'b0000016-0000-0000-0000-000000000016'::uuid],
    ARRAY['a7b8c9d0-0008-0000-0000-000000000008'::uuid, 'a7b8c9d0-0007-0000-0000-000000000007'::uuid]
  ),
  (
    'c0000005-0000-0000-0000-000000000005',
    'Anschluss da Áustria',
    'Anexação da Áustria pela Alemanha Nazista sob a chancelaria de Kurt Schuschnigg e pressão de Adolf Hitler.',
    '1938-03-12', '1938-03-13',
    ARRAY['b0000016-0000-0000-0000-000000000016'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid],
    ARRAY['a7b8c9d0-0002-0000-0000-000000000002'::uuid]
  ),

  -- ECONOMIA
  (
    'c0000006-0000-0000-0000-000000000006',
    'Crise Financeira Global (2008)',
    'Colapso do Lehman Brothers triggerou a maior crise financeira desde 1929. Originado no mercado subprime americano, o contágio spread para todo o sistema financeiro global.',
    '2008-09-15', '2009-06-01',
    ARRAY['a0000002-0000-0000-0000-000000000002'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid],
    ARRAY['f6a7b8c9-0002-0000-0000-000000000002'::uuid, 'a7b8c9d0-0001-0000-0000-000000000001'::uuid]
  ),
  (
    'c0000007-0000-0000-0000-000000000007',
    'Grande Depressão (1929)',
    'Colapso da Bolsa de Nova York em outubro de 1929 triggerou a maior depressão económica do século XX. Produção industrial caiu 50%, desemprego chegou a 25%.',
    '1929-10-29', '1939-01-01',
    ARRAY['b0000008-0000-0000-0000-000000000008'::uuid, 'a0000002-0000-0000-0000-000000000002'::uuid],
    ARRAY['f6a7b8c9-0002-0000-0000-000000000002'::uuid]
  ),
  (
    'c0000008-0000-0000-0000-000000000008',
    'Plano Real e estabilização do Brasil',
    'Implementação do Plano Real pelo governo Itamar Franco. Hiperinflação brasileira (IPCA mensal de 50%+) foi eliminada.',
    '1993-12-01', '1994-07-01',
    ARRAY['b0000005-0000-0000-0000-000000000005'::uuid, 'a0000005-0000-0000-0000-000000000005'::uuid],
    ARRAY['f6a7b8c9-0001-0000-0000-000000000001'::uuid]
  ),
  (
    'c0000009-0000-0000-0000-000000000009',
    'Choque do Petróleo (1973)',
    'Embargo petrolífero árabe contra os EUA e aliados ocidentais, quadruplicando o preço do petróleo. Causou estagflação global.',
    '1973-10-17', '1974-03-01',
    ARRAY['b0000013-0000-0000-0000-000000000013'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid],
    ARRAY['f6a7b8c9-0002-0000-0000-000000000002'::uuid, 'c9d0e1f2-0004-0000-0000-000000000004'::uuid]
  ),

  -- SAÚDE / PANDEMIAS
  (
    'c0000010-0000-0000-0000-000000000010',
    'Pandemia de COVID-19',
    'Sars-CoV-2 se spread globalmente a partir de Wuhan, China. A OMS declared emergência internacional em janeiro de 2020 e caracterizou como pandemia em março de 2020.',
    '2020-01-30', '2023-05-05',
    ARRAY['b0000017-0000-0000-0000-000000000017'::uuid, 'a0000006-0000-0000-0000-000000000006'::uuid],
    ARRAY['b8c9d0e1-0001-0000-0000-000000000001'::uuid, 'f6a7b8c9-0002-0000-0000-000000000002'::uuid]
  ),
  (
    'c0000011-0000-0000-0000-000000000011',
    'Gripe Espanhola (1918)',
    'Pandemia de influenza H1N1 que infectou um terço da população mundial e matou entre 50-100 milhões de pessoas.',
    '1918-02-01', '1920-04-01',
    ARRAY['a0000006-0000-0000-0000-000000000006'::uuid],
    ARRAY['f6a7b8c9-0002-0000-0000-000000000002'::uuid]
  ),

  -- TECNOLOGIA
  (
    'c0000012-0000-0000-0000-000000000012',
    'Lançamento do ChatGPT (OpenAI)',
    'OpenAI lançou o ChatGPT em 30 de novembro de 2022. Em 2 meses alcançou 100 milhões de usuários.',
    '2022-11-30', NULL,
    ARRAY['b0000009-0000-0000-0000-000000000009'::uuid, 'a0000003-0000-0000-0000-000000000003'::uuid],
    ARRAY['f6a7b8c9-0002-0000-0000-000000000002'::uuid]
  ),
  (
    'c0000013-0000-0000-0000-000000000013',
    'Embargo de semicondutores dos EUA contra a China',
    'Os EUA implementaram restrições à exportação de chips avançados para a China. A medida triggerou uma corrida global por independância tecnológica.',
    '2022-10-07', NULL,
    ARRAY['b0000010-0000-0000-0000-000000000010'::uuid, 'a0000002-0000-0000-0000-000000000002'::uuid],
    ARRAY['f6a7b8c9-0002-0000-0000-000000000002'::uuid, 'b8c9d0e1-0001-0000-0000-000000000001'::uuid]
  ),

  -- CLIMA / MEIO AMBIENTE
  (
    'c0000014-0000-0000-0000-000000000014',
    'Acordo de Paris',
    'Acordo climático global adoptado na COP21 em Paris. 196 países concordaram em limitar o aquecimento global a 1.5-2°C acima dos níveis pré-industriais.',
    '2015-12-12', NULL,
    ARRAY['b0000012-0000-0000-0000-000000000012'::uuid, 'a0000004-0000-0000-0000-000000000004'::uuid],
    ARRAY['ffff0000-0001-0000-0000-000000000001'::uuid]
  ),
  (
    'c0000015-0000-0000-0000-000000000015',
    'Queimadas na Amazônia (2019)',
    'Uma onda de incêndios florestais na Amazônia, particularmente no Brasil. O número de incêndios em agosto de 2019 foi 80% maior que no mesmo período de 2018.',
    '2019-08-01', '2019-08-31',
    ARRAY['b0000014-0000-0000-0000-000000000014'::uuid, 'b0000012-0000-0000-0000-000000000012'::uuid],
    ARRAY['f6a7b8c9-0001-0000-0000-000000000001'::uuid]
  ),

  -- DEMOCRACIA / DIREITOS
  (
    'c0000016-0000-0000-0000-000000000016',
    'Onda de democratização (1974-1990)',
    'Terceira onda de democratização. Queda de ditaduras em Portugal (1974), Grécia (1974), Espanha (1975), América Latina (anos 80), Europa Eastern (1989).',
    '1974-04-25', '1991-12-26',
    ARRAY['a0000009-0000-0000-0000-000000000009'::uuid],
    ARRAY['ffff0000-0001-0000-0000-000000000001'::uuid]
  ),
  (
    'c0000017-0000-0000-0000-000000000017',
    'Impeachment de Dilma Rousseff',
    'O Congresso Nacional brasileiro aprovou a abertura de processo de impeachment da presidente Dilma Rousseff por crime de responsabilidade fiscal.',
    '2015-12-02', '2016-08-31',
    ARRAY['a0000005-0000-0000-0000-000000000005'::uuid],
    ARRAY['f6a7b8c9-0001-0000-0000-000000000001'::uuid]
  ),

  -- ELEIÇÕES / POLÍTICA
  (
    'c0000018-0000-0000-0000-000000000018',
    'Eleição de Donald Trump (2016)',
    'Donald Trump, empresário e figura polarizadora, foi elected presidente dos EUA. Derrotou Hillary Clinton apesar de perder no voto popular.',
    '2016-11-08', '2017-01-20',
    ARRAY['a0000005-0000-0000-0000-000000000005'::uuid],
    ARRAY['f6a7b8c9-0002-0000-0000-000000000002'::uuid]
  ),
  (
    'c0000019-0000-0000-0000-000000000019',
    'Eleição de Jair Bolsonaro (2018)',
    'Jair Bolsonaro, capitán do exército e deputato federal, foi elected presidente do Brasil com 55% dos votos válidos.',
    '2018-10-28', '2019-01-01',
    ARRAY['a0000005-0000-0000-0000-000000000005'::uuid],
    ARRAY['f6a7b8c9-0001-0000-0000-000000000001'::uuid]
  );
