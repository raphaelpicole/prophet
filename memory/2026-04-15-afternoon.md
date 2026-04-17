# Session: 2026-04-15

## Resumo do dia

### Manhã — Prophet
- Revisão completa do fluxo do Prophet
- Identificados bugs: grouper placeholder, pipeline duplicado, key hardcoded, missing openai dep
- Pendências: conta Supabase, Vercel, LLM API key (aguardando Rapha)

### PHP/AdvPL
- Inverteu duas listas de campos (ZZC e ZZD) — chave ↔ valor
- Ajustou query SQL Server com CONVERT(datetime, ..., 120/121) para resolver erro de conversão varchar→datetime

### Inglês
- Teste de nível: **A2→B1 (pré-intermediário)**
- Acertos: Present Simple (goes), Passive Voice (was written), expressões literais (figure it out, brought up)
- Erros principais: Present Perfect, Past Continuous, Conditionals, preposições, reported speech
- Cron configurado: seg-sex às 16h (horário de SP)
- Plano salvo em `english-training.md`

### Pesquisa — História do Paraná
- História de Curitiba, Foz do Iguaçu e Cascavel — fundação e relação entre elas
- Detalhou Cascavel: origem (Encruzilhada dos Gomes, 1928), nome (cobra vs porteira), emancipação (1952), ciclos econômicos
- Motivos da imigração gaúcha para o oeste: falta de terra no RS, Marcha para Oeste, CANGO, ciclo da madeira, cadeia migratória
- Corrigiu erro: "manezês" é de Floripa, não do oeste paranaense
- Como Cascavel é vista pelo Brasil: Capital do Oeste, agronegócio, 2ª melhor cidade do Brasil (2022), mas invisível pra muitos

### Pesquisa — Notícias
- Testou acesso ao G1 (funciona) e Folha (funciona, metade paywall)
- Comparou manchetes G1 vs Folha vs ICL Notícias
- ICL traz pautas exclusivas e tom mais combativo

### Prophet — Nova Feature
- Rapha propôs: analisar mesma notícia em canais diferentes, comparar estilo, narrativa, fatos e evolução temporal
- Documentado em `prophet/docs/NARRATIVE_ANALYSIS.md`
- Atualizada arquitetura em `ARCHITECTURE.md`
- 5 etapas de implementação planejadas

### Ferramentas/Conhecimentos
- ollama_web_search e ollama_web_fetch funcionam bem para pesquisa
- G1 e Folha retornam conteúdo; ICL também retorna bem
- Sites com paywall pesado (Folha) retornam títulos mas bloqueiam conteúdo completo