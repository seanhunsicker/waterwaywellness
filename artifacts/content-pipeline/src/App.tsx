import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Line, PillarId, SortMode, StatusFilter, pillarOf } from "@/types";
import { useLines } from "@/hooks/useLines";
import { CaptureCard } from "@/components/CaptureCard";
import { StatsStrip } from "@/components/StatsStrip";
import { PillarBalance } from "@/components/PillarBalance";
import { FilterBar } from "@/components/FilterBar";
import { UpNext } from "@/components/UpNext";
import { LineCard } from "@/components/LineCard";
import { UndoToast } from "@/components/UndoToast";
import { DataMenu } from "@/components/DataMenu";

interface Notice {
  msg: string;
  at: number;
}

export default function App() {
  const {
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
  } = useLines();

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [pillarFilter, setPillarFilter] = useState<PillarId | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("new");
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const showNotice = (msg: string) => setNotice({ msg, at: Date.now() });

  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lines.filter(
      (l) =>
        (pillarFilter === null || l.pillar === pillarFilter) &&
        (q === "" || l.text.toLowerCase().includes(q)),
    );
  }, [lines, pillarFilter, query]);

  const counts: Record<StatusFilter, number> = useMemo(
    () => ({
      all: scoped.length,
      captured: scoped.filter((l) => l.status === "captured").length,
      filmed: scoped.filter((l) => l.status === "filmed").length,
      posted: scoped.filter((l) => l.status === "posted").length,
    }),
    [scoped],
  );

  const visible = useMemo(() => {
    const filtered = filter === "all" ? scoped : scoped.filter((l) => l.status === filter);
    return [...filtered].sort((a, b) =>
      sort === "hot" ? b.heat - a.heat || b.createdAt - a.createdAt : b.createdAt - a.createdAt,
    );
  }, [scoped, filter, sort]);

  const upNext = useMemo(() => {
    if (query.trim() !== "" || (filter !== "all" && filter !== "captured")) return null;
    const candidates = lines.filter(
      (l) =>
        l.status === "captured" &&
        l.heat > 0 &&
        (pillarFilter === null || l.pillar === pillarFilter),
    );
    candidates.sort((a, b) => b.heat - a.heat || a.createdAt - b.createdAt);
    return candidates[0] ?? null;
  }, [lines, filter, pillarFilter, query]);

  const emptyCopy = (): string => {
    if (query.trim() !== "") return `No lines match “${query.trim()}”.`;
    if (pillarFilter !== null) return `No ${pillarOf(pillarFilter).label} lines here yet.`;
    switch (filter) {
      case "captured":
        return "Nothing waiting. Capture something.";
      case "filmed":
        return "Nothing filmed yet. Pick a hot line and shoot it.";
      case "posted":
        return "Nothing posted yet. Ship one.";
      default:
        return "Nothing here yet. Go train, then write what you noticed.";
    }
  };

  return (
    <div className="min-h-dvh bg-ink px-4 pt-6 pb-16 font-sans text-fg">
      <div className="mx-auto max-w-[620px]">
        <header className="mb-6">
          <div className="eyebrow mb-1.5 tracking-[0.18em] text-lime">Content pipeline</div>
          <h1 className="m-0 text-[34px] font-extrabold tracking-[-0.02em]">
            What happened today
          </h1>
        </header>

        <CaptureCard onAdd={add} />
        <StatsStrip lines={lines} />
        <PillarBalance
          lines={lines}
          active={pillarFilter}
          onToggle={(id) => setPillarFilter((cur) => (cur === id ? null : id))}
        />

        {pillarFilter !== null && (
          <div className="mb-3 flex">
            <button
              onClick={() => setPillarFilter(null)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 text-xs font-semibold"
              style={{
                borderColor: pillarOf(pillarFilter).tint,
                color: pillarOf(pillarFilter).tint,
              }}
            >
              {pillarOf(pillarFilter).label} only
              <X size={12} aria-hidden />
              <span className="sr-only">— clear pillar filter</span>
            </button>
          </div>
        )}

        <FilterBar
          filter={filter}
          onFilter={setFilter}
          query={query}
          onQuery={setQuery}
          sort={sort}
          onSort={setSort}
          counts={counts}
        />

        {upNext && <UpNext line={upNext} onFilm={advance} />}

        {visible.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-dim">{emptyCopy()}</div>
        ) : (
          visible.map((l: Line) => (
            <LineCard
              key={l.id}
              line={l}
              onPatch={patch}
              onAdvance={advance}
              onStepBack={stepBack}
              onSetHeat={setHeat}
              onRemove={remove}
            />
          ))
        )}

        <DataMenu lines={lines} onImport={importLines} onNotice={showNotice} />
      </div>

      <UndoToast
        undo={undo}
        notice={notice?.msg ?? null}
        onUndo={applyUndo}
        onDismissUndo={dismissUndo}
      />
    </div>
  );
}
