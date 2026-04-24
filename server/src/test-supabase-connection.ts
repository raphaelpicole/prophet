/**
 * Teste de Conexão com Supabase
 * 
 * Executar: 
 * SUPABASE_URL=https://xxxxxx.supabase.co SUPABASE_KEY=sbp_a64f4ceaafed683557a08b6bba6ff897219c9abd npx tsx src/test-supabase-connection.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || 'sbp_a64f4ceaafed683557a08b6bba6ff897219c9abd';

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL não configurada');
  console.log('\nExecute com:');
  console.log('SUPABASE_URL=https://seu-projeto.supabase.co npx tsx src/test-supabase-connection.ts\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testConnection() {
  console.log('\n🔌 TESTE DE CONEXÃO COM SUPABASE\n');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Key: ${supabaseKey.substring(0, 20)}...\n`);
  
  // Teste 1: Conexão básica
  console.log('1️⃣ Testando conexão básica...');
  try {
    const { data, error } = await supabase.from('sources').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      if (error.message.includes('does not exist')) {
        console.log('\n   💡 A tabela "sources" não existe. O schema precisa ser aplicado.');
        console.log('   Execute o SQL de docs/DATABASE.md no Supabase SQL Editor.\n');
      }
    } else {
      console.log(`   ✅ Conectado! Tabela "sources" existe.`);
    }
  } catch (err: any) {
    console.log(`   ❌ Erro de conexão: ${err.message}`);
    return;
  }
  
  // Teste 2: Listar tabelas
  console.log('\n2️⃣ Verificando tabelas existentes...');
  try {
    const { data, error } = await supabase.rpc('get_tables');
    
    if (error) {
      // Tenta query direta
      const { data: tables, error: err2 } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');
      
      if (err2 || !tables) {
        console.log(`   ⚠️  Não foi possível listar tabelas: ${err2?.message || 'unknown'}`);
      } else {
        console.log(`   ✅ ${tables.length} tabelas encontradas:`);
        tables.forEach((t: any) => console.log(`      - ${t.table_name}`));
      }
    }
  } catch (err: any) {
    console.log(`   ⚠️  ${err.message}`);
  }
  
  // Teste 3: Verificar fontes seed
  console.log('\n3️⃣ Verificando fontes configuradas...');
  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('id, slug, name, type, active')
    .order('slug');
  
  if (sourcesError) {
    console.log(`   ❌ Erro: ${sourcesError.message}`);
  } else if (!sources || sources.length === 0) {
    console.log('   ⚠️  Nenhuma fonte encontrada. O seed precisa ser aplicado.');
  } else {
    console.log(`   ✅ ${sources.length} fontes configuradas:`);
    sources.forEach((s: any) => {
      console.log(`      ${s.active ? '✓' : '✗'} ${s.slug} (${s.type}) - ${s.name}`);
    });
  }
  
  // Teste 4: Teste de escrita (se tabela raw_articles existe)
  console.log('\n4️⃣ Testando operação de escrita...');
  const { data: testExists } = await supabase
    .from('raw_articles')
    .select('id')
    .limit(1);
  
  if (testExists === null) {
    console.log('   ⚠️  Tabela raw_articles não existe, pulando teste de escrita.');
  } else {
    const testArticle = {
      source_id: sources?.[0]?.id || '00000000-0000-0000-0000-000000000000',
      title: 'Teste de conexão',
      url: `https://test-${Date.now()}.com`,
      content_hash: 'test-hash-123',
      status: 'pending',
    };
    
    const { data: inserted, error: insertError } = await supabase
      .from('raw_articles')
      .insert(testArticle)
      .select()
      .single();
    
    if (insertError) {
      console.log(`   ❌ Erro ao inserir: ${insertError.message}`);
    } else {
      console.log(`   ✅ Artigo de teste inserido: ${inserted.id}`);
      
      // Limpa
      await supabase.from('raw_articles').delete().eq('id', inserted.id);
      console.log('   ✅ Artigo de teste removido');
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO');
  console.log('='.repeat(60));
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Status: ${sources ? '✅ Conectado' : '❌ Falha'}`);
  console.log('='.repeat(60) + '\n');
}

testConnection().catch(console.error);
