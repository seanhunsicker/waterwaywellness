import { useRef, useState } from "react";
import { Check, Copy, Undo2, X } from "lucide-react";
import { Heat, Line, STATUSES, pillarOf, tagOf } from "@/types";
import { relTime } from "@/lib/time";
import { cx } from "@/lib/cx";

interface Props {
  line: Line;
  onPatch: (id: string, changes: Partial<Line>) => void;
  onAdvance: (id: string) => void;
  onStepBack: (id: string) => void;
  onSetHeat: (id: string, h: Heat) => void;
  onRemove: (id: string) => void;
}

export function LineCard({ line, onPatch, onAdvance, onStepBack, onSetHeat, onRemove }: Props) {
  const p = pillarOf(line.pillar);
  const t = tagOf(line.tag);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(line.text);
  const [copied, setCopied] = useState(false);
  const cancelRef = useRef(false);

  const startEdit = () => {
    setValue(line.text);
    setEditing(true);
  };

  const save = () => {
    setEditing(false);
    const v = value.trim();
    if (v && v !== line.text) onPatch(line.id, { text: v });
  };

  const cancel = () => {
    cancelRef.current = true;
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

  const prevStatus = STATUSES[Math.max(0, STATUSES.indexOf(line.status) - 1)];

  return (
    <div
      className="line-in mb-2.5 rounded-[4px_14px_14px_4px] bg-card px-4 py-3.5"
      style={{ borderLeft: `3px solid ${p.tint}` }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="eyebrow tracking-[0.12em]" style={{ color: p.tint }}>
          {p.label} · {t.label}
        </span>
        <span className="text-[11px] text-faint tabular-nums">· {relTime(line.createdAt)}</span>
        <span className="ml-auto flex items-center gap-1">
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
        <textarea
          className="mb-3 w-full resize-none rounded-[8px] border border-edge3 bg-well px-2.5 py-2 text-[15px] leading-[1.45] text-fg field-sizing-content"
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
          onBlur={() => {
            if (cancelRef.current) {
              cancelRef.current = false;
              return;
            }
            save();
          }}
        />
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
    </div>
  );
}
