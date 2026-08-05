import { useEffect, useMemo, useState } from "react";
import { BarChart3, Settings2, X, Zap } from "lucide-react";
import { Line, PillarId, SortMode, StatusFilter, View, pillarOf } from "@/types";
import { useLines } from "@/hooks/useLines";
import { useConfig } from "@/hooks/useConfig";
import { ImportPayload, mergeConfigAdditions } from "@/lib/storage";
import { cx } from "@/lib/cx";
import { CaptureCard } from "@/components/CaptureCard";
import { StatsStrip } from "@/components/StatsStrip";
import { PillarBalance } from "@/components/PillarBalance";
import { FilterBar } from "@/components/FilterBar";
import { UpNext } from "@/components/UpNext";
import { LineCard } from "@/components/LineCard";
import { UndoToast } from "@/components/UndoToast";
import { DataMenu } from "@/components/DataMenu";
import { Insights } from "@/components/Insights";
import { Settings } from "@/components/Settings";
import { PostingDayBanner } from "@/components/PostingDayBanner";

interface Notice {
  msg: string;
  at: number;
}

const NAV: Array<{ view: View; icon: typeof Zap; label: string }> = [
  { view: "pipeline", icon: Zap, label: "Pipeline" },
  { view: "insights", icon: BarChart3, label: "Insights" },
  { view: "settings", icon: Settings2, label: "Settings" },
];

export default function App() {
  const {
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
  } = useLines();
  const configApi = useConfig();
  const { config } = configApi;

  const [view, setView] = useState<View>("pipeline");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [pillarFilter, setPillarFilter] = useState<PillarId | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("new");
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2800);
    return () => clearTimeout(t);
  }, [notice]);

  // A pillar deleted in Settings can't stay active as a filter.
  useEffect(() => {
    if (pillarFilter !== null && !config.pillars.some((p) => p.id === pillarFilter)) {
      setPillarFilter(null);
    }
  }, [config.pillars, pillarFilter]);

  const showNotice = (msg: string) => setNotice({ msg, at: Date.now() });

  const handleImport = (payload: ImportPayload) => {
    let addedConfig = 0;
    if (payload.config) {
      const { merged, added } = mergeConfigAdditions(config, payload.config);
      if (added > 0) {
        configApi.replaceConfig(merged);
        addedConfig = added;
      }
    }
    const addedLines = importLines(payload.lines);
    return { addedLines, addedConfig };
  };

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
    return [...filtered].sort((a, b) => {
      if (sort === "hot") return b.heat - a.heat || b.createdAt - a.createdAt;
      if (sort === "top") {
        return (
          (b.metrics?.views ?? -1) - (a.metrics?.views ?? -1) || b.createdAt - a.createdAt
        );
      }
      return b.createdAt - a.createdAt;
    });
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
    if (pillarFilter !== null) return `No ${pillarOf(config, pillarFilter).label} lines here yet.`;
    switch (filter) {
      case "captured":
        return "Nothing waiting. Capture something.";
      case "filmed":
        return "Nothing filmed yet. Pick a hot line and shoot it.";
      case "posted":
        return "Nothing posted yet. Ship one.";
      default:
        return "Nothing here yet. Go do the thing, then write what you noticed.";
    }
  };

  return (
    <div className="min-h-dvh bg-ink px-4 pb-16 font-sans text-fg pt-[max(24px,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-[620px]">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="eyebrow mb-1.5 truncate tracking-[0.18em] text-lime">
              {config.eyebrow}
            </div>
            <h1 className="m-0 text-[clamp(26px,7vw,34px)] font-extrabold tracking-[-0.02em] text-balance">
              {config.heading}
            </h1>
          </div>
          <nav className="mt-1 flex shrink-0 gap-1" aria-label="Views">
            {NAV.map(({ view: v, icon: Icon, label }) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-label={label}
                aria-current={view === v ? "page" : undefined}
                title={label}
                className={cx(
                  "cursor-pointer rounded-full border-none p-2.5 transition-colors",
                  view === v ? "bg-edge text-lime" : "bg-transparent text-dim hover:text-soft",
                )}
              >
                <Icon size={17} />
              </button>
            ))}
          </nav>
        </header>

        {view === "settings" ? (
          <Settings
            config={config}
            lines={lines}
            onBrand={configApi.setBrand}
            onUpdatePillar={configApi.updatePillar}
            onAddPillar={configApi.addPillar}
            onRemovePillar={configApi.removePillar}
            onUpdateTag={configApi.updateTag}
            onAddTag={configApi.addTag}
            onRemoveTag={configApi.removeTag}
            onSetPostDays={configApi.setPostDays}
            onReset={configApi.resetConfig}
            onNotice={showNotice}
          />
        ) : view === "insights" ? (
          <Insights config={config} lines={lines} />
        ) : (
          <>
            <CaptureCard config={config} onAdd={add} />
            <PostingDayBanner config={config} lines={lines} />
            <StatsStrip lines={lines} />
            <PillarBalance
              config={config}
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
                    borderColor: pillarOf(config, pillarFilter).tint,
                    color: pillarOf(config, pillarFilter).tint,
                  }}
                >
                  {pillarOf(config, pillarFilter).label} only
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

            {upNext && <UpNext config={config} line={upNext} onFilm={advance} />}

            {visible.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-dim">{emptyCopy()}</div>
            ) : (
              visible.map((l: Line) => (
                <LineCard
                  key={l.id}
                  config={config}
                  line={l}
                  onPatch={patch}
                  onLogStats={logStats}
                  onAdvance={advance}
                  onStepBack={stepBack}
                  onSetHeat={setHeat}
                  onRemove={remove}
                />
              ))
            )}

            <DataMenu lines={lines} config={config} onImport={handleImport} onNotice={showNotice} />
          </>
        )}
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
