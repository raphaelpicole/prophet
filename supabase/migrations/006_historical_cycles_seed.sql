-- Seed historical events
insert into historical_events (name, description, event_date, cycle_type, region, tags, significance, outcome) values
-- ECONOMICO
('Grande Depressao de 1929', 'Crise financeira global apos crash da bolsa de NY. FMI criado em 1944 como resposta.', '1929-10-24', 'economico', 'NAM', array['depressao','bolsa','falencia','desemprego','New Deal'], 5, 'New Deal, regularizacao bancaria, welfare state'),
('Crise do Petroleo de 1973', 'Embargo OPEC causa triplicacao do preco do petroleo. Estagflacao no ocidente.', '1973-10-17', 'economico', 'GLOBAL', array['petroleo','OPEC','estagflacao','energia'], 5, 'Politicas de eficiencia energetica, fim da era do petroleo barato'),
('Crise Financeira 2008', 'Colapso do Lehman Brothers, bolha imobiliaria EUA. Maior recessao desde 1929.', '2008-09-15', 'economico', 'NAM', array['financas','imobiliario','recessao','Lehman','subprime'], 5, 'QE, regulacao Dodd-Frank, bitcoin como alternativa'),
('Aumento de juros 2022-2023', 'Fed eleva taxas de 0% para 5.5% para combater inflacao pos-pandemia.', '2022-03-16', 'economico', 'NAM', array['juros','Fed','inflacao','tapering'], 4, 'Recessao suave, tech layoffs, desaceleracao global'),

-- CONFLITO
('Primeira Guerra Mundial', 'Guerra global entre potencias europeias. 17 milhoes de mortos.', '1914-07-28', 'conflito', 'EUR', array['guerra','trinceira','Europa','imperialismo'], 5, 'Fim do Imperio Otomano, Revolucao Russa, Liga das Nacoes'),
('Segunda Guerra Mundial', 'Conflito global mais mortifero da historia. 70-85 milhoes mortos.', '1939-09-01', 'conflito', 'GLOBAL', array['nazismo','Holocausto','genocidio','aliados','eixo'], 5, 'ONU criada, descolonizacao, Guerra Fria'),
('Guerra Fria', 'Confronto USA-URSS sem conflito direto. 44 anos de tensao nuclear.', '1947-03-12', 'conflito', 'GLOBAL', array['nuclear','comunismo','capitalismo','cortina de ferro','cubano'], 5, 'Fim da URSS, unipolaridade americana'),
('Guerra da Ucrania 2022', 'Invasao rusa da Ucrania. Maior conflito terrestre na Europa desde WWII.', '2022-02-24', 'conflito', 'EU', array['Ucrunia','Russia','OTAN','sancoes','NATO'], 5, 'Armas pesadas, sancoes Russia, reconfiguracao geopolitica'),

-- POLITICO
('Queda do Muro de Berlim', '1989-11-09 simboliza fim da Guerra Fria e regimes comunistas na Europa.', '1989-11-09', 'politico', 'EU', array['comunismo','liberacao','democracia','Berlim','URSS'], 5, 'Unificacao alem, dissolucao URSS, expansao NATO'),
('Primavera Arabe', 'Onda de protestos e revolucoes no mundo arabe. Ditadores caem em Tunisia, Egito, Libya.', '2010-12-17', 'politico', 'ME', array['revolucao','democracia','protestos','arabe','ditadura'], 5, 'Guerra civil siria, ISIS emerge, contra-onda autoritaria'),
('Onda Bolsonarista 2018', 'Eleicao de Bolsonaro no Brasil com agenda conservadora e antissistema.', '2018-10-28', 'politico', 'BR', array['Bolsonaro','conservador','direita','antissistema'], 4, 'Polarizacao politica, STF como contra-peso, eventos de 8 de janeiro'),
('Eleicao Trump 2016', 'Trump vence contra Clinton. Populismo nacionalista em ascensao.', '2016-11-08', 'politico', 'NAM', array['Trump','populismo','nacionalista','anti-globalizacao'], 4, 'Trade wars, Brexit, onda conservadora global'),

-- AMBIENTAL
('Grande Seca do Mississippi 2012', 'Seca mais grave em decadas nos EUA. Safras devastadas.', '2012-07-17', 'ambiental', 'NAM', array['seca','agricultura','Mississippi','safra'], 4, 'Expansao fracking, mudanca para irrigacao intensiva'),
('Incendios na Australia 2019-2020', '1.8 bilhao de hectares queimados. 3 bilhoes de animais mortos.', '2019-09-01', 'ambiental', 'AS', array['incendio','fauna','aquecimento'], 4, 'Politicas climaticas mais agressivas na Australia'),
('Tsunami do Oceano Indico 2004', 'Terremoto 9.1 Mw. 230000 mortos em 14 paises.', '2004-12-26', 'ambiental', 'AS', array['tsunami','terremoto','Oceano Indico'], 5, 'Sistema de alerta regional, investimento em resiliencia'),

-- CULTURAL
('Revolucao Cultural 1966-1976', 'Mao purgeia oposicao. 20-45 milhoes de mortos.', '1966-05-16', 'cultural', 'AS', array['Mao','culto da personalidade','purga','china'], 4, 'Fim do maoismo radical, reformas Deng Xiaoping'),
('Queda do Apartheid 1994', 'Nelson Mandela vence eleicoes. Fim do apartheid na Africa do Sul.', '1994-04-27', 'cultural', 'AF', array['apartheid','Mandela','democracia','Africa do Sul'], 5, 'Reconciliacao nacional, Truth and Reconciliation Commission'),
('Movimento Direitos Civis EUA 1960s', 'Protestos contra segregacao racial. MLK Jr assassinado 1968.', '1960-02-01', 'cultural', 'NAM', array['direitos civis','segregacao','MLK','Black Lives Matter'], 5, 'Civil Rights Act, Voting Rights Act, luta continua'),
('Pandemia COVID-19 2020', '3 anos de pandemia global. 7-28 milhoes de mortos. Lockdowns mundiais.', '2020-03-11', 'cultural', 'GLOBAL', array['pandemia','lockdown','vacina','remoteness','saude'], 5, 'Tele-trabalho, virtualizacao, reordenacao geopolitica'),

-- SOCIAL
('Crise migratoria siria 2015', '1 milhao de refugiados na Europa. Maior fluxo desde WWII.', '2015-09-02', 'social', 'EU', array['refugiados','Siria','Europa','migracao','mar Egeu'], 5, 'Brexit, controles de fronteira, tensao UE-Turquia'),
('Emergencia opioid epidemica EUA', '500000 mortos por overdose desde 1999. Fentanyl agrava crise.', '2015-01-01', 'social', 'NAM', array['opioid','fentanyl','overdose','saude publica','crack'], 4, 'Declaracao emergencia saude publica, litigios contra pharma'),

-- TECNOLOGICO
('Lancamento do ChatGPT 2022', 'OpenAI lança ChatGPT. IA generativa se torna mainstream.', '2022-11-30', 'tecnologico', 'NAM', array['IA','ChatGPT','OpenAI','generativo','automacao'], 5, 'Regulacao IA, corrida de Big Tech, debates sobre emprego'),
('Escandalo Snowden 2013', 'NSA vigilancia em massa exposta. Edward Snowden vaza documentos.', '2013-06-05', 'tecnologico', 'NAM', array['NSA','vigilancia','privacidade','Snowden','criptografia'], 4, 'Criptografia普及, WhatsApp, Signal adoption'),
('A.I. Alignment Problem 2023-2024', 'Preocupacoes com IA superinteligente. A.I. safety emerge como campo.', '2023-07-01', 'tecnologico', 'GLOBAL', array['IA','superinteligente','safety','alignment','x-risk'], 4, 'EU AI Act, AI pause letter, Labs de alinhamento'),
('Ataque ransomware WannaCry 2017', 'Ciberataque global afeta 200000 computadores em 150 paises.', '2017-05-12', 'tecnologico', 'GLOBAL', array['ransomware','ciberataque','WannaCry','NHS','vigilancia'], 4, 'Ciberseguranca como prioridade nacional, NIST framework')

-- Seed cycle patterns
insert into cycle_patterns (name, cycle_type, description, avg_duration_years, recurrence_years, indicators, phase, historical_count) values
('Kondratieff Wave A (Expansao)', 'economico', 'Fase de crescimento economico com inovacao tecnologica', 25, 50, array['tecnologia','crescimento','inflacao baixa','emprego alto'], 'expansion', 6),
('Kondratieff Wave B (Recessao)', 'economico', 'Fase de contracao economica e deflacao', 25, 50, array['deflacao','desemprego','protecionismo','conflito'], 'contraction', 6),
('Business Cycle', 'economico', 'Ciclo de 3-5 anos de expansao/contracao', 4, 3, array['PIB','juros','inflacao','bolsa'], 'expansion', 12),
('Eleitoral Cycle (4 anos)', 'politico', 'Ciclo politico atado a eleicoes nacionais', 4, 4, array['eleicao','campanha','populismo','mudanca'], 'expansion', 30),
('Democratic Wave', 'politico', 'Onda de democratizacao global', 20, 25, array['revolucao','democracia','liberacao'], 'expansion', 4),
('Autoritarian Backlash', 'politico', 'Contracao democratica apos onda de liberalismo', 15, 25, array['golpe','ditadura','censura','repressao'], 'contraction', 4),
('Major War Cycle', 'conflito', 'Guerra major entre potencias globais', 30, 40, array['tensao','aliancas','armas','escalacao'], 'expansion', 5),
('Civil War / Secession', 'conflito', 'Conflitos internos e separatistas', 10, 15, array['secessao','rebeliao','minorias','recurso'], 'expansion', 8),
('Climate Crisis Escalation', 'ambiental', 'Eventos climaticos extremos em frequencia e intensidade', 5, 5, array['seca','inundacao','incendio','furacao'], 'expansion', 3),
('Cultural Revolution Cycle', 'cultural', 'Movimentos culturais que reconfiguram sociedade', 15, 20, array['movimento social','identidade','direitos','mudanca cultural'], 'expansion', 5),
('Pandemic Cycle', 'cultural', 'Pandemias com impacto global significativo', 100, 100, array['epidemia','vacina','quarentena','saude global'], 'expansion', 4),
('Technology Adoption S-Curve', 'tecnologico', 'Adocao masiva de nova tecnologia transformadora', 10, 15, array['inovacao','startup','disrupcao','automacao'], 'expansion', 6),
('IA Superintelligence Race', 'tecnologico', 'Corrida por IA superinteligente', 10, 10, array['IA','AGI','safety','regulacao'], 'expansion', 1);