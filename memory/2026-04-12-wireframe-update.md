# Session: 2026-04-12 19:34:55 UTC

- **Session Key**: agent:main:main
- **Session ID**: ef622e3d-d087-43ef-8e44-511eb11650b3
- **Source**: webchat

## Conversation Summary

assistant: Oi! Tudo bem? No que posso ajudar? 🐙
user: Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Sun 2026-04-12 15:27 GMT-3] onde paramos?
assistant: Paramos no wireframe **SmartFlow v2**. Estávamos ajustando o escopo:

- Removidas as funções de **inclusão e alteração** de Compras e NF (SC→PC, Nova NF)
- Mantido apenas **visualização** — tudo vem da API REST
- Atualizamos o sidebar, anotações e JS (18 telas agora)

Próximo passo natural seria **definir a estrutura de diretórios** do projeto Flutter ou começar a **implementar o backend Node.js**. 

Quer continuar por qual frente? 🐙
user: Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Sun 2026-04-12 15:27 GMT-3] atualizar o wireframe
assistant: Ao analisar o arquivo atual, identifiquei **5 pontos ainda pendentes** que precisamos ajustar:

1. **Botão "Converter 2 SCs em PC"** no action bar do MRP SC (ainda cria PC)
2. **Tela SC→PC** (html completo continua no arquivo)
3. **Tela Nova NF** (html completo continua no arquivo)
4. **Botão "+ NF Entrada"** no PC Detail (ainda cria NF)
5. **FAB "+ Nova NF"** na NF List (ainda cria NF)
6. **FAB "+ Nova Expedição"** na Expedição (ainda cria expedição)

Atualizando agora:
assistant: Tudo limpo! Confirmação final:
assistant: Atualizado! Wireframe **v3** com mudanças aplicadas:

**Remoções:**
- ❌ SC→PC (tela completa)
- ❌ Nova NF / Nova Expedição (FABs desabilitados)
- ❌ Botões "Aprovar PC", "Criar PC", "Converter SCs"
- ❌ Qualquer ação de criação/edição em Compras e NF

**Mantido (readonly):**
- ✅ Leitura de PCs, NFs, Expedições — via API REST
- ✅ Apontamento de OP (Iniciar/Concluir/Cancelar)
- ✅ MRP e PMP com ações de cálculo/lançamento

**19 telas** · escopo: leitura + apontamento. Próximo passo é definir a estrutura de diretórios do projeto. Bora? 🐙
user: Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Sun 2026-04-12 15:39 GMT-3] remover o apontamento de op (sera add no futuro)
assistant: Feito! Wireframe **v3** atualizado com remoções aplicadas:

**Removido (apontamento OP):**
- ❌ Nav "Produção" (seção vazia)
- ❌ OP List e OP Detail (telas completas)
- ❌ KPI "OPs Abertas" no Dashboard (clicável)
- ❌ Botão "Liberar 2 OPs → Produção" no PMP
- ❌ Anotações `op-list` e `op-det` no JS
- ❌ Flow `pmp-rel → Ordens de Produção`

**15 telas restantes** (readonly + MRP/PMP write):

| Módulo | Telas |
|--------|-------|
| Auth | Login |
| Home | Dashboard |
| MRP | Dashboard, Resultados, Detalhe, SCs |
| PMP | Dashboard, Resultados, Liberar OPs |
| Compras | Lista PCs, Detalhe PC |
| NF | Lista NF, Detalhe NF |
| Expedição | Lista, Detalhe |
| Estoque | Saldos, Movimentos |

Quer avançar ou tem mais ajustes? 🐙
user: Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Sun 2026-04-12 15:48 GMT-3] vamos remover todas as telas fora o mrp, manter apenas uma visualizacao detalhada por tipo de entrrada e saida no mrp
user: Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Sun 2026-04-12 16:08 GMT-3] oi
assistant: 

Oi! Tô aqui. Você quer manter **só MRP** no wireframe — remover tudo (PMP, Compras, NF, Expedição, Estoque) e ficar só com uma tela de visualização detalhada por tipo de entrada/saída no MRP.

Qual diretriz de entrada/saída quer representar? (ex: SA, NE, SC, ES?)
user: Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Sun 2026-04-12 16:08 GMT-3] todas as entradas e saidas, usar um modelo generico
assistant: 

Agora vou criar as 4 telas MRP (SA, NE, SC, ES) e remover as antigas. Deixa eu primeiro ver a estrutura da MRP-SC antiga:

assistant: 

Feito! Wireframe **v4** — escopo MRP only, 9 telas:

| Tela | Descrição |
|------|-----------|
| `login` | Auth |
| `dashboard` | KPIs SA/NE/SC/ES + donut + chart |
| `mrp-dash` | Cálculo MRP + histórico |
| `mrp-res` | Visão geral com chips por tipo |
| `mrp-det` | Detalhe produto genérico (entradas/saídas) |
| `mrp-sa` | SA — Sem Ação (tipo: Entrada) |
| `mrp-ne` | NE — Necessidade (tipo: Entrada) |
| `mrp-sc` | SC — Solicitação de Compra (tipo: Entrada) |
| `mrp-es` | ES — Estoque Excedente (tipo: Saída) |

Removido: PMP, Compras, NF, Expedição, Estoque, OPs, SC→PC, e qualquer botão de criação. Tudo readonly via API REST.

Próximo passo: estrutura de diretórios do projeto Flutter? 🐙
