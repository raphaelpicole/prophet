# Prophet — Deploy no Supabase

## ⚠️ IMPORTANTE: Reset do Banco

Se você já tem um projeto Supabase "prophet" com dados antigos:

### Opção 1: Reset Completo (apaga tudo)

1. Acesse o Dashboard do Supabase: https://app.supabase.com
2. Selecione seu projeto "prophet"
3. Vá em **SQL Editor**
4. Cole o conteúdo de `src/db/reset.sql`
5. Clique em **Run** — isso apaga todas as tabelas, views, funções e types
6. Depois cole o conteúdo de `docs/DATABASE.md` (a parte SQL)
7. Clique em **Run** novamente — recria o schema v2 completo

### Opção 2: Novo Projeto (recomendado)

1. Crie um novo projeto em https://app.supabase.com
2. Nome: `prophet-v2` (ou qualquer nome)
3. Anote a **Project URL** e **anon/public key**
4. No SQL Editor, cole o schema de `docs/DATABASE.md`
5. Execute

## Variáveis de Ambiente

Depois de criar/aplicar o schema, configure no Vercel:

```bash
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...  # service_role (secreto)
```

## Verificar Schema

Execute no SQL Editor:

```sql
-- Ver tabelas criadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Ver enums criados
SELECT typname FROM pg_type WHERE typtype = 'e';

-- Ver se fontes foram inseridas
SELECT slug, name, type FROM sources;
```

Deve mostrar:
- Tabelas: sources, raw_articles, stories, analysis, etc.
- Enums: source_type, cycle_type, bias_label, etc.
- Fontes: g1, folha, uol, estadao, oglobo, metropoles, icl, bbc, reuters, cnn

## Seed de Dados Iniciais

O schema já inclui:
- ✅ 10 fontes de notícia
- ✅ Regiões do mundo
- ✅ Enums tipados

Não precisa inserir dados manualmente!
