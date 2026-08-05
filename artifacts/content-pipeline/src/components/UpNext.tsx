import { Line, pillarOf } from "@/types";

interface Props {
  line: Line;
  onFilm: (id: string) => void;
}

/** Surfaces the hottest un-filmed line so "what do I shoot?" has an answer. */
export function UpNext({ line, onFilm }: Props) {
  const p = pillarOf(line.pillar);
  return (
    <div
      className="mb-4 flex items-center gap-3 rounded-[4px_14px_14px_4px] border border-ember/25 bg-ember/[0.07] py-3 pr-3 pl-4"
      style={{ borderLeft: "3px solid var(--color-ember)" }}
    >
      <div className="min-w-0 flex-1">
        <div className="eyebrow mb-1 flex items-center gap-2 text-ember">
          <span aria-hidden className="flex gap-[3px]">
            {[1, 2, 3].map((h) => (
              <span
                key={h}
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: line.heat >= h ? "var(--color-ember)" : "transparent",
                  border: "1px solid var(--color-ember)",
                }}
              />
            ))}
          </span>
          Film this next
          <span className="normal-case tracking-normal text-dim">· {p.label}</span>
        </div>
        <div className="truncate text-[14px] text-fg">{line.text}</div>
      </div>
      <button
        onClick={() => onFilm(line.id)}
        className="shrink-0 cursor-pointer rounded-full border-none bg-ember px-3.5 py-[7px] text-xs font-bold text-ink transition-opacity hover:opacity-90"
      >
        Filmed
      </button>
    </div>
  );
}
