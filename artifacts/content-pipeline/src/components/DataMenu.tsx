import { useRef } from "react";
import { Line, STATUSES, pillarOf, tagOf } from "@/types";
import { exportJson, parseImport } from "@/lib/storage";
import { dayKey } from "@/lib/time";

interface Props {
  lines: Line[];
  onImport: (lines: Line[]) => number;
  onNotice: (msg: string) => void;
}

export function DataMenu({ lines, onImport, onNotice }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportJson(lines)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-pipeline-${dayKey(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pickFile = () => fileRef.current?.click();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = parseImport(await file.text());
      if (imported.length === 0) {
        onNotice("No lines found in that file");
        return;
      }
      const added = onImport(imported);
      if (added === 0) onNotice("Nothing new — all those lines are already here");
    } catch {
      onNotice("Couldn't read that file");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const copyAll = async () => {
    const blocks = STATUSES.map((s) => {
      const group = lines.filter((l) => l.status === s);
      if (group.length === 0) return null;
      const rows = group.map(
        (l) => `- [${pillarOf(l.pillar).label} / ${tagOf(l.tag).label}] ${l.text}`,
      );
      return `${s.toUpperCase()}\n${rows.join("\n")}`;
    }).filter(Boolean);
    try {
      await navigator.clipboard.writeText(blocks.join("\n\n"));
      onNotice(`Copied ${lines.length} line${lines.length === 1 ? "" : "s"}`);
    } catch {
      onNotice("Clipboard unavailable");
    }
  };

  const btn =
    "cursor-pointer border-none bg-transparent p-1 font-narrow text-[11px] font-semibold tracking-[0.14em] uppercase text-dim transition-colors hover:text-soft";

  return (
    <footer className="mt-8 text-center">
      <div className="flex items-center justify-center gap-1">
        <button className={btn} onClick={download} disabled={lines.length === 0}>
          Export
        </button>
        <span className="text-faint">·</span>
        <button className={btn} onClick={pickFile}>
          Import
        </button>
        <span className="text-faint">·</span>
        <button className={btn} onClick={copyAll} disabled={lines.length === 0}>
          Copy all
        </button>
      </div>
      <div className="mt-2 text-[11px] text-faint">
        {lines.length} line{lines.length === 1 ? "" : "s"} · stored locally on this device
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </footer>
  );
}
