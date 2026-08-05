import { Line, PILLARS, STATUSES, TAGS, Heat, PillarId, Status, TagId } from "@/types";

export const STORAGE_KEY = "pipeline-lines-v2";
// Key used by the original single-file mockup; migrated on first load.
const LEGACY_KEY = "pipeline-lines";

const PILLAR_IDS = new Set<string>(PILLARS.map((p) => p.id));
const TAG_IDS = new Set<string>(TAGS.map((t) => t.id));
const STATUS_IDS = new Set<string>(STATUSES);

function coerceLine(raw: unknown): Line | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.text !== "string" || r.text.trim() === "") return null;

  const pillar = (
    typeof r.pillar === "string" && PILLAR_IDS.has(r.pillar) ? r.pillar : "ideas"
  ) as PillarId;
  const tag = (typeof r.tag === "string" && TAG_IDS.has(r.tag) ? r.tag : "L") as TagId;
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

  const line: Line = { id, text: r.text.trim(), pillar, tag, status, heat, createdAt };
  if (typeof r.filmedAt === "number") line.filmedAt = r.filmedAt;
  if (typeof r.postedAt === "number") line.postedAt = r.postedAt;
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

export function exportJson(lines: Line[]): string {
  return JSON.stringify({ app: "content-pipeline", version: 2, exportedAt: Date.now(), lines }, null, 2);
}

/** Accepts a v2 export, a bare array, or the legacy mockup format. */
export function parseImport(text: string): Line[] {
  const parsed: unknown = JSON.parse(text);
  if (Array.isArray(parsed)) return coerceLines(parsed);
  if (typeof parsed === "object" && parsed !== null && "lines" in parsed) {
    return coerceLines((parsed as { lines: unknown }).lines);
  }
  throw new Error("Unrecognized file format");
}

/** Merge imported lines into existing ones; existing lines win on id conflicts. */
export function mergeLines(existing: Line[], imported: Line[]): { merged: Line[]; added: number } {
  const known = new Set(existing.map((l) => l.id));
  const fresh = imported.filter((l) => !known.has(l.id));
  return { merged: [...fresh, ...existing], added: fresh.length };
}
