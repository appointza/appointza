import type { Viewport } from "./BuilderTopBar";
import { BuilderCanvasBlock } from "./BuilderCanvasBlock";
import type { PageBlock, SitePageSettings } from "./types";

const VIEWPORT_WIDTH: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

interface BuilderCanvasProps {
  blocks: PageBlock[];
  pageSettings?: SitePageSettings;
  viewport: Viewport;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}

export function BuilderCanvas({
  blocks,
  pageSettings,
  viewport,
  selectedId,
  onSelect,
  onDuplicate,
  onRemove,
  onMove,
}: BuilderCanvasProps) {
  const bg = pageSettings?.backgroundColor ?? "#FAF8F3";
  const color = pageSettings?.textColor ?? "#1F2937";

  return (
    <main
      className="flex-1 min-w-0 overflow-auto bg-[#f3f4f6]"
      onClick={() => onSelect(null)}
    >
      <div className="flex justify-center p-6 md:p-10 min-h-full">
        <div
          className="w-full shadow-2xl border border-[#e5e7eb] bg-white transition-[max-width] duration-200 min-h-[70vh]"
          style={{ maxWidth: VIEWPORT_WIDTH[viewport], backgroundColor: bg, color }}
        >
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
              <p className="text-sm font-semibold text-[#111827]">Empty canvas</p>
              <p className="mt-2 max-w-xs text-xs text-[#9ca3af] leading-relaxed">
                Pick a block from the left library to start building your property website.
              </p>
            </div>
          ) : (
            blocks.map((block) => (
              <BuilderCanvasBlock
                key={block.id}
                block={block}
                selected={selectedId === block.id}
                onSelect={() => onSelect(block.id)}
                onDuplicate={() => onDuplicate(block.id)}
                onRemove={() => onRemove(block.id)}
                onMoveUp={() => onMove(block.id, -1)}
                onMoveDown={() => onMove(block.id, 1)}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
