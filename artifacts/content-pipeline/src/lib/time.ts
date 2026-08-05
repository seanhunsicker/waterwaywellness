import { Line } from "@/types";

const DAY_MS = 86_400_000;

/** Local-timezone calendar day key, e.g. "2026-08-05". */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function relTime(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts);
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < DAY_MS) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 7 * DAY_MS) return `${Math.floor(diff / DAY_MS)}d`;
  if (diff < 30 * DAY_MS) return `${Math.floor(diff / (7 * DAY_MS))}w`;
  return `${Math.floor(diff / (30 * DAY_MS))}mo`;
}

/**
 * Consecutive days with at least one capture, counting back from today.
 * A streak survives if the last capture was yesterday (today isn't over yet).
 */
export function captureStreak(lines: Line[], now = Date.now()): { days: number; today: boolean } {
  const days = new Set(lines.map((l) => dayKey(l.createdAt)));
  const today = days.has(dayKey(now));
  let cursor = today ? now : now - DAY_MS;
  if (!days.has(dayKey(cursor))) return { days: 0, today };
  let count = 0;
  while (days.has(dayKey(cursor))) {
    count++;
    cursor -= DAY_MS;
  }
  return { days: count, today };
}

export interface WeekStats {
  captured: number;
  filmed: number;
  posted: number;
}

/** Activity over the trailing 7 days. */
export function weekStats(lines: Line[], now = Date.now()): WeekStats {
  const since = now - 7 * DAY_MS;
  let captured = 0;
  let filmed = 0;
  let posted = 0;
  for (const l of lines) {
    if (l.createdAt >= since) captured++;
    if (l.filmedAt !== undefined && l.filmedAt >= since) filmed++;
    if (l.postedAt !== undefined && l.postedAt >= since) posted++;
  }
  return { captured, filmed, posted };
}
