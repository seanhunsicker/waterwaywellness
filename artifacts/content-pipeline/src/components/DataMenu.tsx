import { useRef } from "react";
import { Config, Line, STATUSES, pillarOf, tagOf } from "@/types";
import { ImportPayload, exportJson, parseImport } from "@/lib/storage";
import { dayKey } from "@/lib/time";
import { fmtCount } from "@/lib/format";

interface Props {
  lines: Line[];
  config: Config;
  onImport: (payload: ImportPayload) => { addedLines: number; addedConfig: number };
  onNotice: (msg: string) => void;
}

export function DataMenu({ lines, config, onImport, onNotice }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportJson(lines, config)], { type: "application/json" });
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
      const payload = parseImport(await file.text());
      if (payload.lines.length === 0 && !payload.config) {
        onNotice("No lines found in that file");
        return;
      }
      const { addedLines, addedConfig } = onImport(payload);
      if (addedLines === 0) {
        onNotice(
          addedConfig > 0
            ? `Added ${addedConfig} pillar${addedConfig === 1 ? "" : "s"}/styles from file`
            : "Nothing new — all those lines are already here",
        );
      }
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
      const rows = group.map((l) => {
        const views =
          l.metrics?.views !== undefined ? ` (${fmtCount(l.metrics.views)} views)` : "";
        return `- [${pillarOf(config, l.pillar).label} / ${tagOf(config, l.tag).label}] ${l.text}${views}`;
      });
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
