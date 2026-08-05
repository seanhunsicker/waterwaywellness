import { Line } from "@/types";
import { captureStreak, weekStats } from "@/lib/time";

interface Props {
  lines: Line[];
}

export function StatsStrip({ lines }: Props) {
  const streak = captureStreak(lines);
  const week = weekStats(lines);

  const tiles = [
    { label: "captured", value: week.captured },
    { label: "filmed", value: week.filmed },
    { label: "posted", value: week.posted },
  ];

  return (
    <div className="mb-4 grid grid-cols-4 rounded-[14px] border border-edge bg-card">
      <div className="border-r border-edge px-3 py-3 text-center">
        <div className="text-[22px] leading-7 font-extrabold tabular-nums">
          {streak.days}
          <span className="text-[13px] font-bold text-mute">d</span>
        </div>
        <div className="eyebrow mt-0.5 text-dim">
          <span
            aria-hidden
            className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-[1px]"
            style={{
              background: streak.today ? "var(--color-lime)" : "var(--color-edge3)",
            }}
          />
          streak
        </div>
        {!streak.today && streak.days > 0 && <span className="sr-only">Capture today to keep it</span>}
      </div>
      {tiles.map((t, i) => (
        <div
          key={t.label}
          className={i < tiles.length - 1 ? "border-r border-edge px-3 py-3 text-center" : "px-3 py-3 text-center"}
        >
          <div className="text-[22px] leading-7 font-extrabold tabular-nums">{t.value}</div>
          <div className="eyebrow mt-0.5 text-dim">{t.label}</div>
        </div>
      ))}
      <div className="eyebrow col-span-4 border-t border-edge px-3 py-1.5 text-center text-[10px] text-faint">
        last 7 days
      </div>
    </div>
  );
}
