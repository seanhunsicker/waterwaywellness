import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Config, Line, MAX_PILLARS, MAX_TAGS, SWATCHES } from "@/types";
import { cx } from "@/lib/cx";

interface Props {
  config: Config;
  lines: Line[];
  onBrand: (changes: Partial<Pick<Config, "eyebrow" | "heading">>) => void;
  onUpdatePillar: (id: string, changes: { label?: string; tint?: string }) => void;
  onAddPillar: () => string | null;
  onRemovePillar: (id: string) => void;
  onUpdateTag: (id: string, changes: { label?: string }) => void;
  onAddTag: () => string | null;
  onRemoveTag: (id: string) => void;
  onSetPostDays: (days: number[]) => void;
  onReset: () => void;
  onNotice: (msg: string) => void;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const inputCls =
  "w-full rounded-[10px] border border-edge2 bg-well px-3 py-2.5 text-[14px] text-fg transition-colors focus:border-edge3";

export function Settings(props: Props) {
  const { config, lines } = props;
  const [swatchesFor, setSwatchesFor] = useState<string | null>(null);
  const [resetArmed, setResetArmed] = useState(false);

  const usage = (kind: "pillar" | "tag", id: string) =>
    lines.filter((l) => (kind === "pillar" ? l.pillar === id : l.tag === id)).length;

  const removeGuarded = (kind: "pillar" | "tag", id: string) => {
    const used = usage(kind, id);
    if (used > 0) {
      props.onNotice(
        `${used} line${used === 1 ? " uses" : "s use"} this — edit those lines to move them first`,
      );
      return;
    }
    if (kind === "pillar") props.onRemovePillar(id);
    else props.onRemoveTag(id);
  };

  const usedTints = new Set(config.pillars.map((p) => p.tint));

  return (
    <div>
      <div className="mb-4 rounded-[14px] border border-edge bg-card p-4">
        <div className="eyebrow mb-3 text-mute">Make it yours</div>
        <label className="mb-3 block">
          <span className="eyebrow mb-1.5 block text-[10px] text-dim">Small label</span>
          <input
            className={inputCls}
            value={config.eyebrow}
            maxLength={28}
            onChange={(e) => props.onBrand({ eyebrow: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-1.5 block text-[10px] text-dim">Heading</span>
          <input
            className={inputCls}
            value={config.heading}
            maxLength={28}
            onChange={(e) => props.onBrand({ heading: e.target.value })}
          />
        </label>
      </div>

      <div className="mb-4 rounded-[14px] border border-edge bg-card p-4">
        <div className="eyebrow mb-1 flex items-baseline justify-between text-mute">
          <span>Pillars</span>
          <span className="text-[10px] text-faint tabular-nums">
            {config.pillars.length} / {MAX_PILLARS}
          </span>
        </div>
        <p className="mt-0 mb-3 text-[11px] leading-relaxed text-faint">
          Your content buckets. Rename them to match what you make.
        </p>
        {config.pillars.map((p) => (
          <div key={p.id} className="mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSwatchesFor(swatchesFor === p.id ? null : p.id)}
                aria-label={`Change color for ${p.label}`}
                aria-expanded={swatchesFor === p.id}
                className="h-6 w-6 shrink-0 cursor-pointer rounded-full border-2 border-transparent p-0 transition-transform hover:scale-110"
                style={{ background: p.tint }}
              />
              <input
                className={inputCls}
                value={p.label}
                maxLength={20}
                aria-label="Pillar name"
                onChange={(e) => props.onUpdatePillar(p.id, { label: e.target.value })}
              />
              <span className="w-8 shrink-0 text-right text-[11px] text-faint tabular-nums">
                {usage("pillar", p.id) || ""}
              </span>
              <button
                onClick={() => removeGuarded("pillar", p.id)}
                disabled={config.pillars.length <= 1}
                aria-label={`Delete ${p.label}`}
                className="shrink-0 cursor-pointer rounded-md border-none bg-transparent p-1 text-faint transition-colors hover:text-ember disabled:cursor-default disabled:opacity-30"
              >
                <X size={15} />
              </button>
            </div>
            {swatchesFor === p.id && (
              <div className="mt-2 mb-1 flex gap-2.5 pl-8">
                {SWATCHES.map((s) => {
                  const taken = usedTints.has(s) && p.tint !== s;
                  return (
                    <button
                      key={s}
                      disabled={taken}
                      aria-label={taken ? "Color in use" : "Use this color"}
                      onClick={() => {
                        props.onUpdatePillar(p.id, { tint: s });
                        setSwatchesFor(null);
                      }}
                      className={cx(
                        "h-7 w-7 cursor-pointer rounded-full p-0 transition-transform",
                        p.tint === s ? "ring-2 ring-fg ring-offset-2 ring-offset-card" : "hover:scale-110",
                        taken && "cursor-default opacity-25",
                      )}
                      style={{ background: s }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {config.pillars.length < MAX_PILLARS && (
          <button
            onClick={() => props.onAddPillar()}
            className="mt-1 flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-edge3 bg-transparent px-3.5 py-[7px] text-xs font-semibold text-mute transition-colors hover:text-fg"
          >
            <Plus size={13} aria-hidden /> Add pillar
          </button>
        )}
      </div>

      <div className="mb-4 rounded-[14px] border border-edge bg-card p-4">
        <div className="eyebrow mb-1 flex items-baseline justify-between text-mute">
          <span>Hook styles</span>
          <span className="text-[10px] text-faint tabular-nums">
            {config.tags.length} / {MAX_TAGS}
          </span>
        </div>
        <p className="mt-0 mb-3 text-[11px] leading-relaxed text-faint">
          Why someone watches: relatable, valuable, entertaining — or your own take.
        </p>
        {config.tags.map((t) => (
          <div key={t.id} className="mb-2 flex items-center gap-2">
            <input
              className={inputCls}
              value={t.label}
              maxLength={20}
              aria-label="Style name"
              onChange={(e) => props.onUpdateTag(t.id, { label: e.target.value })}
            />
            <span className="w-8 shrink-0 text-right text-[11px] text-faint tabular-nums">
              {usage("tag", t.id) || ""}
            </span>
            <button
              onClick={() => removeGuarded("tag", t.id)}
              disabled={config.tags.length <= 1}
              aria-label={`Delete ${t.label}`}
              className="shrink-0 cursor-pointer rounded-md border-none bg-transparent p-1 text-faint transition-colors hover:text-ember disabled:cursor-default disabled:opacity-30"
            >
              <X size={15} />
            </button>
          </div>
        ))}
        {config.tags.length < MAX_TAGS && (
          <button
            onClick={() => props.onAddTag()}
            className="mt-1 flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-edge3 bg-transparent px-3.5 py-[7px] text-xs font-semibold text-mute transition-colors hover:text-fg"
          >
            <Plus size={13} aria-hidden /> Add style
          </button>
        )}
      </div>

      <div className="mb-4 rounded-[14px] border border-edge bg-card p-4">
        <div className="eyebrow mb-1 text-mute">Posting days</div>
        <p className="mt-0 mb-3 text-[11px] leading-relaxed text-faint">
          Days you plan to post. On those days the pipeline shows whether you've shipped — other
          days stay quiet. Leave all off for no schedule.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((label, day) => {
            const on = config.postDays.includes(day);
            return (
              <button
                key={day}
                onClick={() =>
                  props.onSetPostDays(
                    on ? config.postDays.filter((d) => d !== day) : [...config.postDays, day],
                  )
                }
                aria-pressed={on}
                className={cx(
                  "h-9 w-9 cursor-pointer rounded-full border text-[12px] font-bold transition-colors",
                  on
                    ? "border-lime bg-lime text-ink"
                    : "border-edge2 bg-transparent text-mute hover:text-soft",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 rounded-[14px] border border-edge bg-card p-4">
        <div className="eyebrow mb-2 text-mute">Start over</div>
        <button
          onClick={() => {
            if (resetArmed) {
              props.onReset();
              setResetArmed(false);
              props.onNotice("Settings reset to defaults");
            } else {
              setResetArmed(true);
              setTimeout(() => setResetArmed(false), 3000);
            }
          }}
          className={cx(
            "cursor-pointer rounded-full border px-4 py-2 text-xs font-bold transition-colors",
            resetArmed
              ? "border-ember bg-ember text-ink"
              : "border-edge2 bg-transparent text-mute hover:text-fg",
          )}
        >
          {resetArmed ? "Tap again to confirm" : "Reset settings to defaults"}
        </button>
        <p className="mt-2 mb-0 text-[11px] text-faint">
          Puts labels, pillars, and styles back to how they started. Your lines aren't touched.
        </p>
      </div>
    </div>
  );
}
