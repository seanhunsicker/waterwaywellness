import { Line, PILLARS, PillarId } from "@/types";
import { cx } from "@/lib/cx";

interface Props {
  lines: Line[];
  active: PillarId | null;
  onToggle: (id: PillarId) => void;
}

export function PillarBalance({ lines, active, onToggle }: Props) {
  const posted = lines.filter((l) => l.status === "posted");
  const counts = PILLARS.map((p) => ({
    ...p,
    total: posted.filter((l) => l.pillar === p.id).length,
  }));
  const max = Math.max(1, ...counts.map((c) => c.total));

  // Nudge toward the most-neglected pillar once there's enough signal.
  const least = [...counts].sort((a, b) => a.total - b.total)[0];
  const gap = Math.max(...counts.map((c) => c.total)) - least.total;
  const showNudge = posted.length >= 3 && gap >= 2;

  return (
    <div className="mb-4 rounded-[14px] border border-edge bg-card p-4">
      <div className="eyebrow mb-3 flex items-baseline justify-between text-mute">
        <span>Posted by pillar</span>
        <span className="text-[10px] tracking-[0.1em] text-faint normal-case">tap a bar to filter</span>
      </div>
      {counts.map((c) => {
        const dimmed = active !== null && active !== c.id;
        return (
          <button
            key={c.id}
            onClick={() => onToggle(c.id)}
            aria-pressed={active === c.id}
            title={active === c.id ? "Clear pillar filter" : `Show only ${c.label}`}
            className={cx(
              "-mx-2 flex w-[calc(100%+16px)] cursor-pointer items-center gap-3 rounded-lg border-none bg-transparent px-2 py-[5px] text-left transition-opacity hover:bg-well/60",
              dimmed && "opacity-40",
            )}
          >
            <span className="w-[74px] shrink-0 font-narrow text-[13px] font-semibold text-soft">
              {c.label}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-[4px] bg-well">
              <span
                className="block h-full rounded-[4px] transition-[width] duration-400 ease-out"
                style={{
                  width: c.total === 0 ? 0 : `max(${(c.total / max) * 100}%, 6px)`,
                  background: c.tint,
                }}
              />
            </span>
            <span className="w-5 shrink-0 text-right text-[13px] font-semibold tabular-nums">
              {c.total}
            </span>
          </button>
        );
      })}
      {showNudge && (
        <div className="mt-2.5 flex items-center gap-2 text-[12px] text-dim">
          <span
            aria-hidden
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: least.tint }}
          />
          <span>
            <span style={{ color: least.tint }}>{least.label}</span> is {gap} behind — feed it next.
          </span>
        </div>
      )}
    </div>
  );
}
