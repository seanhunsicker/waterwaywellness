import { Config, Line } from "@/types";
import { dayKey } from "@/lib/time";

interface Props {
  config: Config;
  lines: Line[];
}

/**
 * Shows only on scheduled posting days (Settings → Posting days).
 * Rest days stay silent — a schedule shouldn't nag on days off.
 */
export function PostingDayBanner({ config, lines }: Props) {
  if (config.postDays.length === 0) return null;
  const now = new Date();
  if (!config.postDays.includes(now.getDay())) return null;

  const today = dayKey(now.getTime());
  const shipped = lines.some((l) => l.postedAt !== undefined && dayKey(l.postedAt) === today);

  if (shipped) {
    return (
      <div className="mb-4 flex items-center gap-2 px-1 text-[12px] text-dim">
        <span aria-hidden className="text-lime">✓</span>
        Posting day — shipped.
      </div>
    );
  }

  return (
    <div
      className="mb-4 flex items-center gap-3 rounded-[4px_14px_14px_4px] border border-lime/25 bg-lime/[0.07] px-4 py-3"
      style={{ borderLeft: "3px solid var(--color-lime)" }}
    >
      <span className="text-[14px]">
        <span className="font-bold text-lime">Posting day</span>
        <span className="text-soft"> — nothing shipped yet.</span>
      </span>
    </div>
  );
}
