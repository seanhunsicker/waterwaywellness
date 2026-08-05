import { useState } from "react";
import { Config, Line, pillarOf, platformOf, tagOf } from "@/types";
import { fmtCount } from "@/lib/format";
import { relTime } from "@/lib/time";
import { cx } from "@/lib/cx";

interface Props {
  config: Config;
  lines: Line[];
}

interface Row {
  id: string;
  label: string;
  tint: string | null;
  avg: number;
  count: number;
}

type Range = "7" | "30" | "all";

const RANGES: Array<[Range, string]> = [
  ["7", "7d"],
  ["30", "30d"],
  ["all", "All"],
];

const DAY_MS = 86_400_000;

function avgViewsBy(withViews: Line[], keyOf: (l: Line) => string | null): Row[] {
  const acc = new Map<string, { sum: number; count: number }>();
  for (const l of withViews) {
    const k = keyOf(l);
    if (k === null) continue;
    const cur = acc.get(k) ?? { sum: 0, count: 0 };
    cur.sum += l.metrics!.views!;
    cur.count += 1;
    acc.set(k, cur);
  }
  return [...acc]
    .map(([id, { sum, count }]) => ({ id, label: id, tint: null, avg: sum / count, count }))
    .sort((a, b) => b.avg - a.avg);
}

function BarList({ rows, title }: { rows: Row[]; title: string }) {
  const max = Math.max(1, ...rows.map((r) => r.avg));
  return (
    <div className="mb-4 rounded-[14px] border border-edge bg-card p-4">
      <div className="eyebrow mb-3 text-mute">{title}</div>
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-3 py-[5px]">
          <span className="w-[86px] shrink-0 truncate font-narrow text-[13px] font-semibold text-soft">
            {r.label}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-[4px] bg-well">
            <span
              className="block h-full rounded-[4px] transition-[width] duration-400 ease-out"
              style={{
                width: `max(${(r.avg / max) * 100}%, 6px)`,
                background: r.tint ?? "var(--color-lime)",
              }}
            />
          </span>
          <span className="w-14 shrink-0 text-right text-[13px] font-semibold tabular-nums">
            {fmtCount(r.avg)}
          </span>
          <span className="w-7 shrink-0 text-right text-[11px] text-faint tabular-nums">
            ×{r.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Insights({ config, lines }: Props) {
  const [range, setRange] = useState<Range>("all");

  const allPosted = lines.filter((l) => l.status === "posted");
  const cutoff = range === "all" ? 0 : Date.now() - Number(range) * DAY_MS;
  const posted = allPosted.filter((l) => (l.postedAt ?? l.createdAt) >= cutoff);
  const withViews = posted.filter((l) => l.metrics?.views !== undefined);

  if (allPosted.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-dim">
        Insights build from posted lines. Post something first.
      </div>
    );
  }

  const rangeControl = (
    <div className="mb-4 flex justify-end">
      <div
        className="flex overflow-hidden rounded-full border border-edge2"
        role="group"
        aria-label="Time range"
      >
        {RANGES.map(([r, label]) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            aria-pressed={range === r}
            className={cx(
              "cursor-pointer border-none px-3.5 py-[7px] text-xs font-semibold transition-colors",
              range === r ? "bg-edge text-fg" : "bg-transparent text-dim hover:text-soft",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  if (withViews.length === 0) {
    return (
      <div>
        {rangeControl}
        <div className="px-5 py-10 text-center text-sm leading-relaxed text-dim">
          {posted.length === 0 ? (
            <>Nothing posted in this window.</>
          ) : (
            <>
              No stats logged{range === "all" ? " yet" : " in this window"}.
              <br />
              Open a posted line, tap <span className="text-soft">+ Add stats</span>, and drop in
              the views once a post has been up for a day or two.
            </>
          )}
        </div>
      </div>
    );
  }

  // Aggregate formulas ported from the Zingo tracker's Performance tab.
  const totalViews = withViews.reduce((s, l) => s + l.metrics!.views!, 0);
  const avgViews = Math.round(totalViews / withViews.length);
  const totalLikes = withViews.reduce((s, l) => s + (l.metrics!.likes ?? 0), 0);
  const totalComments = withViews.reduce((s, l) => s + (l.metrics!.comments ?? 0), 0);
  const hasEngagement = totalLikes + totalComments > 0;
  const engRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

  const top = [...withViews]
    .sort((a, b) => b.metrics!.views! - a.metrics!.views!)
    .slice(0, 3);

  const pillarRows: Row[] = avgViewsBy(withViews, (l) => l.pillar).map((r) => {
    const def = pillarOf(config, r.id);
    return { ...r, label: def.label, tint: def.tint };
  });

  const tagRows: Row[] = avgViewsBy(withViews, (l) => l.tag).map((r) => ({
    ...r,
    label: tagOf(config, r.id).label,
  }));

  const platformRows: Row[] = avgViewsBy(withViews, (l) => l.platform ?? null).map((r) => ({
    ...r,
    label: platformOf(r.id).label,
  }));

  const bestPillar = pillarRows[0];
  const bestTag = tagRows[0];
  const showTakeaway = withViews.length >= 3 && (pillarRows.length > 1 || tagRows.length > 1);

  return (
    <div>
      {rangeControl}

      <div className="mb-4 grid grid-cols-3 rounded-[14px] border border-edge bg-card">
        <div className="border-r border-edge px-3 py-3 text-center">
          <div className="text-[20px] leading-7 font-extrabold tabular-nums">
            {fmtCount(totalViews)}
          </div>
          <div className="eyebrow mt-0.5 text-[10px] text-dim">views</div>
        </div>
        <div className="border-r border-edge px-3 py-3 text-center">
          <div className="text-[20px] leading-7 font-extrabold tabular-nums">
            {fmtCount(avgViews)}
          </div>
          <div className="eyebrow mt-0.5 text-[10px] text-dim">avg / post</div>
        </div>
        <div className="px-3 py-3 text-center">
          <div className="text-[20px] leading-7 font-extrabold tabular-nums">
            {hasEngagement ? `${engRate >= 10 ? Math.round(engRate) : engRate.toFixed(1)}%` : "—"}
          </div>
          <div className="eyebrow mt-0.5 text-[10px] text-dim">eng rate</div>
        </div>
      </div>

      {showTakeaway && (
        <div
          className="mb-4 rounded-[4px_14px_14px_4px] border border-lime/25 bg-lime/[0.07] px-4 py-3 text-[14px] leading-relaxed"
          style={{ borderLeft: "3px solid var(--color-lime)" }}
        >
          <span style={{ color: bestPillar.tint ?? "var(--color-lime)" }}>{bestPillar.label}</span>{" "}
          is your strongest pillar at {fmtCount(bestPillar.avg)} avg views
          {tagRows.length > 1 && (
            <>
              {" "}
              — <span className="text-fg">{bestTag.label}</span> hooks lead the styles
            </>
          )}
          .
        </div>
      )}

      <div className="mb-4 rounded-[14px] border border-edge bg-card p-4">
        <div className="eyebrow mb-3 flex items-baseline justify-between text-mute">
          <span>Top posts</span>
          <span className="text-[10px] tracking-[0.1em] text-faint normal-case">
            {withViews.length} of {posted.length} posted have stats
          </span>
        </div>
        {top.map((l, i) => {
          const p = pillarOf(config, l.pillar);
          const m = l.metrics!;
          return (
            <div
              key={l.id}
              className="flex items-start gap-3 border-t border-edge py-2.5 first:border-t-0 first:pt-0 last:pb-0"
            >
              <span className="w-4 shrink-0 pt-px text-right text-[13px] font-extrabold text-faint tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-[14px] leading-snug text-fg">{l.text}</div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-dim">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: p.tint }}
                  />
                  <span className="truncate">
                    {p.label} · {tagOf(config, l.tag).label}
                    {l.postedAt ? ` · ${relTime(l.postedAt)}` : ""}
                  </span>
                  {l.postUrl && (
                    <a
                      href={l.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-[4px] border border-edge2 px-1 py-px font-narrow text-[9px] font-semibold text-soft no-underline hover:text-fg"
                    >
                      {platformOf(l.platform ?? "other").badge} ↗
                    </a>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[15px] font-extrabold tabular-nums">{fmtCount(m.views!)}</div>
                <div className="text-[10px] text-faint">
                  views
                  {m.likes !== undefined ? ` · ${fmtCount(m.likes)} ♥` : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <BarList title="Avg views by pillar" rows={pillarRows} />
      {tagRows.length > 1 && <BarList title="Avg views by style" rows={tagRows} />}
      {platformRows.length > 0 && <BarList title="Avg views by platform" rows={platformRows} />}

      <div className="px-4 py-2 text-center text-[11px] leading-relaxed text-faint">
        Averages use views per post, so a platform you post to less doesn't win on volume alone.
        Small sample sizes swing hard — trust trends after a few posts per pillar.
      </div>
    </div>
  );
}
