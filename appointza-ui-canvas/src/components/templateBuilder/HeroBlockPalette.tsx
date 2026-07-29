import type { ElementType } from "react";
import {
  AlignCenter,
  AlignLeft,
  Columns2,
  ImageIcon,
  Minimize2,
  Plus,
  Video,
} from "lucide-react";
import type { TemplateBuilderBlockType } from "@/types/templateBuilder.types";
import { cn } from "@/lib/utils";

type HeroPaletteMeta = {
  icon: ElementType;
  tone: string;
  layout: "center" | "split" | "minimal" | "image-bg" | "left" | "video";
};

const HERO_META: Record<string, HeroPaletteMeta> = {
  hero: { icon: AlignCenter, tone: "from-[#6366f1] via-[#8b5cf6] to-[#a855f7]", layout: "center" },
  "hero-2": { icon: Columns2, tone: "from-[#0ea5e9] via-[#6366f1] to-[#8b5cf6]", layout: "split" },
  "hero-3": { icon: Minimize2, tone: "from-[#0f172a] to-[#1e293b]", layout: "minimal" },
  "hero-4": { icon: ImageIcon, tone: "from-[#334155] to-[#0f172a]", layout: "image-bg" },
  "hero-5": { icon: AlignLeft, tone: "from-[#f8fafc] to-[#e2e8f0]", layout: "left" },
  "hero-6": { icon: Video, tone: "from-[#18181b] via-[#27272a] to-[#0f172a]", layout: "video" },
};

function HeroLayoutSketch({ layout }: { layout: HeroPaletteMeta["layout"] }) {
  const bar = "rounded-full bg-white/90";
  const faint = "rounded bg-white/35";

  switch (layout) {
    case "center":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4">
          <div className={cn(bar, "h-2 w-3/5")} />
          <div className={cn(faint, "h-1.5 w-4/5")} />
          <div className={cn(bar, "mt-1 h-2 w-1/4")} />
        </div>
      );
    case "split":
      return (
        <div className="grid h-full grid-cols-2 gap-2 p-3">
          <div className="flex flex-col justify-center gap-1.5">
            <div className={cn(bar, "h-1.5 w-full")} />
            <div className={cn(faint, "h-1 w-4/5")} />
            <div className={cn(bar, "mt-1 h-1.5 w-2/5")} />
          </div>
          <div className="rounded-lg border border-white/20 bg-white/15" />
        </div>
      );
    case "minimal":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6">
          <div className={cn(bar, "h-1.5 w-2/5")} />
          <div className={cn(faint, "h-1 w-3/5")} />
          <div className="mt-1 h-4 w-16 rounded-full border border-white/40" />
        </div>
      );
    case "image-bg":
      return (
        <div className="relative h-full">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.2),rgba(15,23,42,0.65))]" />
          <div className="relative flex h-full flex-col items-center justify-center gap-2 px-4">
            <div className={cn(bar, "h-2 w-3/5")} />
            <div className={cn(faint, "h-1.5 w-2/5")} />
          </div>
        </div>
      );
    case "left":
      return (
        <div className="grid h-full grid-cols-[1.2fr_0.8fr] gap-2 p-3">
          <div className="flex flex-col justify-center gap-1.5">
            <div className="h-1.5 w-full rounded bg-slate-700/80" />
            <div className="h-1 w-4/5 rounded bg-slate-400/60" />
            <div className="mt-1 h-1.5 w-2/5 rounded-full bg-slate-800/90" />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-100/80" />
        </div>
      );
    case "video":
      return (
        <div className="relative h-full">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.04)_8px,transparent_8px,transparent_16px)]" />
          <div className="relative flex h-full flex-col items-center justify-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-white/10">
              <Video className="h-3 w-3 text-white/90" />
            </div>
            <div className={cn(bar, "h-1.5 w-2/5")} />
          </div>
        </div>
      );
  }
}

type HeroBlockPaletteProps = {
  blocks: TemplateBuilderBlockType[];
  onAdd: (type: string) => void;
};

export function HeroBlockPalette({ blocks, onAdd }: HeroBlockPaletteProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#FFD4CC] bg-gradient-to-br from-[#FFF8F5] to-white p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#E85D4C]">
          Hero / Banner
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
          Full-width hero sections with headline, subtitle, and book CTA.
        </p>
      </div>
      <div className="grid gap-2">
        {blocks.map((bt) => {
          const meta = HERO_META[bt.type] ?? HERO_META.hero;
          const Icon = meta.icon;
          const isLight = bt.type === "hero-5";

          return (
            <button
              key={bt.type}
              type="button"
              onClick={() => onAdd(bt.type)}
              className="group overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm transition-all hover:border-[#FFB4A8] hover:shadow-md"
            >
              <div
                className={cn(
                  "relative h-[72px] overflow-hidden bg-gradient-to-br",
                  meta.tone,
                  isLight && "border-b border-stone-100",
                )}
              >
                <HeroLayoutSketch layout={meta.layout} />
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg bg-black/20 text-white backdrop-blur-sm">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
              <div className="flex items-start gap-2 p-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#E85D4C] transition-colors group-hover:bg-[#E85D4C] group-hover:text-white">
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-appointza-navy">{bt.name}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-stone-500">
                    {bt.description}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
