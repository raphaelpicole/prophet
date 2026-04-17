-- ============================================================
-- Migration 009: Fix RLS policies for service role
-- ============================================================

-- Habilita RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy:允许 service_role bypass (Supabase internals)
-- O service_role key bypassa RLS automaticamente se usar o client correto
-- Mas vamos garantir que INSERT/UPDATE funcione

-- Drop policies existentes se houver
DROP POLICY IF EXISTS "Allow service role insert" ON users;
DROP POLICY IF EXISTS "Allow service role update" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert" ON users;
DROP POLICY IF EXISTS "Allow owner read" ON users;

-- Policy: INSERT via service_role (bypass RLS com anon key)
-- O supabaseAdmin com service_role key faz bypass de RLS automaticamente
-- Policy: permitir INSERT para service_role (apenas para signup)
CREATE POLICY "service_role_all" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy:允许匿名插入 (para signup via anon key - limitado)
CREATE POLICY "anon_insert" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy:允许用户读取自己的数据 (authenticated users can read their own row)
CREATE POLICY "users_owner_read" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy:允许认证用户更新自己的数据 (authenticated users can update their own row)
CREATE POLICY "users_owner_update" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
