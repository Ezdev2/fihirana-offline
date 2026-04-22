import { useRef, useState } from "react";
import {
  GripVertical,
  Copy,
  Trash2,
  Plus,
  RotateCcw,
  Upload,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { StructureItem, SuggestedStructure } from "../hooks/useStructure";

interface Part {
  id: string;
  type: string;
}

interface StructureEditorProps {
  items: StructureItem[];
  parts: Part[];
  labels: string[];
  suggestedStructures: SuggestedStructure[];
  isFetchingSuggested: boolean;
  shareStatus: "idle" | "uploading" | "done" | "exists" | "error";
  isOnline: boolean;
  onMove: (from: number, to: number) => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
  onAdd: (partId: string, label: string) => void;
  onReset: () => void;
  onShare: () => void;
  onApplySuggested: (s: SuggestedStructure) => void;
}

export function StructureEditor({
  items,
  parts,
  labels,
  suggestedStructures,
  isFetchingSuggested,
  shareStatus,
  isOnline,
  onMove,
  onDuplicate,
  onRemove,
  onAdd,
  onReset,
  onShare,
  onApplySuggested,
}: StructureEditorProps) {
  const [showSuggested, setShowSuggested] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const dragIndex = useRef<number | null>(null);

  // ─── Drag handlers ─────────────────────────────────────────────────────────

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    onMove(dragIndex.current, index);
    dragIndex.current = index;
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
  };

  // ─── Touch drag (mobile) ──────────────────────────────────────────────────
  // Simple up/down move buttons for mobile as fallback
  const moveUp = (i: number) => {
    if (i > 0) onMove(i, i - 1);
  };
  const moveDown = (i: number) => {
    if (i < items.length - 1) onMove(i, i + 1);
  };

  const partTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t === "chorus") return "bg-purple-100 text-purple-700 border-purple-200";
    if (t === "extra") return "bg-orange-100 text-orange-700 border-orange-200";
    if (t === "bridge") return "bg-teal-100 text-teal-700 border-teal-200";
    return "bg-indigo-100 text-indigo-700 border-indigo-200";
  };

  const shareButtonContent = () => {
    if (shareStatus === "uploading")
      return (
        <>
          <Upload size={14} className="animate-pulse" />
          <span>En cours...</span>
        </>
      );
    if (shareStatus === "done")
      return (
        <>
          <Check size={14} />
          <span>Partagé !</span>
        </>
      );
    if (shareStatus === "exists")
      return (
        <>
          <AlertCircle size={14} />
          <span>Structure existante</span>
        </>
      );
    return (
      <>
        <Upload size={14} />
        <span>Partager en ligne</span>
      </>
    );
  };

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Firafitry ny hira
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Aroseso hanamboarana ny fandaharana
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          title="Avereno ny tany am-boalohany"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition px-2 py-1 rounded-xl hover:bg-slate-100"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>

      {/* Structure slots */}
      <div className="space-y-2">
        {items.map((item, index) => {
          const originalPart = parts.find((p) => p.id === item.partId);
          const colorClass = originalPart
            ? partTypeColor(originalPart.type)
            : "bg-slate-100 text-slate-600 border-slate-200";

          return (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="flex items-center gap-2 rounded-2xl border bg-white p-3 shadow-sm select-none cursor-grab active:cursor-grabbing active:shadow-md transition-shadow"
            >
              <div className="text-slate-300 hover:text-slate-500 touch-none">
                <GripVertical size={16} />
              </div>

              <span
                className={`flex-1 rounded-xl border px-3 py-1 text-xs font-semibold ${colorClass}`}
              >
                {item.label}
              </span>

              {/* Mobile move buttons */}
              <div className="flex gap-0.5 md:hidden">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 disabled:opacity-30 hover:bg-slate-100 transition"
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === items.length - 1}
                  className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 disabled:opacity-30 hover:bg-slate-100 transition"
                >
                  <ChevronDown size={13} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onDuplicate(index)}
                title="Avereno"
                className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
              >
                <Copy size={13} />
              </button>
              <button
                type="button"
                onClick={() => onRemove(index)}
                title="Esory"
                disabled={items.length <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add part button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowAddMenu((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-2.5 text-xs font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
        >
          <Plus size={14} />
          <span>Ampiana ampahany</span>
        </button>
        {showAddMenu && (
          <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-2xl border border-white/70 bg-white shadow-lg p-2 space-y-1">
            {parts.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onAdd(p.id, labels[i]);
                  setShowAddMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition text-left"
              >
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs font-semibold border ${partTypeColor(p.type)}`}
                >
                  {labels[i]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Share + Suggested */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-1 font-medium">
          ✓ Voatahiry ifotony
        </span>

        {isOnline && (
          <button
            type="button"
            onClick={onShare}
            disabled={shareStatus === "uploading"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border transition ${
              shareStatus === "done"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : shareStatus === "exists"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
            }`}
          >
            {shareButtonContent()}
          </button>
        )}
      </div>

      {/* Suggested structures section */}
      {isOnline && (
        <div>
          <button
            type="button"
            onClick={() => setShowSuggested((v) => !v)}
            className="flex w-full items-center justify-between text-xs text-slate-500 hover:text-slate-700 transition py-1"
          >
            <span className="font-semibold uppercase tracking-wide">
              Fandaharana natolotra
              {suggestedStructures.length > 0 &&
                ` (${suggestedStructures.length})`}
            </span>
            {showSuggested ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>

          {showSuggested && (
            <div className="mt-2 space-y-2">
              {isFetchingSuggested && (
                <p className="text-xs text-slate-400 text-center py-2">
                  Mitady...
                </p>
              )}
              {!isFetchingSuggested && suggestedStructures.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2 italic">
                  Tsy misy fandaharana natolotra ho an'ity hira ity.
                </p>
              )}
              {suggestedStructures.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                    {s.structure.map((pid, si) => {
                      const partIdx = parts.findIndex((p) => p.id === pid);
                      const lbl =
                        partIdx >= 0 ? labels[partIdx] : pid;
                      return (
                        <span
                          key={si}
                          className="text-[10px] bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-600 font-medium"
                        >
                          {lbl}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => onApplySuggested(s)}
                    className="shrink-0 text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 rounded-full px-3 py-1 hover:bg-purple-100 transition"
                  >
                    Ampiasao
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}