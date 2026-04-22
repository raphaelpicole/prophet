-- Source requests table for user-submitted RSS source suggestions
-- Usage: run via admin-panel /api/admin/actions?action=init_source_requests
-- Or directly in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.source_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  site_name TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  reviewed_at TIMESTAMPTZ
);

-- RLS: anyone can insert/view; only service role can update status
ALTER TABLE public.source_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a request
CREATE POLICY "anon_insert" ON public.source_requests
  FOR INSERT TO anon WITH CHECK (true);

-- Allow anyone to view all requests
CREATE POLICY "anon_select" ON public.source_requests
  FOR SELECT TO anon USING (true);

-- Allow authenticated updates (for status changes)
CREATE POLICY "service_update" ON public.source_requests
  FOR UPDATE TO anon USING (true);
