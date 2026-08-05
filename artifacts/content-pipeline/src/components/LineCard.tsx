import { useState } from "react";
import { Check, Copy, Heart, MessageCircle, Play, Plus, Undo2, X } from "lucide-react";
import { Config, Heat, Line, STATUSES, pillarOf, platformOf, tagOf } from "@/types";
import { StatsInput } from "@/hooks/useLines";
import { detectPlatform } from "@/lib/platform";
import { relTime } from "@/lib/time";
import { fmtCount, parseMetric } from "@/lib/format";
import { cx } from "@/lib/cx";

interface Props {
  config: Config;
  line: Line;
  onPatch: (id: string, changes: Partial<Line>) => void;
  onLogStats: (id: string, input: StatsInput) => void;
  onAdvance: (id: string) => void;
  onStepBack: (id: string) => void;
  onSetHeat: (id: string, h: Heat) => void;
  onRemove: (id: string) => void;
}

export function LineCard({ config, line, onPatch, onLogStats, onAdvance, onStepBack, onSetHeat, onRemove }: Props) {
  const p = pillarOf(config, line.pillar);
  const t = tagOf(config, line.tag);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(line.text);
  const [editPillar, setEditPillar] = useState(line.pillar);
  const [editTag, setEditTag] = useState(line.tag);
  const [copied, setCopied] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [mViews, setMViews] = useState("");
  const [mLikes, setMLikes] = useState("");
  const [mComments, setMComments] = useState("");
  const [mUrl, setMUrl] = useState("");

  const startEdit = () => {
    setValue(line.text);
    setEditPillar(line.pillar);
    setEditTag(line.tag);
    setEditing(true);
  };

  const save = () => {
    setEditing(false);
    const v = value.trim();
    if (!v) return;
    if (v !== line.text || editPillar !== line.pillar || editTag !== line.tag) {
      onPatch(line.id, { text: v, pillar: editPillar, tag: editTag });
    }
  };

  const cancel = () => {
    setEditing(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(line.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable (permissions / http) — nothing to do
    }
  };

  const openStats = () => {
    setMViews(line.metrics?.views !== undefined ? String(line.metrics.views) : "");
    setMLikes(line.metrics?.likes !== undefined ? String(line.metrics.likes) : "");
    setMComments(line.metrics?.comments !== undefined ? String(line.metrics.comments) : "");
    setMUrl(line.postUrl ?? "");
    setStatsOpen(true);
  };

  const saveStats = () => {
    setStatsOpen(false);
    onLogStats(line.id, {
      views: parseMetric(mViews),
      likes: parseMetric(mLikes),
      comments: parseMetric(mComments),
      url: mUrl,
    });
  };

  const prevStatus = STATUSES[Math.max(0, STATUSES.indexOf(line.status) - 1)];
  const m = line.metrics;
  const snaps = line.snapshots ?? [];
  const prevSnap = snaps.length >= 2 ? snaps[snaps.length - 2] : null;
  const viewsDelta =
    prevSnap && m?.views !== undefined && prevSnap.views !== undefined
      ? m.views - prevSnap.views
      : null;

  return (
    <div
      className="line-in mb-2.5 rounded-[4px_14px_14px_4px] bg-card px-4 py-3.5"
      style={{ borderLeft: `3px solid ${p.tint}` }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="eyebrow truncate tracking-[0.12em]" style={{ color: p.tint }}>
          {p.label} · {t.label}
        </span>
        <span className="shrink-0 text-[11px] text-faint tabular-nums">· {relTime(line.createdAt)}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          <button
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy line"}
            title="Copy line"
            className="cursor-pointer rounded-md border-none bg-transparent p-1 text-faint transition-colors hover:text-fg"
          >
            {copied ? <Check size={14} className="text-lime" /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => onRemove(line.id)}
            aria-label="Delete line"
            title="Delete line"
            className="cursor-pointer rounded-md border-none bg-transparent p-1 text-faint transition-colors hover:text-ember"
          >
            <X size={15} />
          </button>
        </span>
      </div>

      {editing ? (
        <div className="mb-3">
          <textarea
            className="w-full resize-none rounded-[8px] border border-edge3 bg-well px-2.5 py-2 text-[15px] leading-[1.45] text-fg field-sizing-content"
            value={value}
            rows={2}
            autoFocus
            onFocus={(e) => {
              const n = e.currentTarget.value.length;
              e.currentTarget.setSelectionRange(n, n);
            }}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape") cancel();
            }}
          />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {config.pillars.map((cp) => (
              <button
                key={cp.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setEditPillar(cp.id)}
                aria-pressed={editPillar === cp.id}
                className="cursor-pointer rounded-full border bg-transparent px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  borderColor: editPillar === cp.id ? cp.tint : "var(--color-edge2)",
                  color: editPillar === cp.id ? cp.tint : "var(--color-dim)",
                }}
              >
                {cp.label}
              </button>
            ))}
            <span aria-hidden className="mx-1 text-faint">·</span>
            {config.tags.map((ct) => (
              <button
                key={ct.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setEditTag(ct.id)}
                aria-pressed={editTag === ct.id}
                className={cx(
                  "cursor-pointer rounded-full border bg-transparent px-2.5 py-1 text-[11px] font-semibold",
                  editTag === ct.id ? "border-fg text-fg" : "border-edge2 text-dim",
                )}
              >
                {ct.label}
              </button>
            ))}
            <span className="ml-auto flex gap-1.5">
              <button
                onClick={cancel}
                className="cursor-pointer rounded-full border border-edge2 bg-transparent px-3 py-1 text-[11px] font-semibold text-mute"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="cursor-pointer rounded-full border-none bg-lime px-3 py-1 text-[11px] font-extrabold text-ink"
              >
                Save
              </button>
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={startEdit}
          title="Tap to edit"
          className="-mx-1.5 mb-2 block w-[calc(100%+12px)] cursor-text rounded-[8px] border-none bg-transparent px-1.5 py-1 text-left text-[15px] leading-[1.45] text-fg transition-colors hover:bg-well/60"
        >
          {line.text}
        </button>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {([1, 2, 3] as Heat[]).map((h) => (
            <button
              key={h}
              onClick={() => onSetHeat(line.id, h)}
              aria-label={`Heat ${h}${line.heat === h ? " (tap to clear)" : ""}`}
              aria-pressed={line.heat >= h}
              className="h-[13px] w-[13px] cursor-pointer rounded-full p-0 transition-colors"
              style={{
                border: `1.5px solid ${line.heat >= h ? "var(--color-ember)" : "var(--color-edge3)"}`,
                background: line.heat >= h ? "var(--color-ember)" : "transparent",
              }}
            />
          ))}
          <span className="eyebrow ml-1 text-[10px] tracking-[0.1em] text-dim">heat</span>
        </div>

        <div className="flex items-center gap-1.5">
          {line.status !== "captured" && (
            <button
              onClick={() => onStepBack(line.id)}
              aria-label={`Back to ${prevStatus}`}
              title={`Back to ${prevStatus}`}
              className="cursor-pointer rounded-full border-none bg-transparent p-1.5 text-faint transition-colors hover:text-fg"
            >
              <Undo2 size={14} />
            </button>
          )}
          {line.status === "posted" ? (
            <span className="rounded-full bg-lime/10 px-3.5 py-[7px] text-xs font-bold text-lime">
              Posted{line.postedAt ? ` · ${relTime(line.postedAt)}` : ""}
            </span>
          ) : (
            <button
              onClick={() => onAdvance(line.id)}
              className={cx(
                "cursor-pointer rounded-full border-none px-[15px] py-[7px] text-xs font-bold transition-colors",
                line.status === "filmed"
                  ? "bg-lime text-ink hover:opacity-90"
                  : "bg-edge text-fg hover:bg-edge2",
              )}
            >
              {line.status === "captured" ? "Mark filmed" : "Mark posted"}
            </button>
          )}
        </div>
      </div>

      {line.status === "posted" && (
        <div className="mt-3 border-t border-edge pt-2.5">
          {statsOpen ? (
            <div>
              <label className="mb-2 flex flex-col gap-1">
                <span className="eyebrow text-[9px] tracking-[0.12em] text-dim">
                  Post link{mUrl.trim() ? ` · ${platformOf(detectPlatform(mUrl)).label}` : ""}
                </span>
                <input
                  value={mUrl}
                  onChange={(e) => setMUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveStats();
                    if (e.key === "Escape") setStatsOpen(false);
                  }}
                  inputMode="url"
                  placeholder="Paste the TikTok / IG / YouTube link"
                  className="w-full rounded-[8px] border border-edge2 bg-well px-2 py-1.5 text-[13px] text-fg"
                />
              </label>
              <div className="flex flex-wrap items-end gap-2">
                {(
                  [
                    ["Views", mViews, setMViews],
                    ["Likes", mLikes, setMLikes],
                    ["Comments", mComments, setMComments],
                  ] as const
                ).map(([lab, val, set]) => (
                  <label key={lab} className="flex min-w-0 flex-1 basis-16 flex-col gap-1">
                    <span className="eyebrow text-[9px] tracking-[0.12em] text-dim">{lab}</span>
                    <input
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveStats();
                        if (e.key === "Escape") setStatsOpen(false);
                      }}
                      inputMode="numeric"
                      placeholder="—"
                      className="w-full rounded-[8px] border border-edge2 bg-well px-2 py-1.5 text-[13px] text-fg tabular-nums"
                    />
                  </label>
                ))}
                <span className="flex gap-1.5">
                  <button
                    onClick={() => setStatsOpen(false)}
                    className="cursor-pointer rounded-full border border-edge2 bg-transparent px-3 py-1.5 text-[11px] font-semibold text-mute"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveStats}
                    className="cursor-pointer rounded-full border-none bg-lime px-3 py-1.5 text-[11px] font-extrabold text-ink"
                  >
                    Save
                  </button>
                </span>
              </div>
            </div>
          ) : m || line.postUrl ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-soft">
              {line.postUrl && (
                <a
                  href={line.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open on ${platformOf(line.platform ?? "other").label}`}
                  className="rounded-[5px] border border-edge2 px-1.5 py-0.5 font-narrow text-[10px] font-semibold tracking-[0.08em] text-soft no-underline transition-colors hover:border-edge3 hover:text-fg"
                >
                  {platformOf(line.platform ?? "other").badge} ↗
                </a>
              )}
              <button
                onClick={openStats}
                title="Update stats"
                className="flex cursor-pointer flex-wrap items-center gap-3 rounded-md border-none bg-transparent p-0 text-[12px] text-soft"
              >
                {m?.views !== undefined && (
                  <span className="flex items-center gap-1">
                    <Play size={11} aria-hidden className="text-dim" />
                    <span className="font-semibold tabular-nums">{fmtCount(m.views)}</span>
                    <span className="sr-only">views</span>
                  </span>
                )}
                {viewsDelta !== null && viewsDelta !== 0 && (
                  <span
                    className={cx(
                      "text-[10px] font-bold tabular-nums",
                      viewsDelta > 0 ? "text-lime" : "text-ember",
                    )}
                    title={`Since last check (${relTime(prevSnap!.at)} ago)`}
                  >
                    {viewsDelta > 0 ? "▲" : "▼"} {fmtCount(Math.abs(viewsDelta))}
                  </span>
                )}
                {m?.likes !== undefined && (
                  <span className="flex items-center gap-1">
                    <Heart size={11} aria-hidden className="text-dim" />
                    <span className="font-semibold tabular-nums">{fmtCount(m.likes)}</span>
                    <span className="sr-only">likes</span>
                  </span>
                )}
                {m?.comments !== undefined && (
                  <span className="flex items-center gap-1">
                    <MessageCircle size={11} aria-hidden className="text-dim" />
                    <span className="font-semibold tabular-nums">{fmtCount(m.comments)}</span>
                    <span className="sr-only">comments</span>
                  </span>
                )}
                <span className="text-[10px] text-faint">{m ? "update" : "add stats"}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={openStats}
              className="flex cursor-pointer items-center gap-1 rounded-md border-none bg-transparent p-0 text-[12px] font-semibold text-dim transition-colors hover:text-soft"
            >
              <Plus size={12} aria-hidden /> Add stats
            </button>
          )}
        </div>
      )}
    </div>
  );
}
