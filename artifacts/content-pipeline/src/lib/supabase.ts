import { SupabaseClient, createClient } from "@supabase/supabase-js";

// Cloud sync is opt-in per deployment: set VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY (Vercel → Project → Settings → Environment
// Variables, or a local .env.local). Point them at the same Supabase
// project as Zingo UGC and one login works across both apps.
// Without them the app runs fully local — nothing breaks.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const cloudConfigured = Boolean(url && anon);

export const supabase: SupabaseClient | null = cloudConfigured
  ? createClient(url!, anon!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

export const PIPELINE_TABLE = "pipeline_data";
