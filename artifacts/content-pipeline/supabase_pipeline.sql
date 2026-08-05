-- Content Pipeline — cloud sync table
-- Runs against the same Supabase project as Zingo UGC so one login works
-- for both apps. Fully separate table; Zingo's data is untouched.
--
-- HOW TO RUN (once):
--   Supabase dashboard → SQL Editor → New query → paste this → Run.
-- Safe to re-run: every statement is idempotent.

CREATE TABLE IF NOT EXISTS public.pipeline_data (
  user_id    uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  data       jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pipeline select own" ON public.pipeline_data;
CREATE POLICY "pipeline select own" ON public.pipeline_data
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "pipeline insert own" ON public.pipeline_data;
CREATE POLICY "pipeline insert own" ON public.pipeline_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pipeline update own" ON public.pipeline_data;
CREATE POLICY "pipeline update own" ON public.pipeline_data
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pipeline delete own" ON public.pipeline_data;
CREATE POLICY "pipeline delete own" ON public.pipeline_data
  FOR DELETE USING (auth.uid() = user_id);
