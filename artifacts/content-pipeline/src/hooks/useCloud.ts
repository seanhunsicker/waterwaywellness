import { useCallback, useEffect, useRef, useState } from "react";
import { Config, DEFAULT_CONFIG } from "@/types";
import { PIPELINE_TABLE, cloudConfigured, supabase } from "@/lib/supabase";
import {
  coerceConfig,
  coerceLines,
  emitDataReplaced,
  loadConfig,
  loadLines,
  mergeConfigAdditions,
  mergeLines,
  onDataSaved,
  saveConfig,
  saveLines,
} from "@/lib/storage";

export type SyncStatus = "signedOut" | "syncing" | "synced" | "error" | "unavailable";

export interface CloudUser {
  id: string;
  email: string;
}

const PUSH_DEBOUNCE_MS = 2000;
const REFRESH_PULL_MS = 60_000;

function isDefaultConfig(c: Config): boolean {
  return JSON.stringify(c) === JSON.stringify(DEFAULT_CONFIG);
}

/** Network failure (e.g. the Claude-preview sandbox blocks external hosts). */
function isFetchFailure(e: unknown): boolean {
  return e instanceof TypeError || (e instanceof Error && /fetch|network/i.test(e.message));
}

export function useCloud() {
  const [user, setUser] = useState<CloudUser | null>(null);
  const [status, setStatus] = useState<SyncStatus>("signedOut");
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const userRef = useRef(user);
  userRef.current = user;
  const lastPullRef = useRef(0);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback(async () => {
    const u = userRef.current;
    if (!u || !supabase) return;
    setStatus("syncing");
    try {
      const { error } = await supabase.from(PIPELINE_TABLE).upsert({
        user_id: u.id,
        data: { lines: loadLines(), config: loadConfig(), savedAt: Date.now() },
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setStatus("synced");
      setLastSyncAt(Date.now());
    } catch (e) {
      console.error("Cloud push failed", e);
      setStatus(isFetchFailure(e) ? "unavailable" : "error");
    }
  }, []);

  const pullAndMerge = useCallback(async () => {
    const u = userRef.current;
    if (!u || !supabase) return;
    setStatus("syncing");
    try {
      const { data, error } = await supabase
        .from(PIPELINE_TABLE)
        .select("data")
        .eq("user_id", u.id)
        .maybeSingle();
      if (error) throw error;
      lastPullRef.current = Date.now();

      const cloud = (data?.data ?? null) as { lines?: unknown; config?: unknown } | null;
      if (cloud) {
        const cloudLines = coerceLines(cloud.lines);
        const { merged: mergedLines } = mergeLines(loadLines(), cloudLines);

        let mergedConfig = loadConfig();
        if (cloud.config !== undefined && cloud.config !== null) {
          const cloudConfig = coerceConfig(cloud.config);
          // A device still on factory settings adopts the cloud setup wholesale;
          // a customized device keeps its own and just gains unknown pillars/styles.
          mergedConfig = isDefaultConfig(mergedConfig)
            ? cloudConfig
            : mergeConfigAdditions(mergedConfig, cloudConfig).merged;
        }

        saveLines(mergedLines, { silent: true });
        saveConfig(mergedConfig, { silent: true });
        emitDataReplaced();
      }
      await push();
    } catch (e) {
      console.error("Cloud pull failed", e);
      setStatus(isFetchFailure(e) ? "unavailable" : "error");
    }
  }, [push]);

  // Restore an existing session on load and follow auth changes.
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        const s = data.session;
        if (s?.user) setUser({ id: s.user.id, email: s.user.email ?? "" });
      })
      .catch(() => {});
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null);
      if (!session?.user) setStatus("signedOut");
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // On sign-in: pull + merge, then push local edits up as they happen.
  useEffect(() => {
    if (!user) return;
    void pullAndMerge();
    const off = onDataSaved(() => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      pushTimerRef.current = setTimeout(() => void push(), PUSH_DEBOUNCE_MS);
    });
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastPullRef.current > REFRESH_PULL_MS
      ) {
        void pullAndMerge();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      off();
      document.removeEventListener("visibilitychange", onVisible);
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, [user, pullAndMerge, push]);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return "Sync isn't set up in this copy of the app.";
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? error.message : null;
    } catch (e) {
      return isFetchFailure(e)
        ? "Can't reach the sync server from here — use your deployed app link."
        : "Sign-in failed. Try again.";
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return "Sync isn't set up in this copy of the app.";
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return error.message;
      if (!data.session) return "Account created — check your email to confirm, then sign in.";
      return null;
    } catch (e) {
      return isFetchFailure(e)
        ? "Can't reach the sync server from here — use your deployed app link."
        : "Sign-up failed. Try again.";
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase?.auth.signOut();
    } catch {
      // ignore — local session is cleared regardless
    }
    setStatus("signedOut");
  }, []);

  return {
    configured: cloudConfigured,
    user,
    status,
    lastSyncAt,
    signIn,
    signUp,
    signOut,
    syncNow: pullAndMerge,
  };
}

export type CloudApi = ReturnType<typeof useCloud>;
