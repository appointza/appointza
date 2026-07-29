import { useMemo } from "react";
import { adaptBlock } from "./adaptBlock";
import { BlockRenderer } from "./BlockRenderer";
import type { PageBlock, SitePageSettings } from "./types";
import { cn } from "@/lib/utils";

interface SitePreviewProps {
  blocks: PageBlock[];
  pageSettings?: SitePageSettings;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

export function SitePreview({ blocks, pageSettings, selectedId, onSelect, className }: SitePreviewProps) {
  const bg = pageSettings?.backgroundColor ?? "#FAF9F7";
  const color = pageSettings?.textColor ?? "#14181C";

  const rendered = useMemo(
    () =>
      blocks.map((block) => {
        const adapted = adaptBlock(block);
        return { block, adapted };
      }),
    [blocks],
  );

  return (
    <div
      className={cn("stay-elegant min-h-full text-foreground", className)}
      style={{ backgroundColor: bg, color }}
    >
      {rendered.map(({ block, adapted }) => {
        if (!adapted) {
          return (
            <div
              key={block.id}
              className={cn(
                "px-10 py-8 border-b border-dashed border-border text-sm text-muted-foreground",
                selectedId === block.id && "ring-2 ring-primary ring-inset",
              )}
              onClick={() => onSelect?.(block.id)}
              onKeyDown={(e) => e.key === "Enter" && onSelect?.(block.id)}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
            >
              Unsupported block: <span className="font-mono">{block.type}</span>
            </div>
          );
        }

        return (
          <div
            key={block.id}
            className={cn(
              "relative group",
              onSelect && "cursor-pointer",
              selectedId === block.id && "ring-2 ring-primary ring-inset z-10",
            )}
            onClick={() => onSelect?.(block.id)}
            onKeyDown={(e) => e.key === "Enter" && onSelect?.(block.id)}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
          >
            {onSelect && (
              <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-mono uppercase tracking-widest bg-foreground text-background px-2 py-1 rounded">
                  {block.type}
                </span>
              </div>
            )}
            <BlockRenderer block={adapted} />
          </div>
        );
      })}
    </div>
  );
}
