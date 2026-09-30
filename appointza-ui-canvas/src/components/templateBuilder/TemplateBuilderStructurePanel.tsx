import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Layers, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TemplateBuilderBlock } from "@/types/templateBuilder.types";
import { getBlockMeta } from "@/utils/templateBuilder/catalog";
import { cn } from "@/lib/utils";

type TemplateBuilderStructurePanelProps = {
  blocks: TemplateBuilderBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onToggleVisible: (id: string, visible: boolean) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onDelete: (id: string) => void;
  onEditBlock: (id: string) => void;
};

export function TemplateBuilderStructurePanel({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onToggleVisible,
  onMove,
  onDelete,
  onEditBlock,
}: TemplateBuilderStructurePanelProps) {
  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-10 text-center">
        <Layers className="mb-3 h-8 w-8 text-stone-400" />
        <p className="text-sm font-medium text-stone-700">No sections yet</p>
        <p className="mt-1 max-w-[220px] text-xs text-stone-500">
          Tap Add, then tap a piece to put it on your page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-stone-500">
        Top to bottom on the live page. Tap one to change it.
      </p>
      {blocks.map((block, idx) => {
        const meta = getBlockMeta(block.type);
        const isSelected = selectedBlockId === block.id;
        const label = meta?.name ?? block.type;

        return (
          <div
            key={block.id}
            className={cn(
              "rounded-xl border transition-colors",
              isSelected
                ? "border-orange-400 bg-orange-50/70 shadow-sm ring-1 ring-orange-200"
                : "border-stone-200 bg-white hover:border-stone-300",
              !block.visible && "opacity-60",
            )}
          >
            <button
              type="button"
              className="flex w-full items-start gap-2 p-2.5 text-left"
              onClick={() => onSelectBlock(block.id)}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-100 text-[11px] font-bold text-stone-600">
                {idx + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="block truncate text-sm font-medium text-appointza-navy">{label}</span>
                  {meta?.mode === "appointza" ? (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                      Auto data
                    </Badge>
                  ) : null}
                  {!block.visible ? (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-stone-500">
                      Hidden
                    </Badge>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-[11px] text-stone-500">
                  {meta?.description ?? "Custom section"}
                </span>
              </span>
              <GripVertical className="mt-1 h-4 w-4 shrink-0 text-stone-300" aria-hidden />
            </button>

            <div className="flex items-center gap-0.5 border-t border-stone-100 px-1.5 py-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 flex-1 gap-1 text-xs"
                onClick={() => onEditBlock(block.id)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title={block.visible ? "Hide on page" : "Show on page"}
                onClick={() => onToggleVisible(block.id, !block.visible)}
              >
                {block.visible ? (
                  <Eye className="h-4 w-4 text-stone-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-stone-400" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={idx === 0}
                title="Move up"
                onClick={() => onMove(idx, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={idx === blocks.length - 1}
                title="Move down"
                onClick={() => onMove(idx, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700"
                title="Remove section"
                onClick={() => onDelete(block.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
