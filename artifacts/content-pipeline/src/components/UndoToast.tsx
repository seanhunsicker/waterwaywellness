import { useEffect } from "react";
import { UndoState } from "@/hooks/useLines";

interface Props {
  undo: UndoState | null;
  notice: string | null;
  onUndo: () => void;
  onDismissUndo: () => void;
}

export function UndoToast({ undo, notice, onUndo, onDismissUndo }: Props) {
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(onDismissUndo, 6000);
    return () => clearTimeout(t);
  }, [undo, onDismissUndo]);

  if (!undo && !notice) return null;

  return (
    <div
      role="status"
      className="toast-in fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-fg py-2.5 pr-3 pl-4 text-[13px] font-semibold whitespace-nowrap text-ink shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
    >
      {undo ? (
        <>
          <span>{undo.label}</span>
          <button
            onClick={onUndo}
            className="cursor-pointer rounded-full border-none bg-ink px-3 py-1 text-xs font-extrabold text-lime"
          >
            Undo
          </button>
        </>
      ) : (
        <span className="pr-1">{notice}</span>
      )}
    </div>
  );
}
