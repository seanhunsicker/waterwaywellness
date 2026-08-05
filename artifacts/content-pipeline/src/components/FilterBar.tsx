import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { STATUSES, SortMode, StatusFilter } from "@/types";
import { cx } from "@/lib/cx";

interface Props {
  filter: StatusFilter;
  onFilter: (f: StatusFilter) => void;
  query: string;
  onQuery: (q: string) => void;
  sort: SortMode;
  onSort: (s: SortMode) => void;
  counts: Record<StatusFilter, number>;
}

export function FilterBar({ filter, onFilter, query, onQuery, sort, onSort, counts }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses search from anywhere outside a text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mb-4">
      <div className="mb-2 flex flex-wrap gap-2">
        {(["all", ...STATUSES] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            aria-pressed={filter === f}
            className={cx(
              "cursor-pointer rounded-full border border-edge2 px-3.5 py-[7px] text-xs font-semibold capitalize transition-colors",
              filter === f
                ? "border-lime bg-lime text-ink"
                : "bg-transparent text-mute hover:text-soft",
            )}
          >
            {f === "all" ? "All" : f}{" "}
            <span className={cx("tabular-nums", filter === f ? "opacity-70" : "opacity-60")}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            aria-hidden
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dim"
          />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onQuery("")}
            placeholder="Search lines…  ( / )"
            aria-label="Search lines"
            className="w-full rounded-full border border-edge2 bg-transparent py-[7px] pr-8 pl-8 text-[13px] text-fg transition-colors focus:border-edge3"
          />
          {query && (
            <button
              onClick={() => onQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded-full border-none bg-transparent p-1 text-dim hover:text-fg"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div
          className="flex shrink-0 overflow-hidden rounded-full border border-edge2"
          role="group"
          aria-label="Sort order"
        >
          {(["new", "hot"] as SortMode[]).map((s) => (
            <button
              key={s}
              onClick={() => onSort(s)}
              aria-pressed={sort === s}
              className={cx(
                "cursor-pointer border-none px-3.5 py-[7px] text-xs font-semibold capitalize transition-colors",
                sort === s ? "bg-edge text-fg" : "bg-transparent text-dim hover:text-soft",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
