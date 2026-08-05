import { useCallback, useEffect, useRef, useState } from "react";
import { Config, DEFAULT_CONFIG, MAX_PILLARS, MAX_TAGS, PillarDef, SWATCHES, TagDef } from "@/types";
import { CONFIG_KEY, loadConfig, newId, saveConfig } from "@/lib/storage";

export function useConfig() {
  const [config, setConfig] = useState<Config>(() => loadConfig());
  const configRef = useRef(config);
  configRef.current = config;

  const persist = useCallback((next: Config) => {
    setConfig(next);
    saveConfig(next);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONFIG_KEY) setConfig(loadConfig());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setBrand = useCallback(
    (changes: Partial<Pick<Config, "eyebrow" | "heading">>) => {
      persist({ ...configRef.current, ...changes });
    },
    [persist],
  );

  const updatePillar = useCallback(
    (id: string, changes: Partial<Omit<PillarDef, "id">>) => {
      persist({
        ...configRef.current,
        pillars: configRef.current.pillars.map((p) => (p.id === id ? { ...p, ...changes } : p)),
      });
    },
    [persist],
  );

  const addPillar = useCallback((): string | null => {
    const cur = configRef.current;
    if (cur.pillars.length >= MAX_PILLARS) return null;
    const usedTints = new Set(cur.pillars.map((p) => p.tint));
    const tint = SWATCHES.find((s) => !usedTints.has(s)) ?? SWATCHES[0];
    const pillar: PillarDef = { id: newId().slice(0, 8), label: "New pillar", tint };
    persist({ ...cur, pillars: [...cur.pillars, pillar] });
    return pillar.id;
  }, [persist]);

  const removePillar = useCallback(
    (id: string) => {
      const cur = configRef.current;
      if (cur.pillars.length <= 1) return;
      persist({ ...cur, pillars: cur.pillars.filter((p) => p.id !== id) });
    },
    [persist],
  );

  const updateTag = useCallback(
    (id: string, changes: Partial<Omit<TagDef, "id">>) => {
      persist({
        ...configRef.current,
        tags: configRef.current.tags.map((t) => (t.id === id ? { ...t, ...changes } : t)),
      });
    },
    [persist],
  );

  const addTag = useCallback((): string | null => {
    const cur = configRef.current;
    if (cur.tags.length >= MAX_TAGS) return null;
    const tag: TagDef = { id: newId().slice(0, 8), label: "New style" };
    persist({ ...cur, tags: [...cur.tags, tag] });
    return tag.id;
  }, [persist]);

  const removeTag = useCallback(
    (id: string) => {
      const cur = configRef.current;
      if (cur.tags.length <= 1) return;
      persist({ ...cur, tags: cur.tags.filter((t) => t.id !== id) });
    },
    [persist],
  );

  const resetConfig = useCallback(() => {
    persist(DEFAULT_CONFIG);
  }, [persist]);

  const replaceConfig = useCallback(
    (next: Config) => {
      persist(next);
    },
    [persist],
  );

  return {
    config,
    setBrand,
    updatePillar,
    addPillar,
    removePillar,
    updateTag,
    addTag,
    removeTag,
    resetConfig,
    replaceConfig,
  };
}
