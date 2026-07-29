import { adaptBlock } from "./adaptBlock";
import { BlockRenderer } from "./BlockRenderer";
import { getBlockDefForType } from "./blocks";
import type { PageBlock } from "./types";
interface BuilderCanvasBlockProps {
  block: PageBlock;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function BuilderCanvasBlock({
  block,
  selected,
  onSelect,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: BuilderCanvasBlockProps) {
  const adapted = adaptBlock(block);
  const def = getBlockDefForType(block.type);
  const label = def?.label ?? block.type;

  return (
    <div className="group relative" onClick={(e) => { e.stopPropagation(); onSelect(); }} data-block-id={block.id}>
      <div
        className={`pointer-events-none absolute inset-0 z-10 border-2 transition ${
          selected ? "border-[#6366f1]" : "border-transparent group-hover:border-[#6366f1]/40"
        }`}
      />

      <div
        className={`absolute left-3 top-0 z-20 flex -translate-y-1/2 items-center overflow-hidden rounded-md border border-[#6366f1] bg-[#6366f1] shadow-sm transition ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <button
          type="button"
          className="cursor-grab px-2 py-1.5 text-[11px] text-white hover:bg-[#4f46e5]"
          title="Move up/down via arrows"
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
        >
          ↑
        </button>
        <button
          type="button"
          className="border-l border-[#4f46e5] px-2 py-1.5 text-[11px] text-white hover:bg-[#4f46e5]"
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          title="Move down"
        >
          ↓
        </button>
        <span className="border-l border-[#4f46e5] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white max-w-[140px] truncate">
          {label}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="border-l border-[#4f46e5] px-2 py-1.5 text-[11px] text-white hover:bg-[#4f46e5]"
          title="Duplicate"
        >
          ⧉
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="border-l border-[#4f46e5] px-2 py-1.5 text-[11px] text-white hover:bg-[#4f46e5]"
          title="Delete"
        >
          🗑
        </button>
      </div>

      {adapted ? (
        <BlockRenderer block={adapted} />
      ) : (
        <div className="px-10 py-12 text-center text-sm text-[#9ca3af] border-b border-dashed border-[#e5e7eb]">
          Unsupported block: <span className="font-mono">{block.type}</span>
        </div>
      )}
    </div>
  );
}
