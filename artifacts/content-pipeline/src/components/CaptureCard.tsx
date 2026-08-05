import { useRef, useState } from "react";
import { PILLARS, PillarId, TAGS, TagId } from "@/types";
import { cx } from "@/lib/cx";

interface Props {
  onAdd: (text: string, pillar: PillarId, tag: TagId) => void;
}

export function CaptureCard({ onAdd }: Props) {
  const [draft, setDraft] = useState("");
  const [pillar, setPillar] = useState<PillarId>("golf");
  const [tag, setTag] = useState<TagId>("R");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!draft.trim()) return;
    onAdd(draft, pillar, tag);
    setDraft("");
    inputRef.current?.focus();
  };

  return (
    <div className="mb-4 rounded-[14px] border border-edge bg-card p-4">
      <input
        ref={inputRef}
        data-capture-input
        className="mb-3 w-full rounded-[10px] border border-edge2 bg-well px-3.5 py-3.5 text-base text-fg transition-colors focus:border-edge3"
        value={draft}
        placeholder="One line. What you noticed."
        aria-label="Capture a line"
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) submit();
        }}
      />
      <div className="mb-2 flex flex-wrap gap-2">
        {PILLARS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPillar(p.id)}
            aria-pressed={pillar === p.id}
            className="cursor-pointer rounded-full border bg-transparent px-3.5 py-[7px] text-[13px] font-semibold transition-colors"
            style={{
              borderColor: pillar === p.id ? p.tint : "var(--color-edge2)",
              color: pillar === p.id ? p.tint : "var(--color-mute)",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {TAGS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTag(t.id)}
            aria-pressed={tag === t.id}
            className={cx(
              "cursor-pointer rounded-full border bg-transparent px-3.5 py-[7px] text-[13px] font-semibold transition-colors",
              tag === t.id ? "border-fg text-fg" : "border-edge2 text-mute hover:text-soft",
            )}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="ml-auto cursor-pointer rounded-full border-none bg-lime px-5 py-2 text-[13px] font-extrabold text-ink transition-opacity disabled:cursor-default disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
