-- ============================================
-- RESET DO BANCO — APAGA TUDO E RECRIA
-- 
-- ⚠️ CUIDADO: Isso apaga TODOS os dados!
-- Execute apenas no deploy inicial ou quando
-- quiser resetar completamente o banco.
-- ============================================

-- Desativar triggers temporariamente
SET session_replication_role = 'replica';

-- Apagar todas as tabelas (cuidado!)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Apagar views
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;
END $$;

-- Apagar funções (exceto as do sistema)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE pronamespace = 'public'::regnamespace
        AND proname NOT LIKE 'pg_%'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.args || ')';
    END LOOP;
END $$;

-- Apagar types (enums)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname);
    END LOOP;
END $$;

-- Reativar triggers
SET session_replication_role = 'origin';

-- ============================================
-- FIM DO RESET
-- Agora rode o schema.sql completo
-- ============================================