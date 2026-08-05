import { useCallback, useEffect, useRef, useState } from "react";
import { Heat, Line, Metrics, PillarId, STATUSES, Snapshot, Status, TagId } from "@/types";
import {
  MAX_SNAPSHOTS,
  STORAGE_KEY,
  loadLines,
  mergeLines,
  newId,
  onDataReplaced,
  saveLines,
} from "@/lib/storage";
import { detectPlatform, normalizeUrl } from "@/lib/platform";

export interface StatsInput {
  views?: number;
  likes?: number;
  comments?: number;
  /** Raw url field text; empty string clears the link. Omit to leave untouched. */
  url?: string;
}

export interface UndoState {
  label: string;
  prev: Line[];
  at: number;
}

export function useLines() {
  const [lines, setLines] = useState<Line[]>(() => loadLines());
  const [undo, setUndo] = useState<UndoState | null>(null);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  const persist = useCallback((next: Line[]) => {
    setLines(next);
    saveLines(next);
  }, []);

  // Keep tabs in sync — the storage event only fires in *other* tabs —
  // and reload after a cloud merge rewrites storage in this tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLines(loadLines());
    };
    window.addEventListener("storage", onStorage);
    const offReplaced = onDataReplaced(() => setLines(loadLines()));
    return () => {
      window.removeEventListener("storage", onStorage);
      offReplaced();
    };
  }, []);

  const withUndo = useCallback(
    (label: string, next: Line[]) => {
      setUndo({ label, prev: linesRef.current, at: Date.now() });
      persist(next);
    },
    [persist],
  );

  const add = useCallback(
    (text: string, pillar: PillarId, tag: TagId) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const line: Line = {
        id: newId(),
        text: trimmed,
        pillar,
        tag,
        status: "captured",
        heat: 0,
        createdAt: Date.now(),
      };
      persist([line, ...linesRef.current]);
    },
    [persist],
  );

  const patch = useCallback(
    (id: string, changes: Partial<Line>) => {
      persist(linesRef.current.map((l) => (l.id === id ? { ...l, ...changes } : l)));
    },
    [persist],
  );

  const advance = useCallback(
    (id: string) => {
      persist(
        linesRef.current.map((l) => {
          if (l.id !== id) return l;
          const idx = STATUSES.indexOf(l.status);
          if (idx >= STATUSES.length - 1) return l;
          const status: Status = STATUSES[idx + 1];
          const next = { ...l, status };
          if (status === "filmed") next.filmedAt = Date.now();
          if (status === "posted") next.postedAt = Date.now();
          return next;
        }),
      );
    },
    [persist],
  );

  const stepBack = useCallback(
    (id: string) => {
      persist(
        linesRef.current.map((l) => {
          if (l.id !== id) return l;
          const idx = STATUSES.indexOf(l.status);
          if (idx <= 0) return l;
          const status: Status = STATUSES[idx - 1];
          const next: Line = { ...l, status };
          if (l.status === "posted") delete next.postedAt;
          if (l.status === "filmed") delete next.filmedAt;
          return next;
        }),
      );
    },
    [persist],
  );

  const setHeat = useCallback(
    (id: string, h: Heat) => {
      persist(
        linesRef.current.map((l) =>
          l.id === id ? { ...l, heat: (l.heat === h ? 0 : h) as Heat } : l,
        ),
      );
    },
    [persist],
  );

  const logStats = useCallback(
    (id: string, input: StatsInput) => {
      persist(
        linesRef.current.map((l) => {
          if (l.id !== id) return l;
          const next: Line = { ...l };
          const now = Date.now();

          const hasNumbers =
            input.views !== undefined || input.likes !== undefined || input.comments !== undefined;
          if (hasNumbers) {
            const m: Metrics = { updatedAt: now };
            if (input.views !== undefined) m.views = input.views;
            if (input.likes !== undefined) m.likes = input.likes;
            if (input.comments !== undefined) m.comments = input.comments;
            next.metrics = m;
            const prev = l.metrics;
            const changed =
              !prev ||
              prev.views !== m.views ||
              prev.likes !== m.likes ||
              prev.comments !== m.comments;
            if (changed) {
              const snap: Snapshot = { at: now };
              if (m.views !== undefined) snap.views = m.views;
              if (m.likes !== undefined) snap.likes = m.likes;
              if (m.comments !== undefined) snap.comments = m.comments;
              next.snapshots = [...(l.snapshots ?? []), snap].slice(-MAX_SNAPSHOTS);
            }
          } else {
            delete next.metrics;
            delete next.snapshots;
          }

          if (input.url !== undefined) {
            const url = normalizeUrl(input.url);
            if (url) {
              next.postUrl = url;
              next.platform = detectPlatform(url);
            } else {
              delete next.postUrl;
              delete next.platform;
            }
          }
          return next;
        }),
      );
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => {
      withUndo("Line deleted", linesRef.current.filter((l) => l.id !== id));
    },
    [withUndo],
  );

  const importLines = useCallback(
    (imported: Line[]): number => {
      const { merged, added } = mergeLines(linesRef.current, imported);
      if (added > 0) withUndo(`Imported ${added} line${added === 1 ? "" : "s"}`, merged);
      return added;
    },
    [withUndo],
  );

  const applyUndo = useCallback(() => {
    setUndo((u) => {
      if (u) persist(u.prev);
      return null;
    });
  }, [persist]);

  const dismissUndo = useCallback(() => setUndo(null), []);

  return {
    lines,
    add,
    patch,
    advance,
    stepBack,
    setHeat,
    logStats,
    remove,
    importLines,
    undo,
    applyUndo,
    dismissUndo,
  };
}
