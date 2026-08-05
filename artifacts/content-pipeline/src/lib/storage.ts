import {
  Config,
  DEFAULT_CONFIG,
  Heat,
  Line,
  MAX_PILLARS,
  MAX_TAGS,
  Metrics,
  PLATFORMS,
  PillarDef,
  STATUSES,
  Snapshot,
  Status,
  SWATCHES,
  TagDef,
} from "@/types";

const PLATFORM_IDS = new Set<string>(PLATFORMS.map((p) => p.id));
export const MAX_SNAPSHOTS = 60;

export const STORAGE_KEY = "pipeline-lines-v2";
export const CONFIG_KEY = "pipeline-config-v1";
// Key used by the original single-file mockup; migrated on first load.
const LEGACY_KEY = "pipeline-lines";

const STATUS_IDS = new Set<string>(STATUSES);

// Old four-tag taxonomy → current three: Learned→Valuable, Funny/Story→Entertaining.
const LEGACY_TAG_MAP: Record<string, string> = { L: "V", F: "E", S: "E" };

function coerceSnapshots(raw: unknown): Snapshot[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : undefined;
  const out: Snapshot[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;
    if (typeof r.at !== "number" || !Number.isFinite(r.at)) continue;
    const s: Snapshot = { at: r.at };
    const views = num(r.views);
    const likes = num(r.likes);
    const comments = num(r.comments);
    if (views !== undefined) s.views = views;
    if (likes !== undefined) s.likes = likes;
    if (comments !== undefined) s.comments = comments;
    if (s.views !== undefined || s.likes !== undefined || s.comments !== undefined) out.push(s);
  }
  if (out.length === 0) return undefined;
  out.sort((a, b) => a.at - b.at);
  return out.slice(-MAX_SNAPSHOTS);
}

function coerceMetrics(raw: unknown): Metrics | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : undefined;
  const m: Metrics = {
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : Date.now(),
  };
  const views = num(r.views);
  const likes = num(r.likes);
  const comments = num(r.comments);
  if (views !== undefined) m.views = views;
  if (likes !== undefined) m.likes = likes;
  if (comments !== undefined) m.comments = comments;
  if (m.views === undefined && m.likes === undefined && m.comments === undefined) return undefined;
  return m;
}

function coerceLine(raw: unknown): Line | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.text !== "string" || r.text.trim() === "") return null;

  const rawPillar = typeof r.pillar === "string" && r.pillar !== "" ? r.pillar : "ideas";
  const rawTag = typeof r.tag === "string" && r.tag !== "" ? r.tag : "R";
  const tag = LEGACY_TAG_MAP[rawTag] ?? rawTag;
  const status = (
    typeof r.status === "string" && STATUS_IDS.has(r.status) ? r.status : "captured"
  ) as Status;
  const heat = (
    typeof r.heat === "number" ? Math.max(0, Math.min(3, Math.round(r.heat))) : 0
  ) as Heat;

  // Legacy lines used a Date.now() number as their id — reuse it as createdAt.
  const numericId = typeof r.id === "number" && Number.isFinite(r.id) ? r.id : null;
  const createdAt =
    typeof r.createdAt === "number" && Number.isFinite(r.createdAt)
      ? r.createdAt
      : (numericId ?? Date.now());
  const id = typeof r.id === "string" && r.id !== "" ? r.id : String(numericId ?? newId());

  const line: Line = { id, text: r.text.trim(), pillar: rawPillar, tag, status, heat, createdAt };
  if (typeof r.filmedAt === "number") line.filmedAt = r.filmedAt;
  if (typeof r.postedAt === "number") line.postedAt = r.postedAt;
  const metrics = coerceMetrics(r.metrics);
  if (metrics) line.metrics = metrics;
  const snapshots = coerceSnapshots(r.snapshots);
  if (snapshots) line.snapshots = snapshots;
  // Pre-snapshot data carried only a single metrics reading — seed history from it.
  else if (metrics) {
    line.snapshots = [
      {
        at: metrics.updatedAt,
        ...(metrics.views !== undefined && { views: metrics.views }),
        ...(metrics.likes !== undefined && { likes: metrics.likes }),
        ...(metrics.comments !== undefined && { comments: metrics.comments }),
      },
    ];
  }
  if (typeof r.postUrl === "string" && r.postUrl !== "") line.postUrl = r.postUrl.slice(0, 500);
  if (typeof r.platform === "string" && PLATFORM_IDS.has(r.platform)) {
    line.platform = r.platform as Line["platform"];
  }
  return line;
}

export function coerceLines(raw: unknown): Line[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Line[] = [];
  for (const item of raw) {
    const line = coerceLine(item);
    if (line && !seen.has(line.id)) {
      seen.add(line.id);
      out.push(line);
    }
  }
  return out;
}

const label = (v: unknown, fallback: string) =>
  typeof v === "string" && v.trim() !== "" ? v.trim().slice(0, 28) : fallback;

export function coerceConfig(raw: unknown): Config {
  if (typeof raw !== "object" || raw === null) return DEFAULT_CONFIG;
  const r = raw as Record<string, unknown>;

  const pillars: PillarDef[] = [];
  if (Array.isArray(r.pillars)) {
    const usedIds = new Set<string>();
    for (const item of r.pillars) {
      if (pillars.length >= MAX_PILLARS) break;
      if (typeof item !== "object" || item === null) continue;
      const p = item as Record<string, unknown>;
      const id = typeof p.id === "string" && p.id !== "" ? p.id : newId().slice(0, 8);
      if (usedIds.has(id)) continue;
      usedIds.add(id);
      const tint = SWATCHES.includes(p.tint as (typeof SWATCHES)[number])
        ? (p.tint as string)
        : SWATCHES[pillars.length % SWATCHES.length];
      pillars.push({ id, label: label(p.label, "Pillar"), tint });
    }
  }

  const tags: TagDef[] = [];
  if (Array.isArray(r.tags)) {
    const usedIds = new Set<string>();
    for (const item of r.tags) {
      if (tags.length >= MAX_TAGS) break;
      if (typeof item !== "object" || item === null) continue;
      const t = item as Record<string, unknown>;
      const id = typeof t.id === "string" && t.id !== "" ? t.id : newId().slice(0, 8);
      if (usedIds.has(id)) continue;
      usedIds.add(id);
      tags.push({ id, label: label(t.label, "Style") });
    }
  }

  const postDays = Array.isArray(r.postDays)
    ? [...new Set(r.postDays.filter((d): d is number => typeof d === "number" && d >= 0 && d <= 6))]
    : [];

  return {
    eyebrow: label(r.eyebrow, DEFAULT_CONFIG.eyebrow),
    heading: label(r.heading, DEFAULT_CONFIG.heading),
    pillars: pillars.length > 0 ? pillars : DEFAULT_CONFIG.pillars,
    tags: tags.length > 0 ? tags : DEFAULT_CONFIG.tags,
    postDays,
  };
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadLines(): Line[] {
  try {
    const v2 = localStorage.getItem(STORAGE_KEY);
    if (v2) return coerceLines(JSON.parse(v2));
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated = coerceLines(JSON.parse(legacy));
      saveLines(migrated);
      return migrated;
    }
  } catch (e) {
    console.error("Could not load lines", e);
  }
  return [];
}

export function saveLines(lines: Line[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch (e) {
    console.error("Could not save lines", e);
  }
}

export function loadConfig(): Config {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return coerceConfig(JSON.parse(raw));
  } catch (e) {
    console.error("Could not load config", e);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: Config): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Could not save config", e);
  }
}

export function exportJson(lines: Line[], config: Config): string {
  return JSON.stringify(
    { app: "content-pipeline", version: 3, exportedAt: Date.now(), config, lines },
    null,
    2,
  );
}

export interface ImportPayload {
  lines: Line[];
  config: Config | null;
}

/** Accepts a v3 export (with config), a v2 export, a bare array, or the legacy mockup format. */
export function parseImport(text: string): ImportPayload {
  const parsed: unknown = JSON.parse(text);
  if (Array.isArray(parsed)) return { lines: coerceLines(parsed), config: null };
  if (typeof parsed === "object" && parsed !== null && "lines" in parsed) {
    const r = parsed as { lines: unknown; config?: unknown };
    return {
      lines: coerceLines(r.lines),
      config: r.config !== undefined ? coerceConfig(r.config) : null,
    };
  }
  throw new Error("Unrecognized file format");
}

/** Merge imported lines into existing ones; existing lines win on id conflicts. */
export function mergeLines(existing: Line[], imported: Line[]): { merged: Line[]; added: number } {
  const known = new Set(existing.map((l) => l.id));
  const fresh = imported.filter((l) => !known.has(l.id));
  return { merged: [...fresh, ...existing], added: fresh.length };
}

/**
 * Adopt pillars/tags from an import that the local config doesn't know,
 * so imported lines keep their labels. Never overwrites local entries;
 * respects the caps (skipped entries just render as "—").
 */
export function mergeConfigAdditions(
  local: Config,
  imported: Config,
): { merged: Config; added: number } {
  const pillars = [...local.pillars];
  const tags = [...local.tags];
  let added = 0;
  const pillarIds = new Set(pillars.map((p) => p.id));
  const usedTints = new Set(pillars.map((p) => p.tint));
  for (const p of imported.pillars) {
    if (pillars.length >= MAX_PILLARS) break;
    if (pillarIds.has(p.id)) continue;
    const tint = usedTints.has(p.tint)
      ? (SWATCHES.find((s) => !usedTints.has(s)) ?? p.tint)
      : p.tint;
    pillars.push({ ...p, tint });
    pillarIds.add(p.id);
    usedTints.add(tint);
    added++;
  }
  const tagIds = new Set(tags.map((t) => t.id));
  for (const t of imported.tags) {
    if (tags.length >= MAX_TAGS) break;
    if (tagIds.has(t.id)) continue;
    tags.push(t);
    tagIds.add(t.id);
    added++;
  }
  return { merged: { ...local, pillars, tags }, added };
}
