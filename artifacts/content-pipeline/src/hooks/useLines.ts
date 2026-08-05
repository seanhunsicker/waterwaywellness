import { useCallback, useEffect, useRef, useState } from "react";
import { Heat, Line, PillarId, STATUSES, Status, TagId } from "@/types";
import { STORAGE_KEY, loadLines, mergeLines, newId, saveLines } from "@/lib/storage";

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

  // Keep tabs in sync — the storage event only fires in *other* tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLines(loadLines());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
    remove,
    importLines,
    undo,
    applyUndo,
    dismissUndo,
  };
}
